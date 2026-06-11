# economic_graphrag/analytics/insights.py
"""
Smart Insights Engine — automatically detects notable economic patterns,
outliers, trend reversals, and record values in the ingested dataset.

Returns structured insight objects for display in the UI.
"""
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


# Insight severity levels
SEVERITY_HIGH   = "high"
SEVERITY_MEDIUM = "medium"
SEVERITY_LOW    = "info"

SEVERITY_EMOJI = {
    SEVERITY_HIGH:   "🔴",
    SEVERITY_MEDIUM: "🟡",
    SEVERITY_LOW:    "🔵",
}

# Indicators to analyze for insights
_FOCUS_INDICATORS = [
    "GDP growth, real (annual %)",
    "GDP growth rate (annual %, seasonally adjusted)",
    "Inflation, average consumer prices (annual %)",
    "Inflation, consumer prices (annual %)",
    "Unemployment rate, IMF WEO (%)",
    "Unemployment rate (% of total labour force)",
    "General government gross debt (% of GDP)",
    "Central government debt, total (% of GDP)",
    "Current account balance (% of GDP)",
    "Foreign direct investment, net inflows (% of GDP)",
    "CO2 emissions (metric tons per capita)",
    "GDP (current US$)",
]

# Human-friendly short names for the above
_IND_SHORT = {
    "GDP growth, real (annual %)":                     "GDP growth",
    "GDP growth rate (annual %, seasonally adjusted)": "GDP growth",
    "Inflation, average consumer prices (annual %)":   "inflation",
    "Inflation, consumer prices (annual %)":           "inflation",
    "Unemployment rate, IMF WEO (%)":                  "unemployment",
    "Unemployment rate (% of total labour force)":     "unemployment",
    "General government gross debt (% of GDP)":        "govt debt",
    "Central government debt, total (% of GDP)":       "govt debt",
    "Current account balance (% of GDP)":              "current account",
    "Foreign direct investment, net inflows (% of GDP)": "FDI inflows",
    "CO2 emissions (metric tons per capita)":          "CO2 emissions",
    "GDP (current US$)":                               "GDP",
}

# Thresholds that signal HIGH severity regardless of peer comparison
_ABSOLUTE_HIGH = {
    "inflation":      15.0,
    "unemployment":   12.0,
    "govt debt":     120.0,
}
_ABSOLUTE_CONCERN = {
    "inflation":       7.0,
    "unemployment":    8.0,
    "govt debt":      90.0,
    "GDP growth":     -1.0,
}


def _get_latest_pivot(tidy_df: pd.DataFrame, indicator: str,
                      min_year: int = 2018) -> Optional[pd.Series]:
    """Return the most recent value per country for a given indicator."""
    sub = tidy_df[tidy_df["indicator"] == indicator]
    sub = sub[sub["year"] >= min_year]
    if sub.empty:
        return None
    idx = sub.groupby("country")["year"].idxmax()
    latest = sub.loc[idx].set_index("country")["value"]
    return latest if not latest.empty else None


