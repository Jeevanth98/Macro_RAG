# economic_graphrag/analytics/data_processor.py
"""
Core data-processing layer: converts raw text chunks into structured pandas
DataFrames for analytics, correlation analysis, trend detection, and forecasting.
"""
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


# ── Country → ISO-3 mapping (World Bank naming) ───────────────────────────────
COUNTRY_ISO3: Dict[str, str] = {
    "United States": "USA",
    "Germany": "DEU",
    "China": "CHN",
    "India": "IND",
    "Japan": "JPN",
    "France": "FRA",
    "Italy": "ITA",
    "United Kingdom": "GBR",
    "Brazil": "BRA",
    "Canada": "CAN",
    "Australia": "AUS",
    "Argentina": "ARG",
    "Mexico": "MEX",
    "Korea, Rep.": "KOR",
    "South Korea": "KOR",
    "Turkiye": "TUR",
    "Turkey": "TUR",
    "Saudi Arabia": "SAU",
    "South Africa": "ZAF",
    "Indonesia": "IDN",
    "Russia": "RUS",
}

INDICATOR_UNITS: Dict[str, str] = {
    # ── World Bank core ──────────────────────────────────────────────────────
    "GDP (current US$)":                                    "Trillion USD",
    "GDP per capita (current US$)":                         "USD",
    "GDP growth rate (annual %, seasonally adjusted)":      "%",
    "Inflation, consumer prices (annual %)":                "%",
    "Unemployment rate (% of total labour force)":          "%",
    "Trade (% of GDP)":                                     "% of GDP",
    "Official exchange rate (LCU per US$)":                 "LCU/USD",
    # ── IMF WEO DataMapper ───────────────────────────────────────────────────
    "GDP growth, real (annual %)":                          "%",
    "Inflation, average consumer prices (annual %)":        "%",
    "Current account balance (% of GDP)":                   "% of GDP",
    "General government gross debt (% of GDP)":             "% of GDP",
    "Unemployment rate, IMF WEO (%)":                       "%",
    # ── ECB Data Portal ──────────────────────────────────────────────────────
    "ECB Main Refinancing Operations Rate":                 "%",
    "ECB Deposit Facility Rate":                            "%",
    "EUR/USD Exchange Rate (ECB)":                          "USD per EUR",
    "HICP Inflation (Eurozone, annual %)":                  "%",
    # ── World Bank Extended ──────────────────────────────────────────────────
    "Foreign direct investment, net inflows (% of GDP)":    "% of GDP",
    "Central government debt, total (% of GDP)":            "% of GDP",
    "Population, total":                                    "millions",
    "GDP per capita, PPP (current international $)":        "Int'l $",
    "Gross capital formation (% of GDP)":                   "% of GDP",
    "Current account balance (% of GDP)":                   "% of GDP",
    "Military expenditure (% of GDP)":                      "% of GDP",
    "Research and development expenditure (% of GDP)":      "% of GDP",
    "Access to electricity (% of population)":              "%",
    "CO2 emissions (metric tons per capita)":               "tons/capita",
    "Policy Interest Rate (%)":                             "%",
}

