# economic_graphrag/analytics/report_generator.py
"""
Economic Report Generator.
Builds a structured narrative report for a country using available data
from the tidy DataFrame, then optionally enhances it with LLM synthesis.
"""
from typing import Any, Dict, List, Optional
import datetime
import pandas as pd


# Key indicators to include in reports (priority-ordered)
REPORT_INDICATORS = [
    ("GDP (current US$)",                                   "GDP (current US$)",       "T"),
    ("GDP growth, real (annual %)",                         "Real GDP Growth",         "%"),
    ("GDP growth rate (annual %, seasonally adjusted)",     "GDP Growth Rate",         "%"),
    ("GDP per capita (current US$)",                        "GDP per Capita",          "$"),
    ("GDP per capita, PPP (current international $)",       "GDP per Capita (PPP)",    "$"),
    ("Inflation, average consumer prices (annual %)",       "Inflation (CPI, avg)",    "%"),
    ("Inflation, consumer prices (annual %)",               "Inflation (CPI)",         "%"),
    ("Unemployment rate, IMF WEO (%)",                      "Unemployment Rate",       "%"),
    ("Unemployment rate (% of total labour force)",         "Unemployment Rate",       "%"),
    ("Trade (% of GDP)",                                    "Trade (% GDP)",           "%"),
    ("Current account balance (% of GDP)",                  "Current Account",         "% GDP"),
    ("General government gross debt (% of GDP)",            "Government Debt",         "% GDP"),
    ("Central government debt, total (% of GDP)",           "Government Debt (WB)",    "% GDP"),
    ("Foreign direct investment, net inflows (% of GDP)",   "FDI Inflows",             "% GDP"),
    ("Gross capital formation (% of GDP)",                  "Capital Formation",       "% GDP"),
    ("Military expenditure (% of GDP)",                     "Military Spending",       "% GDP"),
    ("Research and development expenditure (% of GDP)",     "R&D Expenditure",         "% GDP"),
    ("CO2 emissions (metric tons per capita)",              "CO2 per Capita",          "t"),
    ("Access to electricity (% of population)",             "Electricity Access",      "%"),
    ("Population, total",                                   "Population",              "M"),
]


def _get_series(tidy_df: pd.DataFrame, country: str, indicator: str) -> pd.DataFrame:
    """Extract year/value series for a country/indicator pair."""
    return (
        tidy_df[(tidy_df["country"] == country) & (tidy_df["indicator"] == indicator)]
        .sort_values("year")[["year", "value"]]
    )


def _format_val(value: float, unit: str, indicator_name: str = "") -> str:
    if unit == "T":
        if value > 1e12:
            return f"${value/1e12:.2f} Trillion"
        if value > 1e9:
            return f"${value/1e9:.1f} Billion"
        return f"${value:,.0f}"
    if unit == "$":
        return f"${value:,.0f}"
    if unit == "M":
        return f"{value/1e6:.1f}M"
    return f"{value:.2f} {unit}"


def _trend_arrow(slope: float) -> str:
    if slope > 0.3:
        return "↗ Rising"
    if slope < -0.3:
        return "↘ Falling"
    return "→ Stable"


