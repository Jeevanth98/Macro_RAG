# economic_graphrag/viz/charts.py
"""
Chart generation module for the Economic GraphRAG system.
Parses time-series data from retrieved chunks and renders Plotly figures.
"""
import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

try:
    import plotly.express as px
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    _PLOTLY_OK = True
except ImportError:
    _PLOTLY_OK = False


# ── Data parsing ──────────────────────────────────────────────────────────────

def _parse_year_value_table(content: str) -> pd.DataFrame:
    """
    Parse "year  value" rows from chunk content text.
    Handles scientific notation, commas, and leading integers (chunk indices).
    """
    rows = []
    # Match lines like: " 2023  27292170793214.4" or "2023  133.49"
    pattern = re.compile(
        r"^\s*(?:\d+\s+)?(\d{4})\s+([\d,\.eE\+\-]+)\s*$",
        re.MULTILINE,
    )
    for m in pattern.finditer(content):
        yr_str, val_str = m.group(1), m.group(2).replace(",", "")
        try:
            yr = int(yr_str)
            val = float(val_str)
            if 1990 <= yr <= 2030 and val != 0:
                rows.append({"year": yr, "value": val})
        except ValueError:
            continue

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows).drop_duplicates("year").sort_values("year")
    return df


def _scale_values(df: pd.DataFrame, indicator: str) -> Tuple[pd.DataFrame, str]:
    """Scale large GDP/USD values to readable units (Trillions, Billions)."""
    if df.empty:
        return df, ""

    max_val = df["value"].abs().max()
    suffix = ""

    gdp_indicators = {"gdp", "gross domestic product"}
    ind_lower = indicator.lower()

    if any(g in ind_lower for g in gdp_indicators) and "per capita" not in ind_lower:
        if max_val > 1e12:
            df = df.copy()
            df["value"] = df["value"] / 1e12
            suffix = "Trillion USD"
        elif max_val > 1e9:
            df = df.copy()
            df["value"] = df["value"] / 1e9
            suffix = "Billion USD"
        elif max_val > 1e6:
            df = df.copy()
            df["value"] = df["value"] / 1e6
            suffix = "Million USD"
    elif "per capita" in ind_lower and max_val > 1e6:
        df = df.copy()
        df["value"] = df["value"] / 1e3
        suffix = "Thousand USD"
    else:
        suffix = _guess_unit(indicator)

    return df, suffix


def _guess_unit(indicator: str) -> str:
    ind_lower = indicator.lower()
    if "%" in ind_lower or "percent" in ind_lower or "rate" in ind_lower or "annual" in ind_lower:
        return "%"
    if "population" in ind_lower:
        return "people"
    if "exchange rate" in ind_lower or "lcu" in ind_lower:
        return "LCU per USD"
    return ""


# ── Chart builders ────────────────────────────────────────────────────────────

def apply_dark_theme(fig: Any) -> Any:
    """Apply the premium dark theme to a Plotly figure."""
    if not _PLOTLY_OK or fig is None:
        return fig
    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", color="#E2E8F0"),
        xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.03)", zerolinecolor="rgba(255,255,255,0.05)"),
        yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.03)", zerolinecolor="rgba(255,255,255,0.05)"),
    )
    return fig

# ── Historical event annotations ──────────────────────────────────────────────

HISTORICAL_EVENTS = [
    (2001, "Dot-com Bust",          "rgba(158, 158, 158, 0.6)", "dash"),
    (2008, "Global Financial Crisis","rgba(239, 68, 68, 0.6)", "dash"),
    (2010, "Eurozone Debt Crisis",   "rgba(245, 158, 11, 0.6)", "dot"),
    (2014, "Oil Price Crash",        "rgba(168, 85, 247, 0.6)", "dot"),
    (2016, "Brexit Referendum",      "rgba(59, 130, 246, 0.6)", "dot"),
    (2020, "COVID-19 Pandemic",      "rgba(236, 72, 153, 0.6)", "dash"),
    (2022, "Russia-Ukraine War",     "rgba(220, 38, 38, 0.6)", "dash"),
    (2022, "Global Inflation Surge", "rgba(249, 115, 22, 0.6)", "dot"),
]