INDICATOR_SHORT: Dict[str, str] = {
    # ── World Bank core ──────────────────────────────────────────────────────
    "GDP (current US$)":                                    "GDP",
    "GDP per capita (current US$)":                         "GDP per Capita",
    "GDP growth rate (annual %, seasonally adjusted)":      "GDP Growth",
    "Inflation, consumer prices (annual %)":                "Inflation (WB)",
    "Unemployment rate (% of total labour force)":          "Unemployment",
    "Trade (% of GDP)":                                     "Trade % GDP",
    "Official exchange rate (LCU per US$)":                 "Exchange Rate",
    # ── IMF WEO DataMapper ───────────────────────────────────────────────────
    "GDP growth, real (annual %)":                          "GDP Growth (IMF)",
    "Inflation, average consumer prices (annual %)":        "Inflation (IMF)",
    "Current account balance (% of GDP)":                   "Current Account",
    "General government gross debt (% of GDP)":             "Govt Debt",
    "Unemployment rate, IMF WEO (%)":                       "Unemployment (IMF)",
    # ── ECB Data Portal ──────────────────────────────────────────────────────
    "ECB Main Refinancing Operations Rate":                 "ECB MRO Rate",
    "ECB Deposit Facility Rate":                            "ECB Deposit Rate",
    "EUR/USD Exchange Rate (ECB)":                          "EUR/USD",
    "HICP Inflation (Eurozone, annual %)":                  "HICP Inflation",
    # ── World Bank Extended ──────────────────────────────────────────────────
    "Foreign direct investment, net inflows (% of GDP)":    "FDI Inflows",
    "Central government debt, total (% of GDP)":            "Govt Debt (WB)",
    "Population, total":                                    "Population",
    "GDP per capita, PPP (current international $)":        "GDP/Capita PPP",
    "Gross capital formation (% of GDP)":                   "Capital Formation",
    "Military expenditure (% of GDP)":                      "Military Spending",
    "Research and development expenditure (% of GDP)":      "R&D Spending",
    "Access to electricity (% of population)":              "Electricity Access",
    "CO2 emissions (metric tons per capita)":               "CO2 per Capita",
    "Policy Interest Rate (%)":                             "Policy Rate",
}


# ── Low-level parsing ─────────────────────────────────────────────────────────

def _parse_content(content: str) -> pd.DataFrame:
    """
    Parse year/value rows from raw chunk text content.
    Handles scientific notation, commas, leading chunk-index integers.
    Returns DataFrame with columns [year, value].
    """
    rows = []
    pattern = re.compile(
        r"^\s*(?:\d+\s+)?(\d{4})\s+([\d,\.eE\+\-]+)\s*$",
        re.MULTILINE,
    )
    for m in pattern.finditer(content):
        try:
            yr  = int(m.group(1))
            val = float(m.group(2).replace(",", ""))
            if 1990 <= yr <= 2030 and not np.isnan(val) and val != 0.0:
                rows.append({"year": yr, "value": val})
        except ValueError:
            continue
    if not rows:
        return pd.DataFrame(columns=["year", "value"])
    return (
        pd.DataFrame(rows)
        .drop_duplicates("year")
        .sort_values("year")
        .reset_index(drop=True)
    )


def _scale_gdp(series: pd.Series) -> Tuple[pd.Series, str]:
    """Scale GDP absolute values to Trillions."""
    max_v = series.abs().max()
    if max_v > 1e12:
        return series / 1e12, "Trillion USD"
    if max_v > 1e9:
        return series / 1e9, "Billion USD"
    if max_v > 1e6:
        return series / 1e6, "Million USD"
    return series, "USD"


def extract_series(chunk: Dict[str, Any]) -> pd.DataFrame:
    """
    Extract a (year, value) DataFrame from a single chunk.
    Scales GDP to Trillions automatically.
    """
    df = _parse_content(chunk.get("content", ""))
    if df.empty:
        return df
    ind = chunk.get("indicator", "")
    if "GDP" in ind and "per capita" not in ind and "growth" not in ind.lower():
        df["value"], _ = _scale_gdp(df["value"])
    return df


# ── Tidy DataFrame ─────────────────────────────────────────────────────────────