def detect_outliers(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect countries with extreme values (>2σ from G20 mean)."""
    insights = []
    for indicator in _FOCUS_INDICATORS:
        latest = _get_latest_pivot(tidy_df, indicator)
        if latest is None or len(latest) < 4:
            continue
        short = _IND_SHORT.get(indicator, indicator[:30])
        mean_v = latest.mean()
        std_v  = latest.std()
        if std_v < 1e-6:
            continue
        for country, value in latest.items():
            z = (value - mean_v) / std_v
            if abs(z) < 2.0:
                continue
            direction = "highest" if z > 0 else "lowest"
            peer_rank = int(latest.rank(ascending=(z < 0))[country])
            severity  = SEVERITY_HIGH if abs(z) > 3 else SEVERITY_MEDIUM

            # Check absolute thresholds
            abs_high = _ABSOLUTE_HIGH.get(short)
            if abs_high and value > abs_high:
                severity = SEVERITY_HIGH

            insights.append({
                "type":      "outlier",
                "severity":  severity,
                "country":   country,
                "indicator": short,
                "value":     round(float(value), 2),
                "z_score":   round(float(z), 2),
                "headline":  (
                    f"**{country}** has one of the {direction} {short} rates "
                    f"in G20 ({value:+.1f} vs avg {mean_v:.1f})"
                ),
            })

    insights.sort(key=lambda x: abs(x["z_score"]), reverse=True)
    return insights[:20]


def detect_trend_reversals(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect recent significant trend reversals (3-year slope change)."""
    insights = []
    for indicator in _FOCUS_INDICATORS:
        short = _IND_SHORT.get(indicator, indicator[:30])
        sub   = tidy_df[tidy_df["indicator"] == indicator]
        if sub.empty:
            continue

        for country, grp in sub.groupby("country"):
            grp = grp.sort_values("year")
            if len(grp) < 5:
                continue

            recent = grp.tail(3)["value"].values
            older  = grp.tail(6).head(3)["value"].values
            if len(recent) < 2 or len(older) < 2:
                continue

            slope_recent = np.polyfit(range(len(recent)), recent, 1)[0]
            slope_older  = np.polyfit(range(len(older)),  older,  1)[0]

            # Significant reversal: slope changed sign AND magnitude is meaningful
            if slope_recent * slope_older < 0 and abs(slope_recent) > 0.3:
                direction = "rising" if slope_recent > 0 else "falling"
                was_dir   = "falling" if slope_recent > 0 else "rising"
                latest_v  = float(grp.tail(1)["value"].iloc[0])

                severity = SEVERITY_MEDIUM
                if short == "GDP growth" and direction == "falling":
                    severity = SEVERITY_HIGH
                if short == "inflation" and direction == "rising" and latest_v > 5:
                    severity = SEVERITY_HIGH

                insights.append({
                    "type":      "trend_reversal",
                    "severity":  severity,
                    "country":   country,
                    "indicator": short,
                    "value":     round(latest_v, 2),
                    "slope":     round(float(slope_recent), 3),
                    "headline":  (
                        f"**{country}** {short} is now **{direction}** "
                        f"(was {was_dir}) — latest: {latest_v:.1f}"
                    ),
                })

    return insights[:15]


def detect_record_values(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect countries currently near all-time highs or lows (since 2000)."""
    insights = []
    for indicator in _FOCUS_INDICATORS:
        short = _IND_SHORT.get(indicator, indicator[:30])
        sub   = tidy_df[(tidy_df["indicator"] == indicator) & (tidy_df["year"] >= 2000)]
        if sub.empty:
            continue

        for country, grp in sub.groupby("country"):
            if len(grp) < 6:
                continue
            grp = grp.sort_values("year")
            hist_max   = grp["value"].max()
            hist_min   = grp["value"].min()
            latest_v   = float(grp.tail(1)["value"].iloc[0])
            range_size = hist_max - hist_min
            if range_size < 0.5:
                continue

            pct_from_max = abs(latest_v - hist_max) / range_size
            pct_from_min = abs(latest_v - hist_min) / range_size

            if pct_from_max < 0.05:
                label = "all-time high"
                severity = SEVERITY_HIGH if short in ("inflation", "unemployment", "govt debt") else SEVERITY_MEDIUM
                insights.append({
                    "type":      "record",
                    "severity":  severity,
                    "country":   country,
                    "indicator": short,
                    "value":     round(latest_v, 2),
                    "headline":  (
                        f"**{country}** {short} is near an **{label}** since 2000 "
                        f"({latest_v:.1f}, record: {hist_max:.1f})"
                    ),
                })
            elif pct_from_min < 0.05:
                label = "all-time low"
                severity = SEVERITY_HIGH if short == "GDP growth" else SEVERITY_LOW
                insights.append({
                    "type":      "record",
                    "severity":  severity,
                    "country":   country,
                    "indicator": short,
                    "value":     round(latest_v, 2),
                    "headline":  (
                        f"**{country}** {short} is near an **{label}** since 2000 "
                        f"({latest_v:.1f}, record: {hist_min:.1f})"
                    ),
                })

    return insights[:15]


def detect_rapid_changes(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect large YoY changes in key indicators."""
    insights = []
    for indicator in _FOCUS_INDICATORS:
        short = _IND_SHORT.get(indicator, indicator[:30])
        sub   = tidy_df[tidy_df["indicator"] == indicator]
        if sub.empty:
            continue

        for country, grp in sub.groupby("country"):
            grp = grp.sort_values("year")
            if len(grp) < 2:
                continue
            recent = grp.tail(2)
            if len(recent) < 2:
                continue
            prev_v = float(recent.iloc[0]["value"])
            curr_v = float(recent.iloc[1]["value"])
            delta  = curr_v - prev_v
            if abs(prev_v) < 0.01:
                continue
            pct_change = delta / abs(prev_v) * 100

            threshold = 50 if "GDP" in indicator and "per capita" not in indicator else 30
            if abs(pct_change) < threshold and abs(delta) < 3:
                continue

            direction = "surged" if delta > 0 else "dropped"
            severity  = SEVERITY_HIGH if abs(pct_change) > 80 else SEVERITY_MEDIUM
            insights.append({
                "type":      "rapid_change",
                "severity":  severity,
                "country":   country,
                "indicator": short,
                "value":     round(curr_v, 2),
                "delta":     round(delta, 2),
                "headline":  (
                    f"**{country}** {short} {direction} by "
                    f"{abs(delta):.1f} ({abs(pct_change):.0f}%) — now {curr_v:.1f}"
                ),
            })

    return insights[:10]


def generate_all_insights(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Run all insight detectors and return a merged, deduplicated,
    severity-sorted list.
    """
    if tidy_df.empty:
        return []

    all_insights = (
        detect_outliers(tidy_df) +
        detect_trend_reversals(tidy_df) +
        detect_record_values(tidy_df) +
        detect_rapid_changes(tidy_df)
    )

    # Deduplicate (same country + indicator)
    seen = set()
    unique = []
    for ins in all_insights:
        key = (ins["country"], ins["indicator"], ins["type"])
        if key not in seen:
            seen.add(key)
            unique.append(ins)

    # Sort: high severity first, then by abs z_score or delta
    order = {SEVERITY_HIGH: 0, SEVERITY_MEDIUM: 1, SEVERITY_LOW: 2}
    unique.sort(key=lambda x: (order.get(x["severity"], 3),
                                -abs(x.get("z_score", x.get("delta", 0) or 0))))

    return unique[:25]