def add_events_overlay(fig: Any, year_min: int = 2000, year_max: int = 2031) -> Any:
    """Add vertical lines for major economic events to an existing Plotly figure."""
    if not _PLOTLY_OK or fig is None:
        return fig
    for yr, label, color, dash in HISTORICAL_EVENTS:
        if year_min <= yr <= year_max:
            fig.add_vline(
                x=yr,
                line_dash=dash,
                line_color=color,
                line_width=1.5,
                opacity=0.55,
                annotation_text=f" {label}",
                annotation_position="top",
                annotation_font=dict(size=9, color=color),
                annotation_bgcolor="rgba(13,15,20,0.8)",
                annotation_bordercolor="rgba(255,255,255,0.1)",
            )
    return fig


def build_timeseries_chart(chunks: List[Dict[str, Any]], title: str = "",
                            show_events: bool = False) -> Optional[Any]:
    """
    Build a multi-line time-series chart from retrieved chunks.
    Each chunk with parseable year/value data becomes one line.
    Optionally overlay historical economic event markers.
    """
    if not _PLOTLY_OK:
        return None

    traces_data = []
    unit_hint = ""

    for chunk in chunks:
        content   = chunk.get("content", "")
        country   = chunk.get("country", "")
        indicator = chunk.get("indicator", "")
        chunk_title = chunk.get("title", "")

        df = _parse_year_value_table(content)
        if df.empty or len(df) < 2:
            continue

        df, unit = _scale_values(df, indicator or chunk_title)
        if unit:
            unit_hint = unit

        label = country or chunk_title.split("—")[-1].strip()
        traces_data.append((label, df))

    if not traces_data:
        return None

    fig = go.Figure()
    colors = px.colors.qualitative.Pastel + px.colors.qualitative.Set3

    for i, (label, df) in enumerate(traces_data):
        fig.add_trace(go.Scatter(
            x=df["year"],
            y=df["value"],
            mode="lines+markers",
            name=label,
            line=dict(width=2, color=colors[i % len(colors)]),
            marker=dict(size=5),
            hovertemplate=f"<b>{label}</b><br>Year: %{{x}}<br>Value: %{{y:,.2f}} {unit_hint}<extra></extra>",
        ))

    ind_label = chunks[0].get("indicator", title) if chunks else title
    all_years  = [yr for _, df in traces_data for yr in df["year"]]
    yr_min     = int(min(all_years)) if all_years else 2000
    yr_max     = int(max(all_years)) if all_years else 2030

    fig.update_layout(
        title=dict(text=title or ind_label, font=dict(size=15)),
        xaxis_title="Year",
        yaxis_title=unit_hint or "Value",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=380,
        margin=dict(l=50, r=20, t=60, b=40),
        hovermode="x unified",
    )
    fig = apply_dark_theme(fig)

    if show_events:
        add_events_overlay(fig, yr_min, yr_max)

    return fig


def build_bar_comparison_chart(chunks: List[Dict[str, Any]], year: int = 2023) -> Optional[Any]:
    """
    Build a bar chart comparing a single indicator across countries for a given year.
    """
    if not _PLOTLY_OK:
        return None

    rows = []
    unit_hint = ""

    for chunk in chunks:
        content   = chunk.get("content", "")
        country   = chunk.get("country", "")
        indicator = chunk.get("indicator", "")

        if not country:
            continue

        df = _parse_year_value_table(content)
        if df.empty:
            continue

        df_scaled, unit = _scale_values(df, indicator)
        if unit:
            unit_hint = unit

        # Find closest year
        closest = df_scaled.iloc[(df_scaled["year"] - year).abs().argsort()[:1]]
        if not closest.empty:
            rows.append({
                "country": country,
                "value": float(closest["value"].iloc[0]),
                "year": int(closest["year"].iloc[0]),
            })

    if len(rows) < 2:
        return None

    df_bar = pd.DataFrame(rows).sort_values("value", ascending=False)
    indicator_name = chunks[0].get("indicator", "Value") if chunks else "Value"

    fig = px.bar(
        df_bar,
        x="country",
        y="value",
        color="value",
        color_continuous_scale="RdYlGn",
        labels={"country": "Country", "value": f"{indicator_name} ({unit_hint})"},
        title=f"{indicator_name} by Country (≈{year})",
        height=380,
        text=df_bar["value"].apply(lambda v: f"{v:,.1f}"),
    )
    fig.update_traces(textposition="outside")
    fig.update_layout(
        margin=dict(l=50, r=20, t=60, b=80),
        coloraxis_showscale=False,
        xaxis_tickangle=-35,
    )
    return apply_dark_theme(fig)


