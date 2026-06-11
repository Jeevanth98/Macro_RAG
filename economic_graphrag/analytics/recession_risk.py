# economic_graphrag/analytics/recession_risk.py
"""
Recession Risk Monitor — composite scoring engine.

Computes a 0-17 composite risk score per country based on five dimensions:
  1. GDP Growth   (0–4 pts)
  2. Inflation    (0–4 pts)
  3. Unemployment trend (0–3 pts)
  4. Government Debt (0–3 pts)
  5. Current Account balance (0–3 pts)

Risk levels:
  🟢 Low Risk      (0–4)
  🟡 Moderate Risk (5–8)
  🔴 High Risk     (9+)
"""
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd


# Indicator name candidates (priority order: IMF WEO first, WB fallback)
_GDP_GROWTH_INDS = [
    "GDP growth, real (annual %)",
    "GDP growth rate (annual %, seasonally adjusted)",
]
_INFLATION_INDS = [
    "Inflation, average consumer prices (annual %)",
    "Inflation, consumer prices (annual %)",
    "HICP Inflation (Eurozone, annual %)",
]
_UNEMPLOYMENT_INDS = [
    "Unemployment rate, IMF WEO (%)",
    "Unemployment rate (% of total labour force)",
]
_DEBT_INDS = [
    "General government gross debt (% of GDP)",
    "Central government debt, total (% of GDP)",
]
_CURRENT_ACCOUNT_INDS = [
    "Current account balance (% of GDP)",
]


def _get_latest(df: pd.DataFrame, country: str, indicator_candidates: List[str],
                min_year: int = 2018) -> Optional[Tuple[float, int, str]]:
    """Return (value, year, indicator_name) for the most recent data point."""
    subset = df[df["country"] == country]
    for ind in indicator_candidates:
        rows = subset[subset["indicator"] == ind]
        rows = rows[rows["year"] >= min_year]
        if not rows.empty:
            latest = rows.sort_values("year").iloc[-1]
            return float(latest["value"]), int(latest["year"]), ind
    return None


def _get_recent_trend(df: pd.DataFrame, country: str, indicator_candidates: List[str],
                      years: int = 3) -> Optional[Tuple[float, float]]:
    """
    Return (current_value, previous_value) averaged over the last `years`.
    Used to detect trend direction.
    """
    subset = df[df["country"] == country]
    for ind in indicator_candidates:
        rows = subset[subset["indicator"] == ind].sort_values("year")
        if len(rows) >= 2:
            recent = rows.tail(years)
            older  = rows.tail(years * 2).head(years)
            if not recent.empty and not older.empty:
                return float(recent["value"].mean()), float(older["value"].mean())
    return None


def _score_gdp_growth(value: Optional[float]) -> Tuple[int, str]:
    if value is None:
        return 1, "No data (assumed moderate)"
    if value < -1.0:
        return 4, f"Contraction: {value:.1f}% (recession territory)"
    if value < 0.0:
        return 3, f"Near-zero growth: {value:.1f}% (fragile)"
    if value < 1.0:
        return 2, f"Stagnation: {value:.1f}% (below potential)"
    if value < 2.5:
        return 1, f"Slow growth: {value:.1f}%"
    return 0, f"Healthy growth: {value:.1f}%"


def _score_inflation(value: Optional[float]) -> Tuple[int, str]:
    if value is None:
        return 1, "No data"
    if value > 15.0:
        return 4, f"Hyperinflationary: {value:.1f}% (severe stress)"
    if value > 8.0:
        return 3, f"High inflation: {value:.1f}%"
    if value > 5.0:
        return 2, f"Elevated: {value:.1f}% (above target)"
    if value < -0.5:
        return 2, f"Deflation risk: {value:.1f}%"
    if value < 1.0:
        return 1, f"Below target: {value:.1f}%"
    return 0, f"Near target: {value:.1f}%"


def _score_unemployment_trend(current: Optional[float], previous: Optional[float]) -> Tuple[int, str]:
    if current is None:
        return 1, "No data"
    if previous is None:
        return 0, f"Current: {current:.1f}% (trend unavailable)"
    delta = current - previous
    if delta > 2.0:
        return 3, f"Rapidly rising: +{delta:.1f}pp (current {current:.1f}%)"
    if delta > 1.0:
        return 2, f"Rising: +{delta:.1f}pp (current {current:.1f}%)"
    if delta > 0.3:
        return 1, f"Slightly rising: +{delta:.1f}pp (current {current:.1f}%)"
    if delta < -0.5:
        return 0, f"Improving: {delta:.1f}pp (current {current:.1f}%)"
    return 0, f"Stable: {current:.1f}%"


