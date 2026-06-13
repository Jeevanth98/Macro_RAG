# economic_graphrag/viz/advanced_charts.py
"""
Advanced Plotly chart builders: choropleth maps, correlation heatmaps,
scatter plots, forecast charts, country radars, and ranking charts.
"""
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

try:
    import plotly.express as px
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    _PLOTLY_OK = True
except ImportError:
    _PLOTLY_OK = False

from economic_graphrag.analytics.data_processor import (
    COUNTRY_ISO3,
    INDICATOR_SHORT,
    INDICATOR_UNITS,
)
from economic_graphrag.viz.charts import apply_dark_theme

# ── Colour palettes ────────────────────────────────────────────────────────────
_DIVERGING  = "RdBu"
_SEQUENTIAL = "Plasma"
_VIRIDIS    = "Viridis"


# ── Choropleth world map ───────────────────────────────────────────────────────

def build_choropleth_map(
    country_df: pd.DataFrame,
    indicator: str,
    year: int = 2023,
    reverse_scale: bool = False,
) -> Optional[Any]:
    """
    Build a Plotly choropleth world map for a single indicator and year.
    country_df columns: [country, value, year, iso3]
    """
    if not _PLOTLY_OK or country_df.empty:
        return None

    df = country_df[country_df["iso3"] != ""].copy()
    if df.empty:
        return None

    unit     = INDICATOR_UNITS.get(indicator, "")
    short    = INDICATOR_SHORT.get(indicator, indicator)
    scale    = _DIVERGING if "%" in unit else _SEQUENTIAL
    if reverse_scale:
        scale += "_r"

    # Special: higher unemployment/inflation = red; higher GDP = green
    if "Unemployment" in indicator or "Inflation" in indicator or "exchange" in indicator.lower():
        scale = "RdYlGn_r"

    fig = px.choropleth(
        df,
        locations="iso3",
        color="value",
        hover_name="country",
        hover_data={"iso3": False, "value": ":.2f", "year": True},
        color_continuous_scale=scale,
        title=f"{short} — {year} (approx.)",
        labels={"value": unit or short},
        height=420,
    )
    fig.update_layout(
        margin=dict(l=0, r=0, t=45, b=0),
        coloraxis_colorbar=dict(title=unit or short, len=0.6),
        geo=dict(showframe=False, showcoastlines=True, projection_type="natural earth", bgcolor="rgba(0,0,0,0)"),
    )
    return apply_dark_theme(fig)


# ── Country ranking bar chart ──────────────────────────────────────────────────

def build_ranking_chart(
    country_df: pd.DataFrame,
    indicator: str,
    year: int = 2023,
    top_n: int = 18,
) -> Optional[Any]:
    """
    Horizontal bar chart ranking countries by indicator value.
    """
    if not _PLOTLY_OK or country_df.empty:
        return None

    df = country_df.head(top_n).copy()
    unit  = INDICATOR_UNITS.get(indicator, "")
    short = INDICATOR_SHORT.get(indicator, indicator)

    # Color: diverging by value
    colors = px.colors.sample_colorscale(
        "RdYlGn",
        [i / max(len(df) - 1, 1) for i in range(len(df))][::-1],
    )

    fig = go.Figure(go.Bar(
        x=df["value"],
        y=df["country"],
        orientation="h",
        marker_color=colors,
        text=[f"{v:.2f}" for v in df["value"]],
        textposition="outside",
        hovertemplate="%{y}: %{x:.3f} " + unit + "<extra></extra>",
    ))
    fig.update_layout(
        title=f"{short} Rankings (≈{year})",
        xaxis_title=unit or short,
        yaxis=dict(autorange="reversed"),
        height=max(320, len(df) * 24),
        margin=dict(l=10, r=60, t=45, b=20),
    )
    return apply_dark_theme(fig)


# ── Correlation heatmap ────────────────────────────────────────────────────────

def build_correlation_heatmap(corr_df: pd.DataFrame) -> Optional[Any]:
    """
    Annotated correlation matrix heatmap.
    corr_df: square DataFrame (indicator x indicator).
    """
    if not _PLOTLY_OK or corr_df.empty:
        return None

    labels = list(corr_df.columns)
    matrix = corr_df.values

    fig = go.Figure(go.Heatmap(
        z=matrix,
        x=labels,
        y=labels,
        colorscale="RdBu",
        zmid=0,
        zmin=-1,
        zmax=1,
        text=[[f"{v:.2f}" if not np.isnan(v) else "" for v in row] for row in matrix],
        texttemplate="%{text}",
        textfont=dict(size=11),
        hovertemplate="%{y} vs %{x}: %{z:.2f}<extra></extra>",
    ))
    fig.update_layout(
        title="Indicator Correlation Matrix (across G20 countries)",
        height=420,
        margin=dict(l=60, r=20, t=60, b=60),
        xaxis=dict(tickangle=-35),
    )
    return apply_dark_theme(fig)