def build_graph_network_chart(nodes_edges: Dict[str, Any], query: str = "") -> Optional[Any]:
    """
    Build a network graph visualization from knowledge graph nodes and edges.
    nodes_edges: {"nodes": [(id, label, type), ...], "edges": [(src, rel, tgt), ...]}
    """
    if not _PLOTLY_OK:
        return None

    try:
        import networkx as nx
        import math

        nodes = nodes_edges.get("nodes", [])
        edges = nodes_edges.get("edges", [])

        if not nodes or not edges:
            return None

        G = nx.DiGraph()
        for nid, nlabel, ntype in nodes:
            G.add_node(nid, label=nlabel, type=ntype)
        for src, rel, tgt in edges:
            if src in G and tgt in G:
                G.add_edge(src, tgt, label=rel)

        if G.number_of_nodes() == 0:
            return None

        pos = nx.spring_layout(G, seed=42, k=2.5 / math.sqrt(max(G.number_of_nodes(), 1)))

        # Edge traces
        edge_x, edge_y = [], []
        for (u, v) in G.edges():  # type: ignore
            x0, y0 = pos[u]
            x1, y1 = pos[v]
            edge_x += [x0, x1, None]
            edge_y += [y0, y1, None]

        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=1.2, color="#aaa"),
            hoverinfo="none",
            mode="lines",
        )

        # Node traces by type (Bloomberg Terminal inspired professional palette)
        type_colors = {
            "Country": "#6366F1", "Indicator": "#10B981",
            "EconomicConcept": "#8B5CF6", "Region": "#F59E0B",
            "Source": "#64748B", "Institution": "#EC4899",
        }

        node_x = [pos[n][0] for n in G.nodes()]
        node_y = [pos[n][1] for n in G.nodes()]
        node_labels = [G.nodes[n].get("label", n) for n in G.nodes()]
        node_types  = [G.nodes[n].get("type", "EconomicConcept") for n in G.nodes()]
        node_colors = [type_colors.get(t, "#888") for t in node_types]
        node_sizes  = [22 if G.degree(n) > 3 else 12 for n in G.nodes()]

        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode="markers+text",
            hoverinfo="text",
            text=["" for _ in G.nodes()],
            hovertext=[f"{lbl} ({t})\ndegree: {G.degree(n)}"
                       for n, lbl, t in zip(G.nodes(), node_labels, node_types)],
            marker=dict(size=node_sizes, color=node_colors,
                        line=dict(width=1, color="#111319")),
        )

        # Labels for high-degree nodes only
        label_trace = go.Scatter(
            x=[pos[n][0] for n in G.nodes() if G.degree(n) > 1],
            y=[pos[n][1] + 0.06 for n in G.nodes() if G.degree(n) > 1],
            mode="text",
            text=[G.nodes[n].get("label", n) for n in G.nodes() if G.degree(n) > 1],
            textfont=dict(size=10, color="#E2E8F0", family="monospace"),
            hoverinfo="none",
        )

        fig = go.Figure(data=[edge_trace, node_trace, label_trace])
        fig.update_layout(
            showlegend=False,
            hovermode="closest",
            height=420,
            margin=dict(b=10, l=5, r=5, t=10),
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        )
        return apply_dark_theme(fig)

    except Exception as e:
        print(f"Graph viz error: {e}")
        return None


# ── Group chunks by indicator ─────────────────────────────────────────────────