def build_country_report(
    tidy_df: pd.DataFrame,
    country: str,
    llm_client=None,
) -> Dict[str, Any]:
    """
    Build a comprehensive economic report for the given country.

    Returns:
        {
          'title': str,
          'sections': List[{heading, content}],
          'markdown': str,  (full report as Markdown)
          'raw_data': Dict[indicator_name -> {latest, trend, series}]
        }
    """
    now = datetime.date.today().strftime("%B %Y")
    report_lines = [
        f"# 📊 Economic Intelligence Report: {country}",
        f"*Generated {now} · Source: IMF WEO, World Bank, ECB (hybrid GraphRAG)*",
        "",
    ]

    raw_data: Dict[str, Any] = {}

    # ── Collect metrics ────────────────────────────────────────────────────────
    found_metrics: List[Dict] = []
    seen_names = set()

    for ind_key, ind_label, unit in REPORT_INDICATORS:
        if ind_label in seen_names:
            continue
        df = _get_series(tidy_df, country, ind_key)
        if df.empty:
            continue
        seen_names.add(ind_label)

        latest_row = df.tail(1).iloc[0]
        latest_val = float(latest_row["value"])
        latest_yr  = int(latest_row["year"])

        trend = "→ Stable"
        if len(df) >= 3:
            import numpy as np
            years  = df["year"].values[-5:]
            vals   = df["value"].values[-5:]
            slope  = float(np.polyfit(range(len(years)), vals, 1)[0])
            trend  = _trend_arrow(slope)
        else:
            slope = 0.0

        fmt = _format_val(latest_val, unit, ind_label)
        found_metrics.append({
            "label":   ind_label,
            "value":   latest_val,
            "year":    latest_yr,
            "fmt":     fmt,
            "trend":   trend,
            "slope":   slope,
            "unit":    unit,
            "series":  df,
        })
        raw_data[ind_label] = {
            "latest": latest_val,
            "year":   latest_yr,
            "trend":  trend,
            "series": df,
        }

    if not found_metrics:
        return {
            "title":   f"Economic Report: {country}",
            "sections": [],
            "markdown": f"# {country}\n\n*No economic data available for this country.*",
            "raw_data": {},
        }

    # ── Section 1: Overview ───────────────────────────────────────────────────
    report_lines += ["## 1. Economic Overview", ""]

    def _metric(m):
        return f"- **{m['label']}** ({m['year']}): {m['fmt']} {m['trend']}"

    overview_inds = {"GDP (current US$)", "Real GDP Growth", "GDP Growth Rate",
                     "GDP per Capita", "GDP per Capita (PPP)", "Population"}
    overview = [m for m in found_metrics if m["label"] in overview_inds]
    for m in overview:
        report_lines.append(_metric(m))

    # GDP growth context
    gdp_growth = next((m for m in found_metrics if "Growth" in m["label"]), None)
    if gdp_growth:
        v = gdp_growth["value"]
        yr = gdp_growth["year"]
        if v < 0:
            ctx = f"⚠️ {country} experienced an economic contraction of {v:.1f}% in {yr}."
        elif v < 1.5:
            ctx = f"⚠️ Growth of {v:.1f}% in {yr} is below the typical potential growth rate."
        elif v > 6:
            ctx = f"✅ Strong growth of {v:.1f}% in {yr} reflects robust economic momentum."
        else:
            ctx = f"✅ Moderate growth of {v:.1f}% in {yr}."
        report_lines += ["", ctx]

    # ── Section 2: Price Stability & Monetary Conditions ─────────────────────
    report_lines += ["", "## 2. Price Stability & Monetary Conditions", ""]
    inflation_m = next((m for m in found_metrics if "Inflation" in m["label"]), None)
    if inflation_m:
        v = inflation_m["value"]
        report_lines.append(_metric(inflation_m))
        if v > 10:
            report_lines.append(f"\n⚠️ High inflation of {v:.1f}% is significantly above most central bank targets (2%).")
        elif v < 0:
            report_lines.append(f"\n⚠️ Deflation ({v:.1f}%) may signal weak demand and carry debt-deflation risks.")
        elif 2 <= v <= 4:
            report_lines.append(f"\n✅ Inflation of {v:.1f}% is broadly consistent with price stability targets.")
        else:
            report_lines.append(f"\nInflation of {v:.1f}% warrants monitoring.")
    else:
        report_lines.append("*Inflation data not available.*")

    # ── Section 3: Labour Market ──────────────────────────────────────────────
    report_lines += ["", "## 3. Labour Market", ""]
    unemp_m = next((m for m in found_metrics if "Unemployment" in m["label"]), None)
    if unemp_m:
        v = unemp_m["value"]
        report_lines.append(_metric(unemp_m))
        if v > 10:
            report_lines.append(f"\n⚠️ Unemployment of {v:.1f}% is high and may weigh on consumer spending.")
        elif v < 4:
            report_lines.append(f"\n✅ Unemployment of {v:.1f}% indicates a tight labour market.")
        else:
            report_lines.append(f"\nUnemployment of {v:.1f}% is within a moderate range.")
    else:
        report_lines.append("*Unemployment data not available.*")

    # ── Section 4: External Sector ────────────────────────────────────────────
    report_lines += ["", "## 4. External Sector & Trade", ""]
    ext_inds = {"Trade (% GDP)", "Current Account", "FDI Inflows"}
    ext = [m for m in found_metrics if m["label"] in ext_inds]
    for m in ext:
        report_lines.append(_metric(m))
    ca_m = next((m for m in found_metrics if m["label"] == "Current Account"), None)
    if ca_m:
        v = ca_m["value"]
        if v < -5:
            report_lines.append(f"\n⚠️ Current account deficit of {v:.1f}% GDP represents an external vulnerability.")
        elif v > 5:
            report_lines.append(f"\n✅ Surplus of {v:.1f}% GDP reflects a net creditor position.")

    # ── Section 5: Fiscal Position ────────────────────────────────────────────
    report_lines += ["", "## 5. Fiscal & Debt Position", ""]
    fiscal_inds = {"Government Debt", "Government Debt (WB)", "Capital Formation", "R&D Expenditure"}
    fiscal = [m for m in found_metrics if m["label"] in fiscal_inds]
    for m in fiscal:
        report_lines.append(_metric(m))
    debt_m = next((m for m in found_metrics if "Government Debt" in m["label"]), None)
    if debt_m:
        v = debt_m["value"]
        if v > 100:
            report_lines.append(f"\n⚠️ Government debt of {v:.0f}% GDP is elevated and limits fiscal space.")
        elif v < 40:
            report_lines.append(f"\n✅ Low debt of {v:.0f}% GDP provides substantial fiscal capacity.")

    # ── Section 6: Sustainability ─────────────────────────────────────────────
    sust_inds = {"CO2 per Capita", "Electricity Access", "Military Spending"}
    sust = [m for m in found_metrics if m["label"] in sust_inds]
    if sust:
        report_lines += ["", "## 6. Sustainability & Development", ""]
        for m in sust:
            report_lines.append(_metric(m))

    # ── Section 7: Data Table ─────────────────────────────────────────────────
    report_lines += ["", "## 7. Key Indicators Summary", ""]
    report_lines.append("| Indicator | Latest Value | Year | Trend |")
    report_lines.append("|-----------|-------------|------|-------|")
    for m in found_metrics:
        report_lines.append(f"| {m['label']} | {m['fmt']} | {m['year']} | {m['trend']} |")

    report_lines += ["", "---", f"*Data sources: IMF WEO DataMapper, World Bank Open Data, ECB Data Portal*"]

    full_markdown = "\n".join(report_lines)

    sections = [
        {"heading": "Economic Overview",            "content": "\n".join(report_lines[3:20])},
        {"heading": "Price Stability",              "content": ""},
        {"heading": "Labour Market",                "content": ""},
        {"heading": "External Sector",              "content": ""},
        {"heading": "Fiscal Position",              "content": ""},
    ]

    return {
        "title":    f"Economic Intelligence Report: {country}",
        "markdown": full_markdown,
        "sections": sections,
        "raw_data": raw_data,
        "metrics":  found_metrics,
        "country":  country,
        "generated": now,
    }