# ── Scatter plot (Phillips Curve, Okun's Law, etc.) ───────────────────────────

def build_scatter_plot(
    tidy_df: pd.DataFrame,
    x_indicator: str,
    y_indicator: str,
    year: int = 2023,
    title: str = "",
    add_trendline: bool = True,
) -> Optional[Any]:
    """
    Scatter plot of x_indicator vs y_indicator across countries.
    Optionally draws an OLS trend line.
    """
    if not _PLOTLY_OK or tidy_df.empty:
        return None

    # Get values for both indicators near target year
    def _get_val(df, ind, y):
        sub = df[df["indicator"] == ind]
        if sub.empty:
            return None
        closest = sub.iloc[(sub["year"] - y).abs().argsort()[:1]]
        return float(closest["value"].iloc[0])

    rows = []
    for country, grp in tidy_df.groupby("country"):
        xv = _get_val(grp, x_indicator, year)
        yv = _get_val(grp, y_indicator, year)
        if xv is not None and yv is not None:
            rows.append({
                "country": country,
                "x": xv,
                "y": yv,
                "iso3": COUNTRY_ISO3.get(country, ""),
            })

    if len(rows) < 3:
        return None

    df_plot = pd.DataFrame(rows)
    x_short = INDICATOR_SHORT.get(x_indicator, x_indicator)
    y_short = INDICATOR_SHORT.get(y_indicator, y_indicator)
    x_unit  = INDICATOR_UNITS.get(x_indicator, "")
    y_unit  = INDICATOR_UNITS.get(y_indicator, "")

    fig = go.Figure()

    # Trend line
    if add_trendline and len(df_plot) >= 4:
        xs = df_plot["x"].values
        ys = df_plot["y"].values
        coeffs  = np.polyfit(xs, ys, 1)
        x_range = np.linspace(xs.min(), xs.max(), 60)
        y_range = np.polyval(coeffs, x_range)
        corr_val = np.corrcoef(xs, ys)[0, 1]
        fig.add_trace(go.Scatter(
            x=x_range, y=y_range,
            mode="lines",
            line=dict(color="#888", dash="dot", width=1.5),
            name=f"OLS trend (r={corr_val:.2f})",
        ))

    # Scatter points
    colors = px.colors.qualitative.Set2
    for i, row in df_plot.iterrows():
        fig.add_trace(go.Scatter(
            x=[row["x"]], y=[row["y"]],
            mode="markers+text",
            marker=dict(size=11, color=colors[i % len(colors)], line=dict(width=1, color="white")),
            text=[row["country"][:3]],
            textposition="top center",
            textfont=dict(size=9),
            name=row["country"],
            hovertemplate=f"<b>{row['country']}</b><br>{x_short}: %{{x:.2f}} {x_unit}<br>{y_short}: %{{y:.2f}} {y_unit}<extra></extra>",
        ))

    fig.update_layout(
        title=title or f"{x_short} vs {y_short} (≈{year})",
        xaxis_title=f"{x_short} ({x_unit})" if x_unit else x_short,
        yaxis_title=f"{y_short} ({y_unit})" if y_unit else y_short,
        height=400,
        margin=dict(l=50, r=20, t=55, b=40),
        showlegend=False,
    )
    return apply_dark_theme(fig)


# ── Forecast chart ────────────────────────────────────────────────────────────