def group_chunks_by_indicator(chunks: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
    """Group retrieved chunks by their indicator field."""
    groups: Dict[str, List[Dict]] = {}
    for c in chunks:
        ind = c.get("indicator") or c.get("title", "Unknown")
        # Normalize indicator name (strip country)
        ind = ind.split("—")[0].strip()
        groups.setdefault(ind, []).append(c)
    return groups


def get_graph_subgraph_for_query(
    query: str,
    graph_results: List[Dict[str, Any]],
    max_nodes: int = 30,
) -> Dict[str, Any]:
    """
    Convert graph retrieval results into a format for network visualization.
    Returns {"nodes": [...], "edges": [...]} for build_graph_network_chart.
    """
    nodes_set: Dict[str, Tuple[str, str]] = {}
    edges: List[Tuple[str, str, str]] = []

    for r in graph_results[:max_nodes]:
        subj = r.get("subject", "")
        rel  = r.get("relationship", "RELATED_TO")
        obj  = r.get("object", "")
        s_type = r.get("subject_type", _guess_type(subj))
        o_type = r.get("object_type", _guess_type(obj))

        if subj:
            nodes_set[subj] = (subj[:30], s_type)
        if obj:
            nodes_set[obj] = (obj[:30], o_type)
        if subj and obj:
            edges.append((subj, rel, obj))

    nodes = [(nid, lbl, ntype) for nid, (lbl, ntype) in nodes_set.items()]
    return {"nodes": nodes, "edges": edges}


def _guess_type(name: str) -> str:
    known_countries = {
        "United States", "Germany", "China", "India", "Japan",
        "France", "Italy", "United Kingdom", "Brazil", "Canada",
        "Australia", "Argentina", "Mexico", "South Korea", "Turkey",
        "Saudi Arabia", "South Africa", "Indonesia", "Russia",
    }
    known_concepts = {
        "GDP", "Inflation", "CPI", "Trade", "Unemployment",
        "GDP per capita", "Exchange rate", "Federal Funds Rate",
    }
    known_regions = {"G7", "G20", "European Union", "BRICS", "OECD", "NATO", "ASEAN", "OPEC"}
    known_sources = {"World Bank API", "FRED API", "OECD / World Bank"}

    if name in known_countries:
        return "Country"
    if name in known_regions:
        return "Region"
    if name in known_sources or "API" in name or "Bank" in name:
        return "Source"
    if any(c in name for c in known_concepts) or "%" in name or "rate" in name.lower():
        return "Indicator"
    return "EconomicConcept"


# ══════════════════════════════════════════════════════════════════════════════
# NEW INSTITUTIONAL CHARTS (GLOBAL DASHBOARD)
# ══════════════════════════════════════════════════════════════════════════════

def build_macro_bubble_chart(tidy_df: pd.DataFrame) -> Optional[Any]:
    """
    Builds the Institutional Macro Bubble Map.
    X: GDP Growth | Y: Inflation | Size: GDP (absolute) | Color: Health Score
    """
    if not _PLOTLY_OK or tidy_df.empty:
        return None
    try:
        from economic_graphrag.analytics.insights import calculate_economic_strength_score
        
        # Get latest data
        sub = tidy_df.copy()
        
        # Pivot by country for the latest year available per indicator
        latest_data = []
        for c, grp in sub.groupby("country"):
            gdp_g = grp[grp["indicator"] == "GDP growth (annual %)"].sort_values("year")
            inf = grp[grp["indicator"] == "Inflation, consumer prices (annual %)"].sort_values("year")
            gdp_abs = grp[grp["indicator"] == "GDP (current US$)"].sort_values("year")
            
            gdp_g_val = gdp_g.iloc[-1]["value"] if not gdp_g.empty else None
            inf_val = inf.iloc[-1]["value"] if not inf.empty else None
            gdp_abs_val = gdp_abs.iloc[-1]["value"] if not gdp_abs.empty else 1e11 # default 100B if missing
            
            if gdp_g_val is not None and inf_val is not None:
                latest_data.append({
                    "country": c,
                    "GDP Growth": gdp_g_val,
                    "Inflation": inf_val,
                    "GDP Size": gdp_abs_val
                })
                
        if not latest_data:
            return None
            
        df_bubble = pd.DataFrame(latest_data)
        
        # Get scores for coloring
        df_scores = calculate_economic_strength_score(tidy_df)
        if not df_scores.empty:
            df_bubble = df_bubble.merge(df_scores[["country", "score"]], on="country", how="left")
            df_bubble["score"] = df_bubble["score"].fillna(50)
        else:
            df_bubble["score"] = 50
            
        # Scale bubble size (Plotly takes raw values and scales them, but we want it reasonable)
        # Using a continuous color scale from red (low score) to green (high score)
        
        fig = px.scatter(
            df_bubble,
            x="GDP Growth",
            y="Inflation",
            size="GDP Size",
            color="score",
            text="country",
            hover_name="country",
            color_continuous_scale=["#EF4444", "#F59E0B", "#10B981"],
            range_color=[0, 100],
            size_max=45,
            labels={"GDP Growth": "GDP Growth (%)", "Inflation": "Inflation (%)", "score": "Health Score"}
        )
        
        fig.update_traces(
            textposition='top center',
            marker=dict(line=dict(width=1, color='rgba(255,255,255,0.2)')),
            textfont=dict(color='#E2E8F0', size=10, family='monospace')
        )
        
        # Add Quadrant lines (0 growth, 2% inflation)
        fig.add_hline(y=2.0, line_dash="dot", line_color="rgba(255,255,255,0.2)", annotation_text="Target Inflation (2%)")
        fig.add_vline(x=0.0, line_dash="dot", line_color="rgba(255,255,255,0.2)", annotation_text="Zero Growth")
        
        fig.update_layout(
            height=500,
            margin=dict(l=10, r=10, t=30, b=10),
            coloraxis_colorbar=dict(title="Score"),
        )
        
        return apply_dark_theme(fig)
        
    except Exception as e:
        print(f"Error building macro bubble map: {e}")
        return None


def build_trend_explorer_chart(tidy_df: pd.DataFrame, country: str, indicator: str, 
                             year_min: int, year_max: int) -> Optional[Any]:
    """Builds a highly-polished time-series chart for the Country Trend Explorer."""
    if not _PLOTLY_OK or tidy_df.empty:
        return None
        
    sub = tidy_df[(tidy_df["country"] == country) & (tidy_df["indicator"] == indicator)]
    sub = sub[(sub["year"] >= year_min) & (sub["year"] <= year_max)]
    
    if sub.empty:
        return None
        
    sub = sub.sort_values("year")
    
    # Scale values if needed
    sub_scaled, unit = _scale_values(sub.copy(), indicator)
    
    fig = go.Figure()
    
    # Area chart with gradient fill
    fig.add_trace(go.Scatter(
        x=sub_scaled["year"],
        y=sub_scaled["value"],
        mode="lines+markers",
        name=country,
        line=dict(width=3, color="#6366F1"),
        fill='tozeroy',
        fillcolor='rgba(99, 102, 241, 0.1)',
        marker=dict(size=6, color="#6366F1", line=dict(width=1, color="white")),
        hovertemplate="<b>%{x}</b><br>Value: %{y:,.2f} " + unit + "<extra></extra>"
    ))
    
    # Add a trendline (simple linear regression endpoints)
    if len(sub_scaled) > 1:
        x_first, x_last = sub_scaled.iloc[0]["year"], sub_scaled.iloc[-1]["year"]
        y_first, y_last = sub_scaled.iloc[0]["value"], sub_scaled.iloc[-1]["value"]
        fig.add_trace(go.Scatter(
            x=[x_first, x_last],
            y=[y_first, y_last],
            mode="lines",
            line=dict(width=1, color="#F59E0B", dash="dash"),
            name="Trend",
            hoverinfo="none"
        ))
    
    # Overlay global events
    fig = add_events_overlay(fig, year_min, year_max)
    
    short_ind = indicator.split("(")[0].strip()
    
    fig.update_layout(
        title=dict(text=f"{country} — {short_ind}", font=dict(size=14, color="#E2E8F0")),
        height=400,
        margin=dict(l=10, r=10, t=40, b=10),
        xaxis_title="",
        yaxis_title=unit,
        showlegend=False,
        hovermode="x unified"
    )
    
    return apply_dark_theme(fig)