def _score_govt_debt(value: Optional[float]) -> Tuple[int, str]:
    if value is None:
        return 1, "No data"
    if value > 120.0:
        return 3, f"Very high: {value:.0f}% of GDP"
    if value > 90.0:
        return 2, f"High: {value:.0f}% of GDP"
    if value > 60.0:
        return 1, f"Elevated: {value:.0f}% of GDP (above Maastricht limit)"
    return 0, f"Manageable: {value:.0f}% of GDP"


def _score_current_account(value: Optional[float]) -> Tuple[int, str]:
    if value is None:
        return 1, "No data"
    if value < -7.0:
        return 3, f"Large deficit: {value:.1f}% of GDP"
    if value < -4.0:
        return 2, f"Notable deficit: {value:.1f}% of GDP"
    if value < -1.5:
        return 1, f"Moderate deficit: {value:.1f}% of GDP"
    if value > 5.0:
        return 0, f"Large surplus: {value:.1f}% of GDP (possible imbalance)"
    return 0, f"Balanced: {value:.1f}% of GDP"


def compute_country_risk(tidy_df: pd.DataFrame, country: str) -> Dict[str, Any]:
    """
    Compute a composite recession risk score for one country.

    Returns a dict with:
      score, level, emoji, components (dict), summary, recommendation
    """
    # ── GDP Growth ────────────────────────────────────────────────────────────
    gdp_result = _get_latest(tidy_df, country, _GDP_GROWTH_INDS)
    gdp_val    = gdp_result[0] if gdp_result else None
    gdp_year   = gdp_result[1] if gdp_result else None
    gdp_s, gdp_note = _score_gdp_growth(gdp_val)

    # ── Inflation ─────────────────────────────────────────────────────────────
    inf_result = _get_latest(tidy_df, country, _INFLATION_INDS)
    inf_val    = inf_result[0] if inf_result else None
    inf_s, inf_note = _score_inflation(inf_val)

    # ── Unemployment trend ────────────────────────────────────────────────────
    unemp_trend = _get_recent_trend(tidy_df, country, _UNEMPLOYMENT_INDS, years=2)
    unemp_curr  = unemp_trend[0] if unemp_trend else None
    unemp_prev  = unemp_trend[1] if unemp_trend else None
    unemp_s, unemp_note = _score_unemployment_trend(unemp_curr, unemp_prev)

    # ── Government Debt ───────────────────────────────────────────────────────
    debt_result = _get_latest(tidy_df, country, _DEBT_INDS)
    debt_val    = debt_result[0] if debt_result else None
    debt_s, debt_note = _score_govt_debt(debt_val)

    # ── Current Account ───────────────────────────────────────────────────────
    ca_result = _get_latest(tidy_df, country, _CURRENT_ACCOUNT_INDS)
    ca_val    = ca_result[0] if ca_result else None
    ca_s, ca_note = _score_current_account(ca_val)

    # ── Composite score ───────────────────────────────────────────────────────
    total = gdp_s + inf_s + unemp_s + debt_s + ca_s
    max_possible = 17

    if total <= 4:
        level, emoji, color = "Low", "🟢", "#1a9641"
    elif total <= 8:
        level, emoji, color = "Moderate", "🟡", "#e8b004"
    else:
        level, emoji, color = "High", "🔴", "#d7191c"

    # ── Summary narrative ─────────────────────────────────────────────────────
    main_risks = []
    if gdp_s >= 3:
        main_risks.append("economic contraction")
    if inf_s >= 3:
        main_risks.append("high inflation")
    if unemp_s >= 2:
        main_risks.append("rising unemployment")
    if debt_s >= 2:
        main_risks.append("high government debt")
    if ca_s >= 2:
        main_risks.append("current account imbalance")

    if not main_risks:
        summary = f"{country} shows stable macroeconomic fundamentals with low recession risk."
    else:
        summary = f"{country} faces elevated recession risk driven by: {', '.join(main_risks)}."

    return {
        "country": country,
        "score": total,
        "max_score": max_possible,
        "level": level,
        "emoji": emoji,
        "color": color,
        "score_pct": round(total / max_possible * 100, 1),
        "components": {
            "GDP Growth":          {"score": gdp_s,   "value": gdp_val,   "note": gdp_note,   "year": gdp_year,  "weight": 4},
            "Inflation":           {"score": inf_s,   "value": inf_val,   "note": inf_note,   "year": None,      "weight": 4},
            "Unemployment Trend":  {"score": unemp_s, "value": unemp_curr,"note": unemp_note, "year": None,      "weight": 3},
            "Government Debt":     {"score": debt_s,  "value": debt_val,  "note": debt_note,  "year": None,      "weight": 3},
            "Current Account":     {"score": ca_s,    "value": ca_val,    "note": ca_note,    "year": None,      "weight": 3},
        },
        "summary": summary,
        "main_risks": main_risks,
    }