def build_forecast_chart(
    history_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
    country: str,
    indicator: str,
) -> Optional[Any]:
    """
    Time-series chart with historical data, trend fit, and forecast with CI band.
    """
    if not _PLOTLY_OK or history_df.empty or forecast_df.empty:
        return None

    short = INDICATOR_SHORT.get(indicator, indicator)
    unit  = INDICATOR_UNITS.get(indicator, "")

    fig = go.Figure()

    # Historical data
    fig.add_trace(go.Scatter(
        x=history_df["year"], y=history_df["value"],
        mode="lines+markers",
        name="Historical",
        line=dict(color="#2c7bb6", width=2),
        marker=dict(size=5),
        hovertemplate="Year: %{x}<br>Actual: %{y:.3f} " + unit + "<extra></extra>",
    ))

    # Trend line (fitted)
    fig.add_trace(go.Scatter(
        x=history_df["year"], y=history_df["fit"],
        mode="lines",
        name="Trend (OLS)",
        line=dict(color="#888", dash="dot", width=1.5),
    ))

    # Forecast CI band
    fig.add_trace(go.Scatter(
        x=pd.concat([forecast_df["year"], forecast_df["year"][::-1]]),
        y=pd.concat([forecast_df["upper"], forecast_df["lower"][::-1]]),
        fill="toself",
        fillcolor="rgba(253,174,97,0.25)",
        line=dict(color="rgba(255,255,255,0)"),
        name="95% CI",
        hoverinfo="skip",
    ))

    # Forecast central line
    fig.add_trace(go.Scatter(
        x=forecast_df["year"], y=forecast_df["value"],
        mode="lines+markers",
        name="Forecast",
        line=dict(color="#d7191c", dash="dash", width=2),
        marker=dict(size=6, symbol="diamond"),
        hovertemplate="Year: %{x}<br>Forecast: %{y:.3f} " + unit + "<extra></extra>",
    ))

    # Vertical divider
    last_hist = int(history_df["year"].max())
    fig.add_vline(x=last_hist, line_dash="dot", line_color="#999", annotation_text="Forecast →")

    fig.update_layout(
        title=f"{country} — {short}: Historical + 5-Year Forecast",
        xaxis_title="Year",
        yaxis_title=f"{short} ({unit})" if unit else short,
        height=400,
        margin=dict(l=50, r=20, t=60, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return apply_dark_theme(fig)


# ── Country radar chart ────────────────────────────────────────────────────────

def build_country_radar(
    country_summary: Dict[str, Any],
    compare_summary: Optional[Dict[str, Any]] = None,
) -> Optional[Any]:
    """
    Radar / spider chart of normalized indicator values for a country.
    Optionally overlays G20 average for comparison.
    """
    if not _PLOTLY_OK:
        return None

    indicators_info = country_summary.get("indicators", {})
    if not indicators_info:
        return None

    short_names = [INDICATOR_SHORT.get(ind, ind[:15]) for ind in indicators_info]
    values_raw  = [info.get("latest_value", 0) for info in indicators_info.values()]

    # Normalize 0–100 per indicator (min-max across G20 would be ideal,
    # but we use simple absolute normalization here)
    NORMALIZE_MAX: Dict[str, float] = {
        # World Bank core
        "GDP (current US$)":                                    25.0,
        "GDP per capita (current US$)":                         60000.0,
        "GDP growth rate (annual %, seasonally adjusted)":      10.0,
        "Inflation, consumer prices (annual %)":                20.0,
        "Unemployment rate (% of total labour force)":          20.0,
        "Trade (% of GDP)":                                     100.0,
        "Official exchange rate (LCU per US$)":                 1500.0,
        # IMF WEO
        "GDP growth, real (annual %)":                          10.0,
        "Inflation, average consumer prices (annual %)":        20.0,
        "Current account balance (% of GDP)":                   15.0,
        "General government gross debt (% of GDP)":             150.0,
        "Unemployment rate, IMF WEO (%)":                       20.0,
        # ECB
        "ECB Main Refinancing Operations Rate":                 5.0,
        "ECB Deposit Facility Rate":                            5.0,
        "EUR/USD Exchange Rate (ECB)":                          1.5,
        "HICP Inflation (Eurozone, annual %)":                  10.0,
        # World Bank Extended
        "Foreign direct investment, net inflows (% of GDP)":   10.0,
        "Central government debt, total (% of GDP)":           150.0,
        "Population, total":                                    1400.0e6,
        "GDP per capita, PPP (current international $)":        80000.0,
        "Gross capital formation (% of GDP)":                   50.0,
        "Military expenditure (% of GDP)":                      5.0,
        "Research and development expenditure (% of GDP)":      4.0,
        "Access to electricity (% of population)":              100.0,
        "CO2 emissions (metric tons per capita)":               20.0,
    }
    normed = []
    for ind, val in zip(indicators_info.keys(), values_raw):
        mx = NORMALIZE_MAX.get(ind, max(abs(val), 1))
        n  = min(abs(val) / mx * 100, 100)
        normed.append(round(n, 1))

    fig = go.Figure()

    country = country_summary.get("country", "Country")
    fig.add_trace(go.Scatterpolar(
        r=normed + normed[:1],
        theta=short_names + short_names[:1],
        fill="toself",
        name=country,
        line=dict(color="#2c7bb6"),
        fillcolor="rgba(44,123,182,0.15)",
    ))

    if compare_summary:
        c2_info   = compare_summary.get("indicators", {})
        c2_vals   = [c2_info.get(ind, {}).get("latest_value", 0) for ind in indicators_info]
        c2_normed = []
        for ind, val in zip(indicators_info.keys(), c2_vals):
            mx = NORMALIZE_MAX.get(ind, max(abs(val), 1))
            c2_normed.append(min(abs(val) / mx * 100, 100))
        fig.add_trace(go.Scatterpolar(
            r=c2_normed + c2_normed[:1],
            theta=short_names + short_names[:1],
            fill="toself",
            name=compare_summary.get("country", "Compare"),
            line=dict(color="#d7191c"),
            fillcolor="rgba(215,25,28,0.10)",
        ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 100]),
            bgcolor="rgba(0,0,0,0)",
        ),
        title=f"{country} — Economic Profile (normalized)",
        height=380,
        margin=dict(l=30, r=30, t=60, b=30),
        legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5),
    )
    return apply_dark_theme(fig)


