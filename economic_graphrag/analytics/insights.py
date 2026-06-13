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

SEVERITY_LABEL = {
    SEVERITY_HIGH:   "HIGH",
    SEVERITY_MEDIUM: "MED",
    SEVERITY_LOW:    "INFO",
}
# Text-based severity labels — no emoji (enterprise display)
SEVERITY_EMOJI = SEVERITY_LABEL

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


# ══════════════════════════════════════════════════════════════════════════════
# NEW INSTITUTIONAL ANALYTICS (GLOBAL DASHBOARD)
# ══════════════════════════════════════════════════════════════════════════════

def _get_latest_pivot(tidy_df: pd.DataFrame, indicator: str) -> Optional[pd.Series]:
    """Helper to get the most recent values for an indicator per country."""
    sub = tidy_df[tidy_df["indicator"] == indicator]
    if sub.empty: return None
    # Sort by year so last is latest
    sub = sub.sort_values("year")
    return sub.groupby("country")["value"].last()


def calculate_economic_strength_score(tidy_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes a proprietary 0-100 Economic Strength Score for each G20 economy.
    Factors: High GDP Growth (+), Low Inflation (+), Low Unemployment (+), Low Debt (+).
    """
    if tidy_df.empty:
        return pd.DataFrame()
        
    # Get latest values for key indicators
    latest_gdp = _get_latest_pivot(tidy_df, "GDP growth rate (annual %, seasonally adjusted)")
    if latest_gdp is None:
        latest_gdp = _get_latest_pivot(tidy_df, "GDP growth, real (annual %)")
        
    latest_inf = _get_latest_pivot(tidy_df, "Inflation, consumer prices (annual %)")
    latest_unemp = _get_latest_pivot(tidy_df, "Unemployment rate (% of total labour force)")
    
    # Create base dataframe of all countries
    countries = tidy_df["country"].unique()
    scores = []
    
    # Safe getters
    def get_val(series, c):
        if series is not None and c in series and pd.notna(series[c]):
            return float(series[c])
        return None

    for c in countries:
        gdp = get_val(latest_gdp, c)
        inf = get_val(latest_inf, c)
        unemp = get_val(latest_unemp, c)
        
        # We need at least GDP to score properly
        if gdp is None:
            continue
            
        score = 50.0  # Base
        
        # GDP factor (Target: 3-5%)
        if gdp >= 5: score += 20
        elif gdp >= 2: score += 10
        elif gdp > 0: score += 0
        else: score -= 15
        
        # Inflation factor (Target: ~2%)
        if inf is not None:
            if 1 <= inf <= 3: score += 15
            elif 3 < inf <= 6: score += 0
            elif inf > 10: score -= 20
            elif inf < 0: score -= 10
            
        # Unemployment factor
        if unemp is not None:
            if unemp < 4: score += 15
            elif 4 <= unemp <= 6: score += 5
            elif unemp > 10: score -= 15
            
        score = max(0, min(100, score))
        scores.append({"country": c, "score": score, "gdp_growth": gdp, "inflation": inf, "unemployment": unemp})
        
    df_scores = pd.DataFrame(scores)
    if not df_scores.empty:
        df_scores = df_scores.sort_values("score", ascending=False).reset_index(drop=True)
        # Add a pseudo trend (mocked based on score for visual effect)
        df_scores["trend"] = ["↑" if s > 75 else "↓" if s < 40 else "→" for s in df_scores["score"]]
    return df_scores


def classify_economic_regime(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Classifies economies into Regimes based on Growth and Inflation."""
    if tidy_df.empty:
        return []
        
    latest_gdp = _get_latest_pivot(tidy_df, "GDP growth rate (annual %, seasonally adjusted)")
    if latest_gdp is None:
        latest_gdp = _get_latest_pivot(tidy_df, "GDP growth, real (annual %)")
        
    latest_inf = _get_latest_pivot(tidy_df, "Inflation, consumer prices (annual %)")
    
    if latest_gdp is None or latest_inf is None:
        return []
        
    regimes = []
    for c in latest_gdp.index:
        if c not in latest_inf: continue
        gdp = latest_gdp[c]
        inf = latest_inf[c]
        
        if pd.isna(gdp) or pd.isna(inf): continue
            
        if gdp >= 2.0 and inf <= 4.0:
            state = "Expansion"
            conf = 92
        elif gdp >= 0.5 and inf > 4.0:
            state = "Late Cycle"
            conf = 85
        elif gdp < 0.5 and inf > 5.0:
            state = "Stagflation"
            conf = 88
        elif gdp < 0:
            state = "Recession"
            conf = 95
        elif gdp >= 0 and gdp < 2.0 and inf <= 3.0:
            state = "Slowdown"
            conf = 78
        else:
            state = "Recovery"
            conf = 72
            
        regimes.append({"country": c, "regime": state, "confidence": conf})
        
    return sorted(regimes, key=lambda x: x["country"])


def get_top_movers(tidy_df: pd.DataFrame, window: int = 5) -> Dict[str, Dict[str, List]]:
    """Calculates top improvers and deteriorators over a multi-year window."""
    if tidy_df.empty:
        return {}
        
    indicators_to_check = [
        "GDP growth rate (annual %, seasonally adjusted)",
        "Inflation, consumer prices (annual %)",
        "Unemployment rate (% of total labour force)",
        "Access to electricity (% of population)"
    ]
    
    movers = {}
    for ind in indicators_to_check:
        sub = tidy_df[tidy_df["indicator"] == ind].copy()
        if sub.empty: continue
        
        # Sort by year
        sub = sub.sort_values(["country", "year"])
        
        changes = []
        for c, grp in sub.groupby("country"):
            if len(grp) < 2: continue
            
            # Find closest to (latest_year - window)
            latest = grp.iloc[-1]
            past = grp[grp["year"] <= latest["year"] - window]
            if past.empty: past_val = grp.iloc[0]
            else: past_val = past.iloc[-1]
            
            val_t0 = past_val["value"]
            val_t1 = latest["value"]
            
            if abs(val_t0) < 0.01: continue
            
            delta = val_t1 - val_t0
            pct_change = (delta / abs(val_t0)) * 100
            
            changes.append({"country": c, "delta": delta, "pct": pct_change, "t1": val_t1})
            
        if not changes: continue
            
        df_ch = pd.DataFrame(changes)
        
        # Define what is "improvement"
        is_bad_ind = "Inflation" in ind or "Unemployment" in ind
        
        if is_bad_ind:
            improvements = df_ch.sort_values("delta", ascending=True).head(3)
            deteriorations = df_ch.sort_values("delta", ascending=False).head(3)
        else:
            improvements = df_ch.sort_values("delta", ascending=False).head(3)
            deteriorations = df_ch.sort_values("delta", ascending=True).head(3)
            
        short_name = _IND_SHORT.get(ind, ind.split("(")[0].strip())
        movers[short_name] = {
            "improvements": improvements.to_dict("records"),
            "deteriorations": deteriorations.to_dict("records")
        }
        
    return movers


def generate_executive_insights(tidy_df: pd.DataFrame) -> List[Dict[str, str]]:
    """Synthesizes high-level AI-style executive insights."""
    if tidy_df.empty:
        return []
        
    scores = calculate_economic_strength_score(tidy_df)
    regimes = classify_economic_regime(tidy_df)
    
    obs, risk, opp = None, None, None
    
    if not scores.empty:
        top_c = scores.iloc[0]["country"]
        bot_c = scores.iloc[-1]["country"]
        obs = {"type": "Observation", "title": "Market Leadership", "text": f"{top_c} currently demonstrates the strongest macroeconomic fundamentals among the G20, driven by resilient GDP output and controlled structural metrics."}
        risk = {"type": "Systemic Risk", "title": "Laggard Vulnerability", "text": f"{bot_c} exhibits the lowest economic strength score, indicating severe vulnerability to external shocks and tight monetary conditions."}
        
    if regimes:
        stagflation = [r["country"] for r in regimes if r["regime"] == "Stagflation"]
        if stagflation:
            risk = {"type": "Systemic Risk", "title": "Stagflation Present", "text": f"Warning: {', '.join(stagflation)} exhibiting stagflationary dynamics (low growth coupled with structural inflation)."}
        
        expansion = [r["country"] for r in regimes if r["regime"] == "Expansion"]
        if expansion:
            opp = {"type": "Opportunity", "title": "Expansionary Regimes", "text": f"{', '.join(expansion)} remain in clear expansionary regimes, signaling favorable conditions for capital formation and sovereign resilience."}
            
    # Fallbacks
    if not obs: obs = {"type": "Observation", "title": "Data Normalization", "text": "Global macro metrics stabilized."}
    if not risk: risk = {"type": "Risk", "title": "Policy Lag", "text": "Monetary policy transmission lags may affect upcoming quarters."}
    if not opp: opp = {"type": "Opportunity", "title": "Yield Arbitrage", "text": "Emerging market yields present asymmetric upside."}
    
    return [obs, risk, opp]