def build_tidy_df(chunks: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert all chunks into a tidy long-form DataFrame:
    columns = [country, indicator, year, value, source]
    """
    rows = []
    for chunk in chunks:
        country   = chunk.get("country", "")
        indicator = chunk.get("indicator", "")
        source    = chunk.get("source", "")
        if not country or not indicator:
            continue
        df = extract_series(chunk)
        if df.empty:
            continue
        df["country"]   = country
        df["indicator"] = indicator
        df["source"]    = source
        rows.append(df)
    if not rows:
        return pd.DataFrame(columns=["country", "indicator", "year", "value", "source"])
    tidy = pd.concat(rows, ignore_index=True)
    return tidy[["country", "indicator", "year", "value", "source"]]


# ── Indicator matrix ──────────────────────────────────────────────────────────

def build_indicator_matrix(
    tidy: pd.DataFrame,
    indicator: str,
) -> pd.DataFrame:
    """
    Pivot tidy DataFrame into a country × year matrix for a single indicator.
    """
    subset = tidy[tidy["indicator"] == indicator]
    if subset.empty:
        return pd.DataFrame()
    pivot = subset.pivot_table(index="country", columns="year", values="value", aggfunc="mean")
    pivot.columns = pivot.columns.astype(int)
    return pivot.sort_index()


def get_latest_values(
    tidy: pd.DataFrame,
    indicator: str,
    preferred_year: int = 2023,
) -> pd.DataFrame:
    """
    Return {country: value, year} for an indicator at the closest available year.
    Returns DataFrame with columns [country, value, year, iso3].
    """
    subset = tidy[tidy["indicator"] == indicator].copy()
    if subset.empty:
        return pd.DataFrame(columns=["country", "value", "year", "iso3"])

    rows = []
    for country, grp in subset.groupby("country"):
        closest = grp.iloc[(grp["year"] - preferred_year).abs().argsort()[:1]]
        rows.append({
            "country": country,
            "value":   float(closest["value"].iloc[0]),
            "year":    int(closest["year"].iloc[0]),
            "iso3":    COUNTRY_ISO3.get(country, ""),
        })
    return pd.DataFrame(rows).sort_values("value", ascending=False).reset_index(drop=True)


# ── Country summary ───────────────────────────────────────────────────────────

def build_country_summary(
    tidy: pd.DataFrame,
    country: str,
    year: int = 2023,
) -> Dict[str, Any]:
    """
    Build a summary dict for a country: latest values for each indicator,
    YoY change, 5-year CAGR.
    """
    subset = tidy[tidy["country"] == country]
    summary: Dict[str, Any] = {"country": country, "indicators": {}}

    for ind, grp in subset.groupby("indicator"):
        grp_sorted = grp.sort_values("year")
        # Latest value
        row_latest = grp_sorted.iloc[(grp_sorted["year"] - year).abs().argsort()[:1]]
        latest_val  = float(row_latest["value"].iloc[0])
        latest_year = int(row_latest["year"].iloc[0])

        # YoY change
        prev = grp_sorted[grp_sorted["year"] == latest_year - 1]
        yoy  = None
        if not prev.empty:
            prev_val = float(prev["value"].iloc[0])
            if prev_val != 0:
                yoy = (latest_val - prev_val) / abs(prev_val) * 100

        # 5-year CAGR
        cagr = None
        old = grp_sorted[grp_sorted["year"] == latest_year - 5]
        if not old.empty:
            old_val = float(old["value"].iloc[0])
            if old_val > 0 and latest_val > 0:
                cagr = ((latest_val / old_val) ** (1 / 5) - 1) * 100

        summary["indicators"][ind] = {
            "latest_value": latest_val,
            "latest_year":  latest_year,
            "yoy_pct":      yoy,
            "cagr_5y":      cagr,
            "unit":         INDICATOR_UNITS.get(ind, ""),
            "series":       grp_sorted[["year", "value"]].to_dict("records"),
        }
    return summary


# ── Correlation matrix ────────────────────────────────────────────────────────

def build_correlation_matrix(tidy: pd.DataFrame, year: int = 2023) -> pd.DataFrame:
    """
    Compute Pearson correlations between all indicator pairs across countries
    at the specified year.
    """
    if tidy.empty:
        return pd.DataFrame()

    # Get latest values per country per indicator
    rows = []
    indicators = tidy["indicator"].unique()
    countries  = tidy["country"].unique()

    for country in countries:
        row: Dict[str, Any] = {"country": country}
        c_data = tidy[tidy["country"] == country]
        for ind in indicators:
            i_data = c_data[c_data["indicator"] == ind]
            if i_data.empty:
                row[INDICATOR_SHORT.get(ind, ind)] = np.nan
            else:
                closest = i_data.iloc[(i_data["year"] - year).abs().argsort()[:1]]
                row[INDICATOR_SHORT.get(ind, ind)] = float(closest["value"].iloc[0])
        rows.append(row)

    wide = pd.DataFrame(rows).set_index("country")
    corr = wide.corr(numeric_only=True)
    return corr


# ── Trend analysis ────────────────────────────────────────────────────────────

def detect_trend(series_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyse a (year, value) DataFrame for trends and anomalies.
    Returns: slope, direction, recent_yoy, anomaly_years, r_squared.
    """
    if series_df is None or len(series_df) < 3:
        return {}

    df = series_df.sort_values("year").dropna(subset=["value"])
    years  = df["year"].values.astype(float)
    values = df["value"].values.astype(float)

    # Linear trend (numpy polyfit)
    coeffs    = np.polyfit(years - years[0], values, 1)
    slope     = float(coeffs[0])
    trend_fit = np.polyval(coeffs, years - years[0])
    ss_res    = np.sum((values - trend_fit) ** 2)
    ss_tot    = np.sum((values - values.mean()) ** 2)
    r2        = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0

    # Direction
    direction = "upward" if slope > 0 else "downward" if slope < 0 else "flat"

    # Recent YoY (last 5 years)
    recent = df.tail(6)
    yoy_list = []
    for i in range(1, len(recent)):
        prev_v = float(recent["value"].iloc[i - 1])
        curr_v = float(recent["value"].iloc[i])
        if prev_v != 0:
            yoy_list.append(round((curr_v - prev_v) / abs(prev_v) * 100, 2))

    # Anomaly detection: z-score > 2
    if len(values) >= 4:
        mean_v, std_v = values.mean(), values.std()
        anomaly_mask  = np.abs(values - mean_v) > 2 * std_v if std_v > 0 else np.zeros_like(values, dtype=bool)
        anomaly_years = [int(y) for y, flag in zip(years, anomaly_mask) if flag]
    else:
        anomaly_years = []

    return {
        "slope":        round(slope, 4),
        "direction":    direction,
        "r_squared":    round(r2, 3),
        "recent_yoy":   yoy_list,
        "anomaly_years": anomaly_years,
        "mean":         round(float(values.mean()), 4),
        "std":          round(float(values.std()), 4),
        "min":          round(float(values.min()), 4),
        "max":          round(float(values.max()), 4),
        "latest":       round(float(values[-1]), 4),
        "n_obs":        len(values),
    }


# ── Forecasting ───────────────────────────────────────────────────────────────

def forecast_series(
    series_df: pd.DataFrame,
    n_years: int = 5,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Linear OLS extrapolation with 95% confidence interval.
    Returns (history_df, forecast_df) each with columns [year, value, lower, upper].
    """
    if series_df is None or len(series_df) < 4:
        return pd.DataFrame(), pd.DataFrame()

    df     = series_df.sort_values("year").dropna(subset=["value"])
    years  = df["year"].values.astype(float)
    values = df["value"].values.astype(float)

    # Fit
    x      = years - years[0]
    coeffs = np.polyfit(x, values, 1)
    fit    = np.polyval(coeffs, x)
    resid  = values - fit
    se     = np.std(resid) * 1.96  # ~95% CI assuming normal residuals

    # History with CI band
    history_df = pd.DataFrame({
        "year":  years.astype(int),
        "value": values,
        "lower": fit - se,
        "upper": fit + se,
        "fit":   fit,
    })

    # Forecast future
    last_year = int(years[-1])
    future_x  = np.arange(1, n_years + 1, dtype=float)
    future_y  = np.polyval(coeffs, (last_year - years[0]) + future_x)
    forecast_df = pd.DataFrame({
        "year":  (last_year + future_x).astype(int),
        "value": future_y,
        "lower": future_y - se,
        "upper": future_y + se,
        "fit":   future_y,
    })

    return history_df, forecast_df


def simulate_policy_shock(
    df: pd.DataFrame,
    country: str,
    indicator: str,  # "Interest Rates", "GDP Growth", "Government Debt", "Inflation"
    shock_value: float,
    lag_years: int = 1,
) -> pd.DataFrame:
    """
    Simulates a macroeconomic policy shock and propagates the effects through 
    standard economic correlations in the projection phase (years >= 2024).
    """
    df_shocked = df.copy()

    # 1. Check if the country has any indicators in df
    country_df = df_shocked[df_shocked["country"] == country]
    if country_df.empty:
        return df_shocked

    country_indicators = country_df["indicator"].unique()

    # Helper to resolve standard keys to actual indicators
    def get_actual_indicator(std_name: str) -> str:
        candidates = {
            "Interest Rates": [
                "Effective Federal Funds Rate",
                "ECB Main Refinancing Operations Rate",
                "Policy Interest Rate (%)"
            ],
            "GDP Growth": [
                "GDP growth, real (annual %)",
                "GDP growth rate (annual %, seasonally adjusted)"
            ],
            "Government Debt": [
                "General government gross debt (% of GDP)",
                "Central government debt, total (% of GDP)"
            ],
            "Inflation": [
                "Inflation, average consumer prices (annual %)",
                "Inflation, consumer prices (annual %)",
                "HICP Inflation (Eurozone, annual %)"
            ]
        }.get(std_name, [std_name])

        for cand in candidates:
            if cand in country_indicators:
                return cand
        # Fallback if none found - return the first candidate
        return candidates[0]

    # Initialize virtual interest rate if it is missing and we need it
    actual_ir = None
    for cand in ["Effective Federal Funds Rate", "ECB Main Refinancing Operations Rate"]:
        if cand in country_indicators:
            actual_ir = cand
            break

    if not actual_ir:
        # Create virtual Policy Interest Rate (%) if it doesn't exist
        if "Policy Interest Rate (%)" not in country_indicators:
            # Find years from GDP growth
            gdp_ind = get_actual_indicator("GDP Growth")
            gdp_series = df_shocked[(df_shocked["country"] == country) & (df_shocked["indicator"] == gdp_ind)]
            if not gdp_series.empty:
                years = gdp_series["year"].unique()
                rows = []
                for y in years:
                    rows.append({
                        "country": country,
                        "indicator": "Policy Interest Rate (%)",
                        "year": y,
                        "value": 4.0,
                        "source": "Virtual Sandbox Baseline"
                    })
                df_shocked = pd.concat([df_shocked, pd.DataFrame(rows)], ignore_index=True)
                # Re-read indicators
                country_indicators = df_shocked[df_shocked["country"] == country]["indicator"].unique()

    # Get actual indicator name for the shock target
    target_ind = get_actual_indicator(indicator)

    # 2. Apply direct shock in the projection phase (years >= 2024)
    target_mask = (
        (df_shocked["country"] == country) & 
        (df_shocked["indicator"] == target_ind) & 
        (df_shocked["year"] >= 2024)
    )
    df_shocked.loc[target_mask, "value"] += shock_value

    # 3. Propagate standard economic correlations
    # A. Interest Rates Shock
    if indicator == "Interest Rates":
        gdp_ind = get_actual_indicator("GDP Growth")
        inf_ind = get_actual_indicator("Inflation")

        # GDP growth decreases by 0.25 * shock_value starting from (2024 + lag_years)
        gdp_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == gdp_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[gdp_mask, "value"] -= 0.25 * shock_value

        # Inflation decreases by 0.15 * shock_value starting from (2024 + lag_years)
        inf_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == inf_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[inf_mask, "value"] -= 0.15 * shock_value

    # B. Government Debt Shock
    elif indicator == "Government Debt":
        ir_ind = get_actual_indicator("Interest Rates")
        gdp_ind = get_actual_indicator("GDP Growth")

        # Interest Rates increase by 0.15 * shock_value starting from (2024 + lag_years)
        ir_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == ir_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[ir_mask, "value"] += 0.15 * shock_value

        # GDP Growth decreases by 0.1 * shock_value starting from (2024 + lag_years)
        gdp_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == gdp_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[gdp_mask, "value"] -= 0.1 * shock_value

    # C. GDP Growth Shock
    elif indicator == "GDP Growth":
        inf_ind = get_actual_indicator("Inflation")
        ir_ind = get_actual_indicator("Interest Rates")

        # Inflation increases by 0.2 * shock_value starting from (2024 + lag_years)
        inf_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == inf_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[inf_mask, "value"] += 0.2 * shock_value

        # Interest Rates increase by 0.1 * shock_value starting from (2024 + lag_years)
        ir_mask = (
            (df_shocked["country"] == country) & 
            (df_shocked["indicator"] == ir_ind) & 
            (df_shocked["year"] >= 2024 + lag_years)
        )
        df_shocked.loc[ir_mask, "value"] += 0.1 * shock_value

    return df_shocked