def compute_all_risks(tidy_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Compute recession risk for all G20 countries in the dataset."""
    countries = sorted(tidy_df["country"].unique())
    results = [compute_country_risk(tidy_df, c) for c in countries]
    results.sort(key=lambda r: r["score"], reverse=True)
    return results


def build_risk_gauge_fig(country_risk: Dict[str, Any]) -> Any:
    """Build a Plotly gauge chart showing the risk score for one country."""
    try:
        import plotly.graph_objects as go
        score = country_risk["score"]
        level = country_risk["level"]
        color = country_risk["color"]

        fig = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=score,
            domain={"x": [0, 1], "y": [0, 1]},
            title={"text": f"{country_risk['country']}<br><b>{level} Risk</b>",
                   "font": {"size": 14}},
            gauge={
                "axis": {"range": [0, 17], "tickwidth": 1, "tickcolor": "#555",
                          "tickvals": [0, 4, 8, 12, 17],
                          "ticktext": ["0", "4", "8", "12", "17"]},
                "bar": {"color": color, "thickness": 0.35},
                "bgcolor": "white",
                "borderwidth": 1,
                "bordercolor": "#ddd",
                "steps": [
                    {"range": [0,  4], "color": "#d4edda"},
                    {"range": [4,  8], "color": "#fff3cd"},
                    {"range": [8, 17], "color": "#f8d7da"},
                ],
                "threshold": {
                    "line": {"color": color, "width": 3},
                    "thickness": 0.75,
                    "value": score,
                },
            },
            number={"font": {"color": color, "size": 28}},
        ))
        fig.update_layout(
            height=220,
            margin=dict(l=15, r=15, t=55, b=15),
            paper_bgcolor="white",
            font={"family": "sans-serif"},
        )
        return fig
    except Exception:
        return None


def build_risk_radar_fig(country_risk: Dict[str, Any]) -> Any:
    """Build a radar chart showing component scores for one country."""
    try:
        import plotly.graph_objects as go
        comps   = country_risk["components"]
        cats    = list(comps.keys())
        scores  = [comps[k]["score"]  for k in cats]
        weights = [comps[k]["weight"] for k in cats]
        normed  = [s / w * 100 for s, w in zip(scores, weights)]
        normed_closed = normed + normed[:1]
        cats_closed   = cats  + cats[:1]

        fig = go.Figure(go.Scatterpolar(
            r=normed_closed,
            theta=cats_closed,
            fill="toself",
            fillcolor=f"rgba({','.join(_hex_to_rgb(country_risk['color']))},0.2)",
            line=dict(color=country_risk["color"], width=2),
            name=country_risk["country"],
            hovertemplate="%{theta}: %{r:.0f}%<extra></extra>",
        ))
        fig.update_layout(
            polar=dict(
                radialaxis=dict(visible=True, range=[0, 100], ticksuffix="%",
                                tickvals=[0, 25, 50, 75, 100]),
                angularaxis=dict(tickfont=dict(size=11)),
            ),
            showlegend=False,
            height=280,
            margin=dict(l=30, r=30, t=30, b=30),
        )
        return fig
    except Exception:
        return None


def _hex_to_rgb(hex_color: str) -> List[str]:
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return ["100", "100", "100"]
    return [str(int(h[i:i+2], 16)) for i in (0, 2, 4)]