# ── Indicator cross-country heatmap ───────────────────────────────────────────

def build_indicator_heatmap(
    matrix_df: pd.DataFrame,
    indicator: str,
) -> Optional[Any]:
    """
    Country × year heatmap for one indicator.
    matrix_df: pivot table (country index, year columns).
    """
    if not _PLOTLY_OK or matrix_df.empty:
        return None

    short = INDICATOR_SHORT.get(indicator, indicator)
    unit  = INDICATOR_UNITS.get(indicator, "")

    is_pct = "%" in unit
    scale  = "RdYlGn" if is_pct else "Blues"
    if "Unemployment" in indicator or "Inflation" in indicator:
        scale = "RdYlGn_r"

    # Last 20 years only
    cols = sorted([c for c in matrix_df.columns if isinstance(c, int)])[-20:]
    df   = matrix_df[cols].copy()

    fig = go.Figure(go.Heatmap(
        z=df.values,
        x=[str(c) for c in cols],
        y=list(df.index),
        colorscale=scale,
        hovertemplate="%{y} %{x}: %{z:.2f} " + unit + "<extra></extra>",
        colorbar=dict(title=unit),
    ))
    fig.update_layout(
        title=f"{short} — Country × Year Heatmap",
        height=max(300, len(df) * 22 + 80),
        margin=dict(l=10, r=10, t=50, b=40),
        xaxis=dict(tickangle=-45),
    )
    return apply_dark_theme(fig)


# ── Multi-indicator country comparison table chart ────────────────────────────

def build_comparison_matrix_chart(
    tidy_df: pd.DataFrame,
    year: int = 2023,
) -> Optional[Any]:
    """
    Colour-coded table: countries as rows, indicators as columns, values normalized.
    """
    if not _PLOTLY_OK or tidy_df.empty:
        return None

    indicators = tidy_df["indicator"].unique()
    countries  = sorted(tidy_df["country"].unique())

    col_labels = [INDICATOR_SHORT.get(i, i) for i in indicators]
    matrix_vals = []
    matrix_text = []

    for country in countries:
        row_v, row_t = [], []
        c_data = tidy_df[tidy_df["country"] == country]
        for ind in indicators:
            i_data = c_data[c_data["indicator"] == ind]
            if i_data.empty:
                row_v.append(np.nan)
                row_t.append("n/a")
            else:
                closest = i_data.iloc[(i_data["year"] - year).abs().argsort()[:1]]
                v = float(closest["value"].iloc[0])
                row_v.append(v)
                row_t.append(f"{v:.2f}")
        matrix_vals.append(row_v)
        matrix_text.append(row_t)

    # Normalize each column 0–1 for color
    arr = np.array(matrix_vals, dtype=float)
    normed = np.zeros_like(arr)
    for j in range(arr.shape[1]):
        col = arr[:, j]
        valid = col[~np.isnan(col)]
        if len(valid) > 0:
            mn, mx = valid.min(), valid.max()
            if mx > mn:
                normed[:, j] = (col - mn) / (mx - mn)

    # Flip for inflation/unemployment (lower = better)
    for j, ind in enumerate(indicators):
        if "Unemployment" in ind or "Inflation" in ind or "exchange" in ind.lower():
            normed[:, j] = 1 - normed[:, j]

    colors_2d = [
        [f"rgb({int(255*(1-n))},{int(180+75*n)},{int(100+50*n)})" if not np.isnan(v) else "rgb(220,220,220)"
         for n, v in zip(normed[i], arr[i])]
        for i in range(len(countries))
    ]

    fig = go.Figure(go.Table(
        header=dict(
            values=["Country"] + col_labels,
            fill_color="#2c7bb6",
            font=dict(color="white", size=11),
            align="center",
        ),
        cells=dict(
            values=[countries] + [[matrix_text[i][j] for i in range(len(countries))] for j in range(len(indicators))],
            fill_color=[["white"] * len(countries)] + [
                [colors_2d[i][j] for i in range(len(countries))]
                for j in range(len(indicators))
            ],
            align="center",
            font=dict(size=10),
            height=24,
        ),
    ))
    fig.update_layout(
        title=f"G20 Economic Indicator Comparison Matrix (≈{year})",
        height=max(400, len(countries) * 26 + 80),
        margin=dict(l=0, r=0, t=50, b=0),
    )
    return apply_dark_theme(fig)
