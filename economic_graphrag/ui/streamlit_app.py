# economic_graphrag/ui/streamlit_app.py
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import streamlit as st
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from economic_graphrag.main_workflow import MainWorkflow
from economic_graphrag.vector_store.chroma_manager import ChromaVectorStore
from economic_graphrag.graph.networkx_graph import nx_graph
from economic_graphrag.graph.neo4j_manager import neo4j_manager

# ── Optional viz imports ───────────────────────────────────────────────────────
try:
    from economic_graphrag.viz.charts import (
        build_timeseries_chart,
        build_bar_comparison_chart,
        build_graph_network_chart,
        group_chunks_by_indicator,
        get_graph_subgraph_for_query,
    )
    from economic_graphrag.viz.advanced_charts import (
        build_choropleth_map,
        build_ranking_chart,
        build_correlation_heatmap,
        build_scatter_plot,
        build_forecast_chart,
        build_country_radar,
        build_indicator_heatmap,
        build_comparison_matrix_chart,
    )
    from economic_graphrag.analytics.data_processor import (
        build_tidy_df,
        build_indicator_matrix,
        get_latest_values,
        build_country_summary,
        build_correlation_matrix,
        detect_trend,
        forecast_series,
        INDICATOR_SHORT,
        INDICATOR_UNITS,
        simulate_policy_shock,
    )
    from economic_graphrag.analytics.recession_risk import (
        compute_all_risks, compute_country_risk,
        build_risk_gauge_fig, build_risk_radar_fig,
    )
    from economic_graphrag.analytics.insights import (
        generate_all_insights, SEVERITY_EMOJI,
    )
    from economic_graphrag.analytics.report_generator import build_country_report
    from economic_graphrag.viz.charts import add_events_overlay
    _VIZ_OK = True
except Exception as _viz_err:
    _VIZ_OK = False
    _viz_err_msg = str(_viz_err)

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Economic GraphRAG",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ────────────────────────────────────────────────────────────────────────
st.markdown("""<style>
.source-tag {
    background:#e8f4f8;border-radius:4px;padding:2px 8px;
    font-size:0.8em;color:#2c7bb6;display:inline-block;margin:2px;
}
.graph-path {
    background:#f8f0ff;border-radius:4px;padding:4px 8px;
    font-family:monospace;font-size:0.85em;margin:2px 0;
}
.kpi-card {
    background:#f0f2f6;border-radius:10px;padding:14px 16px;
    text-align:center;margin:4px 0;
}
.trend-up   { color:#1a9641; font-weight:600; }
.trend-down { color:#d7191c; font-weight:600; }
.risk-card-green {
    background:linear-gradient(135deg,#d4edda,#c3e6cb);
    border-left:5px solid #1a9641;border-radius:10px;
    padding:14px 18px;margin:6px 0;
}
.risk-card-yellow {
    background:linear-gradient(135deg,#fff3cd,#ffeaa7);
    border-left:5px solid #e8b004;border-radius:10px;
    padding:14px 18px;margin:6px 0;
}
.risk-card-red {
    background:linear-gradient(135deg,#f8d7da,#f5c6cb);
    border-left:5px solid #d7191c;border-radius:10px;
    padding:14px 18px;margin:6px 0;
}
.insight-card {
    background:#f8f9fa;border-left:4px solid #2c7bb6;
    border-radius:6px;padding:10px 14px;margin:4px 0;font-size:0.92em;
}
.insight-high   { border-left-color:#d7191c; background:#fff5f5; }
.insight-medium { border-left-color:#e8b004; background:#fffbf0; }
.insight-info   { border-left-color:#2c7bb6; background:#f0f8ff; }
.metric-badge {
    display:inline-block;background:#e8f4f8;border-radius:20px;
    padding:3px 12px;font-size:0.85em;color:#2c7bb6;margin:2px;font-weight:600;
}
.followup-section {
    background:#f0f4ff;border-radius:8px;padding:10px 14px;margin-top:10px;
}
</style>""", unsafe_allow_html=True)


# ── Cached helpers ─────────────────────────────────────────────────────────────
@st.cache_resource
def _get_vs_cached():
    return ChromaVectorStore()

def _get_vs():
    if "vector_store" not in st.session_state:
        st.session_state.vector_store = _get_vs_cached()
    return st.session_state.vector_store

def _get_workflow():
    if "workflow" not in st.session_state:
        st.session_state.workflow = MainWorkflow()
    return st.session_state.workflow

def _get_all_chunks():
    if "all_chunks" not in st.session_state:
        st.session_state.all_chunks = _get_vs()._store.get_all()
    return st.session_state.all_chunks

def _get_tidy_df():
    if "tidy_df" not in st.session_state and _VIZ_OK:
        st.session_state.tidy_df = build_tidy_df(_get_all_chunks())
    return st.session_state.get("tidy_df", pd.DataFrame())

@st.cache_data(ttl=300, show_spinner=False)
def _cached_insights(chunks_hash: int):
    """Cache smart insights computation (re-runs when data changes)."""
    if not _VIZ_OK:
        return []
    chunks = _get_all_chunks()
    tidy   = build_tidy_df(chunks)
    return generate_all_insights(tidy) if not tidy.empty else []

def _get_insights():
    chunks = _get_all_chunks()
    h = hash(len(chunks))
    return _cached_insights(h)

def _generate_followup_questions(query: str, vector_results: List[Dict[str, Any]]) -> List[str]:
    """Generate 3 contextual follow-up questions based on the query and retrieved data."""
    # Extract countries and indicators from top results
    countries = list({r.get("country", "") for r in vector_results[:6] if r.get("country")})[:3]
    indicators = list({
        r.get("indicator", "").split(",")[0].strip()
        for r in vector_results[:6] if r.get("indicator")
    })[:3]

    q_lower = query.lower()
    questions = []

    # Country-based follow-ups
    if countries:
        c = countries[0]
        questions.append(f"What are the key economic risks facing {c} in the next 5 years?")
        if len(countries) >= 2:
            questions.append(
                f"How does {countries[0]}'s economic performance compare to {countries[1]}?"
            )

    # Indicator-based follow-ups
    ind_map = {
        "gdp": "GDP growth",
        "inflation": "inflation and monetary policy",
        "unemployment": "labour market and employment trends",
        "trade": "trade balance and export composition",
        "debt": "government debt sustainability",
        "fdi": "foreign direct investment drivers",
    }
    for key, phrase in ind_map.items():
        if key in q_lower and f"what drives {phrase}" not in questions:
            questions.append(f"What are the main drivers of {phrase} in G20 economies?")
            break

    # Time-based follow-up
    if "trend" not in q_lower and "since" not in q_lower and len(questions) < 3:
        if countries:
            questions.append(f"How has {countries[0]}'s economy changed since the 2008 financial crisis?")
        elif indicators:
            questions.append(f"How has {indicators[0]} evolved across G20 nations over the past decade?")

    # Comparative follow-up
    if len(questions) < 3 and countries:
        questions.append(
            f"Which G20 country has the most resilient economy and why?"
        )

    # Fallback generic questions
    fallbacks = [
        "Which G20 economies face the highest recession risk right now?",
        "How does government debt affect economic growth across G20 nations?",
        "What is the outlook for global inflation and interest rates?",
    ]
    for fb in fallbacks:
        if len(questions) >= 3:
            break
        if fb not in questions:
            questions.append(fb)

    return questions[:3]

vs_size = _get_vs().get_collection_size()
g_nodes = nx_graph.node_count
g_edges = nx_graph.edge_count
is_ready = vs_size > 0 and g_nodes > 0


# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.title("📈 Economic GraphRAG")
    st.caption("Hybrid RAG · LangGraph · Gemini / OpenRouter")
    st.divider()

    st.subheader("🔍 System Status")
    c1, c2 = st.columns(2)
    c1.metric("Vector chunks", vs_size)
    c2.metric("Graph nodes",   g_nodes)
    c1.metric("Graph edges",   g_edges)
    c2.caption(f"Neo4j: {'✅' if neo4j_manager.available else '⚠️ NetworkX'}")
    if is_ready:
        st.success("✅ RAG pipeline ready")
    else:
        st.warning("⚠️ Run ingestion first")

    st.divider()

    st.subheader("📥 Data Ingestion")
    with st.expander("Configure sources", expanded=not is_ready):
        st.markdown("**Core sources (original)**")
        use_wb   = st.checkbox("🏦 World Bank — G20: GDP, Inflation, Trade, Unemployment", value=True)
        use_fred = st.checkbox("🇺🇸 FRED — US: CPI, Fed Funds Rate, M2, Treasuries", value=True)
        use_oecd = st.checkbox("🌐 OECD / World Bank — G7 GDP growth rate", value=True)
        st.markdown("**New free sources (no API key)**")
        use_imf  = st.checkbox("📊 IMF WEO — G20: Govt Debt, Current Account, GDP Growth", value=True)
        use_ecb  = st.checkbox("🇪🇺 ECB Data Portal — Eurozone: Policy Rates, EUR/USD, HICP", value=True)
        use_wbe  = st.checkbox("🌍 World Bank Extended — FDI, Population, Capital Formation, CO2", value=True)
        st.markdown("**Other**")
        use_pdfs = st.checkbox("📄 PDF reports in data/pdfs/", value=True)
        clear_vs = st.checkbox("🗑️ Clear existing data first", value=False)

    if st.button("🚀 Run Ingestion Pipeline", use_container_width=True, type="primary"):
        from main_ingestion import run_ingestion_pipeline
        pb = st.progress(0); st_txt = st.empty()
        _w = {"LOAD":0.20,"CHUNK":0.12,"VECTOR":0.25,"GRAPH":0.18,"DONE":0.05}
        _pv = [0.0]
        def _cb(step, detail):
            _pv[0] = min(1.0, _pv[0] + _w.get(step, 0) / 4)
            pb.progress(_pv[0])
            icon = {"LOAD":"📡","CHUNK":"✂️","VECTOR":"🔢","GRAPH":"🕸️","DONE":"✅","WARN":"⚠️"}.get(step,"•")
            st_txt.info(f"{icon} [{step}] {detail}")
        with st.spinner("Ingesting… (3-8 min with all sources)"):
            stats = run_ingestion_pipeline(
                use_worldbank=use_wb, use_fred=use_fred,
                use_oecd=use_oecd, use_pdfs=use_pdfs,
                use_imf=use_imf, use_ecb=use_ecb, use_wb_extended=use_wbe,
                clear_existing=clear_vs, progress_callback=_cb,
            )
        pb.progress(1.0); st_txt.success("✅ Done!")
        for k in ["vector_store","workflow","all_chunks","tidy_df"]:
            st.session_state.pop(k, None)
        st.success(
            f"**Done!**  📄 {stats['docs_loaded']} docs · "
            f"✂️ {stats['chunks_created']} chunks · "
            f"🕸️ {stats['graph_nodes']} nodes"
        )
        time.sleep(1); st.rerun()

    st.divider()
    st.subheader("💬 Chat")
    if st.button("🗑️ Clear chat history", use_container_width=True):
        st.session_state.messages = []
        st.session_state.query_history = []
        st.rerun()

    # Query history summary in sidebar
    qh = st.session_state.get("query_history", [])
    if qh:
        st.caption(f"**{len(qh)} queries** this session")
        avg_ms = int(np.mean([q["latency_ms"] for q in qh]))
        st.caption(f"Avg latency: **{avg_ms} ms**")

    st.divider()
    st.caption("**Stack:** LangGraph · Gemini / OpenRouter · TF-IDF · NetworkX · Plotly · spaCy")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE TABS
# ══════════════════════════════════════════════════════════════════════════════
PAGE_TABS = st.tabs([
    "💬 Chat",
    "🌍 Dashboard",
    "🔬 Country Profile",
    "📊 Correlations",
    "📋 Query History",
    "🗂️ Data Explorer",
    "🕸️ Graph Explorer",
    "ℹ️ About",
    "🚦 Recession Risk",
    "📝 Economic Report",
    "🎛️ Policy Sandbox",
])


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: answer detail tabs (used in Chat tab)
# ─────────────────────────────────────────────────────────────────────────────
def _render_answer_tabs(d: Dict[str, Any], key_suffix: str = ""):
    vr = d.get("vector_results", [])
    gr = d.get("graph_results",  [])
    tabs = st.tabs(["📊 Chunks", "🕸️ Graph Paths", "📈 Charts", "🌐 Network", "🧠 Explanation", "📋 Plan"])

    with tabs[0]:
        if vr:
            for i, r in enumerate(vr[:6], 1):
                with st.expander(f"[{i}] {r.get('title','?')[:55]} | {r.get('country','')} — {r.get('score',0):.3f}"):
                    st.text(r.get("content","")[:700])
        else:
            st.caption("No vector results.")

    with tabs[1]:
        if gr:
            for r in gr[:20]:
                st.markdown(
                    f'<div class="graph-path">({r.get("subject","?")})'
                    f' ──[{r.get("relationship","?")}]──▶ ({r.get("object","?")})</div>',
                    unsafe_allow_html=True,
                )
        else:
            st.caption("No graph paths found.")

    with tabs[2]:
        if _VIZ_OK and vr:
            ind_groups = group_chunks_by_indicator(vr)
            for ind, chunks in list(ind_groups.items())[:3]:
                st.markdown(f"**{ind}**")
                fig_ts  = build_timeseries_chart(chunks, title=ind)
                fig_bar = build_bar_comparison_chart(chunks, year=2023)
                if fig_ts:
                    st.plotly_chart(fig_ts,  use_container_width=True, key=f"ts_{key_suffix}_{ind[:15]}")
                if fig_bar and len(chunks) > 1:
                    st.plotly_chart(fig_bar, use_container_width=True, key=f"bar_{key_suffix}_{ind[:15]}")
        elif not _VIZ_OK:
            st.info("Install plotly to see charts.")
        else:
            st.caption("No data to chart.")

    with tabs[3]:
        if _VIZ_OK and gr:
            sg  = get_graph_subgraph_for_query("", gr)
            fig = build_graph_network_chart(sg, query=d.get("plan",{}).get("query",""))
            if fig:
                st.plotly_chart(fig, use_container_width=True, key=f"net_{key_suffix}")
            else:
                st.caption("Not enough graph data.")
        else:
            st.caption("No graph data.")

    with tabs[4]:
        st.write(d.get("explainability", ""))
        for s in d.get("sources", []):
            st.markdown(f'<span class="source-tag">{s}</span>', unsafe_allow_html=True)

    with tabs[5]:
        st.json(d.get("plan", {}))


# ══════════════════════════════════════════════════════════════════════════════
# TAB 0 — CHAT
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[0]:
    st.header("📈 Agentic Hybrid GraphRAG for Macroeconomic Intelligence")
    st.caption("Semantic vector search + knowledge graph traversal → LLM synthesis")
    if not is_ready:
        st.info("👈 Run the ingestion pipeline in the sidebar first.")

    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "query_history" not in st.session_state:
        st.session_state.query_history = []

    for i, msg in enumerate(st.session_state.messages):
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("details"):
                _render_answer_tabs(msg["details"], key_suffix=f"hist_{i}")

    SAMPLE_QUESTIONS = [
        "What is the relationship between inflation and interest rates in the United States?",
        "Compare GDP growth between India and Germany over the last decade.",
        "How does trade as a percentage of GDP vary across G20 nations?",
        "What has been the trend of US unemployment rate since 2000?",
        "Which countries have the highest inflation rates among G20 nations?",
    ]
    if not st.session_state.messages:
        st.subheader("💡 Try one of these questions:")
        cols = st.columns(2)
        for i, q in enumerate(SAMPLE_QUESTIONS):
            if cols[i % 2].button(q, key=f"sample_{i}", use_container_width=True):
                st.session_state["pending_query"] = q
                st.rerun()

    prompt = st.chat_input("Ask a macroeconomic question…")
    if not prompt and "pending_query" in st.session_state:
        prompt = st.session_state.pop("pending_query")

    if prompt:
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            if vs_size == 0:
                msg = "⚠️ Knowledge base empty — run ingestion first."
                st.warning(msg)
                st.session_state.messages.append({"role": "assistant", "content": msg})
            else:
                t_start = time.time()
                with st.status("Running Hybrid GraphRAG pipeline…", expanded=True) as status_box:
                    try:
                        wf = _get_workflow()

                        st.write("🧠 **Step 1/3 — Planning:** Classifying query & selecting strategy…")
                        plan = wf.planner.plan(prompt)
                        st.write(
                            f"   Strategy: **{plan.get('retrieval_strategy','hybrid').upper()}** | "
                            f"Type: **{plan.get('query_type','ResearchQuery')}**"
                        )

                        st.write("🔍 **Step 2/3 — Retrieval:** Vector + graph search…")
                        vector_results = wf.vector_agent.retrieve({"query": prompt, "plan": plan}).get("vector_results", [])
                        graph_results  = wf.graph_agent.retrieve({"query":  prompt, "plan": plan}).get("graph_results",  [])
                        st.write(f"   Found **{len(vector_results)}** chunks, **{len(graph_results)}** graph paths")

                        st.write("✍️ **Step 3/3 — Synthesis:** Generating answer with LLM…")
                        ctx = {"vector_results": vector_results, "graph_results": graph_results}
                        answer_data = wf.answer_agent.generate_answer(prompt, ctx)

                        status_box.update(label="✅ Pipeline complete", state="complete", expanded=False)

                        answer  = answer_data.get("answer", "No answer generated.")
                        sources = answer_data.get("sources", [])
                        explain = answer_data.get("explainability", "")

                        st.markdown(answer)
                        if sources:
                            st.markdown("---")
                            st.write("**Sources:**")
                            for s in sources:
                                st.markdown(f'<span class="source-tag">{s}</span>', unsafe_allow_html=True)

                        details = {
                            "plan": plan,
                            "vector_results": vector_results,
                            "graph_results":  graph_results,
                            "sources":        sources,
                            "explainability": explain,
                        }
                        st.markdown("---")
                        _render_answer_tabs(details, key_suffix=f"live_{len(st.session_state.messages)}")

                        latency_ms = int((time.time() - t_start) * 1000)
                        st.caption(f"⏱️ {latency_ms} ms · {len(vector_results)} chunks · {len(graph_results)} paths")

                        # Follow-up question suggestions
                        followups = _generate_followup_questions(prompt, vector_results)
                        if followups:
                            st.markdown('<div class="followup-section">', unsafe_allow_html=True)
                            st.markdown("💡 **Suggested follow-up questions:**")
                            fup_cols = st.columns(len(followups))
                            for _fi, _fq in enumerate(followups):
                                if fup_cols[_fi].button(
                                    _fq, key=f"fup_{len(st.session_state.messages)}_{_fi}",
                                    use_container_width=True,
                                ):
                                    st.session_state["pending_query"] = _fq
                                    st.rerun()
                            st.markdown('</div>', unsafe_allow_html=True)

                        st.session_state.messages.append({"role": "assistant", "content": answer, "details": details})
                        st.session_state.query_history.append({
                            "query":          prompt,
                            "answer_snippet": answer[:200],
                            "latency_ms":     latency_ms,
                            "chunks":         len(vector_results),
                            "paths":          len(graph_results),
                            "strategy":       plan.get("retrieval_strategy", "hybrid"),
                            "query_type":     plan.get("query_type", "?"),
                            "timestamp":      time.strftime("%H:%M:%S"),
                        })

                    except Exception as exc:
                        import traceback
                        status_box.update(label="❌ Pipeline error", state="error")
                        st.error(f"Error: {exc}")
                        st.code(traceback.format_exc())
                        st.session_state.messages.append({"role": "assistant", "content": f"❌ Error: {exc}"})


# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — GLOBAL DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[1]:
    st.header("🌍 Global Economic Dashboard")
    st.caption("World map + country rankings for any macroeconomic indicator")

    if not is_ready or not _VIZ_OK:
        st.info("Run the ingestion pipeline first, or install Plotly." if not _VIZ_OK else
                "👈 Run the ingestion pipeline in the sidebar.")
    else:
        tidy_df = _get_tidy_df()

        if tidy_df.empty:
            st.warning("No structured data parsed from chunks.")
        else:
            indicators_avail = sorted(tidy_df["indicator"].unique())
            all_years = sorted(tidy_df["year"].unique())
            max_year  = int(all_years[-1]) if all_years else 2023

            # Controls
            col_ctrl1, col_ctrl2, col_ctrl3 = st.columns([3, 2, 1])
            sel_ind  = col_ctrl1.selectbox("Indicator", indicators_avail, key="db_ind",
                                           index=0)
            sel_year = col_ctrl2.slider("Year", int(all_years[0]), max_year, max_year, key="db_year")
            rev_sc   = col_ctrl3.checkbox("Reverse scale", value=False, key="db_rev")

            latest_df = get_latest_values(tidy_df, sel_ind, preferred_year=sel_year)

            # Global KPIs
            if not latest_df.empty:
                kpi1, kpi2, kpi3, kpi4 = st.columns(4)
                best   = latest_df.iloc[0]
                worst  = latest_df.iloc[-1]
                avg_v  = latest_df["value"].mean()
                median = latest_df["value"].median()
                unit   = INDICATOR_UNITS.get(sel_ind, "")

                with kpi1:
                    st.metric("🏆 Highest", f"{best['country']}", f"{best['value']:.2f} {unit}")
                with kpi2:
                    st.metric("🔻 Lowest",  f"{worst['country']}", f"{worst['value']:.2f} {unit}")
                with kpi3:
                    st.metric("📊 G20 Average", f"{avg_v:.2f} {unit}")
                with kpi4:
                    st.metric("📐 Median",  f"{median:.2f} {unit}")

            st.divider()

            # Choropleth + Ranking side by side
            col_map, col_rank = st.columns([3, 2])
            with col_map:
                fig_choro = build_choropleth_map(latest_df, sel_ind, sel_year, reverse_scale=rev_sc)
                if fig_choro:
                    st.plotly_chart(fig_choro, use_container_width=True, key="db_choro")
                else:
                    st.info("Map unavailable (no ISO codes matched).")
            with col_rank:
                fig_rank = build_ranking_chart(latest_df, sel_ind, sel_year)
                if fig_rank:
                    st.plotly_chart(fig_rank, use_container_width=True, key="db_rank")

            st.divider()
            st.subheader("📊 Country × Year Heatmap")
            matrix = build_indicator_matrix(tidy_df, sel_ind)
            fig_heat = build_indicator_heatmap(matrix, sel_ind)
            if fig_heat:
                st.plotly_chart(fig_heat, use_container_width=True, key="db_heat")

            st.divider()
            st.subheader("🏆 G20 Comparison Matrix")
            st.caption("Green = better performance; all indicators normalized relative to G20 peers.")
            fig_matrix = build_comparison_matrix_chart(tidy_df, year=sel_year)
            if fig_matrix:
                st.plotly_chart(fig_matrix, use_container_width=True, key="db_cmatrix")

            # ── Smart Insights ─────────────────────────────────────────────
            st.divider()
            st.subheader("💡 Smart Insights — Auto-detected Economic Patterns")
            st.caption("Outliers, trend reversals, record values, and rapid changes across G20 countries")
            if is_ready and _VIZ_OK:
                with st.spinner("Analyzing patterns…"):
                    insights = _get_insights()
                if insights:
                    severity_filter = st.radio(
                        "Filter by severity",
                        ["All", "🔴 High", "🟡 Medium", "🔵 Info"],
                        horizontal=True, key="ins_filter",
                    )
                    sev_map = {"All": None, "🔴 High": "high", "🟡 Medium": "medium", "🔵 Info": "info"}
                    sel_sev = sev_map[severity_filter]
                    filtered_ins = [i for i in insights if sel_sev is None or i["severity"] == sel_sev]

                    st.markdown(f"**{len(filtered_ins)}** patterns found")
                    type_labels = {"outlier": "📊 Outlier", "trend_reversal": "↔️ Trend Reversal",
                                   "record": "🏆 Record Value", "rapid_change": "⚡ Rapid Change"}
                    for ins in filtered_ins[:15]:
                        emoji   = SEVERITY_EMOJI.get(ins["severity"], "•")
                        css_cls = f"insight-{ins['severity']}"
                        type_lbl = type_labels.get(ins["type"], ins["type"])
                        st.markdown(
                            f'<div class="insight-card {css_cls}">'
                            f'{emoji} <b>{type_lbl}</b> &nbsp;·&nbsp; {ins["headline"]}'
                            f'</div>',
                            unsafe_allow_html=True,
                        )
                else:
                    st.info("Ingest data first to generate insights.")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — COUNTRY PROFILE
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[2]:
    st.header("🔬 Country Deep Dive")
    st.caption("Full economic profile for any country in the dataset")

    if not is_ready or not _VIZ_OK:
        st.info("Ingest data first.")
    else:
        tidy_df = _get_tidy_df()
        if tidy_df.empty:
            st.warning("No data available.")
        else:
            all_countries = sorted(tidy_df["country"].unique())
            col_cp1, col_cp2, col_cp3 = st.columns([2, 2, 1])
            sel_country  = col_cp1.selectbox("Country", all_countries, key="cp_country")
            comp_country = col_cp2.selectbox("Compare with (optional)", ["— none —"] + [c for c in all_countries if c != sel_country], key="cp_compare")
            cp_year      = col_cp3.number_input("Reference year", 2015, 2023, 2023, key="cp_year")

            summary      = build_country_summary(tidy_df, sel_country,  year=cp_year)
            comp_summary = build_country_summary(tidy_df, comp_country, year=cp_year) if comp_country != "— none —" else None

            indicators_info = summary.get("indicators", {})
            if not indicators_info:
                st.warning(f"No indicator data found for {sel_country}.")
            else:
                # KPI row
                st.subheader(f"📌 {sel_country} — Key Indicators (≈{cp_year})")
                kpi_cols = st.columns(min(len(indicators_info), 4))
                for i, (ind, info) in enumerate(list(indicators_info.items())[:4]):
                    col = kpi_cols[i]
                    v    = info.get("latest_value", 0)
                    yoy  = info.get("yoy_pct")
                    unit = info.get("unit", "")
                    short = INDICATOR_SHORT.get(ind, ind)
                    delta_str = f"{yoy:+.1f}% YoY" if yoy is not None else None
                    col.metric(short, f"{v:.2f} {unit}", delta=delta_str)

                # Radar chart
                st.divider()
                col_radar, col_stats = st.columns([2, 3])
                with col_radar:
                    fig_radar = build_country_radar(summary, compare_summary=comp_summary)
                    if fig_radar:
                        st.plotly_chart(fig_radar, use_container_width=True, key="cp_radar")

                with col_stats:
                    st.subheader("📊 Indicator Statistics")
                    rows = []
                    for ind, info in indicators_info.items():
                        short = INDICATOR_SHORT.get(ind, ind)
                        trend_data = detect_trend(pd.DataFrame(info.get("series", [])))
                        direction_icon = "↑" if trend_data.get("direction") == "upward" else "↓" if trend_data.get("direction") == "downward" else "→"
                        rows.append({
                            "Indicator": short,
                            "Latest":    f"{info.get('latest_value',0):.2f} {info.get('unit','')}",
                            "YoY":       f"{info.get('yoy_pct',0):.1f}%" if info.get("yoy_pct") is not None else "—",
                            "5yr CAGR":  f"{info.get('cagr_5y',0):.1f}%" if info.get("cagr_5y") is not None else "—",
                            "Trend":     f"{direction_icon} {trend_data.get('direction','?')}",
                            "R²":        f"{trend_data.get('r_squared',0):.2f}",
                        })
                    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

                # Individual indicator charts
                st.divider()
                st.subheader("📈 Time Series — All Indicators")
                ind_list = list(indicators_info.items())
                for row_start in range(0, len(ind_list), 2):
                    cols = st.columns(2)
                    for ci, (ind, info) in enumerate(ind_list[row_start:row_start + 2]):
                        with cols[ci]:
                            series_records = info.get("series", [])
                            if not series_records:
                                continue
                            series_df = pd.DataFrame(series_records)
                            chunk = [{
                                "content": "\n".join(
                                    f"{int(r['year'])}  {r['value']}" for r in series_records
                                ),
                                "country": sel_country,
                                "indicator": ind,
                                "title": f"{ind} — {sel_country}",
                            }]
                            # Also add compare country if selected
                            if comp_summary:
                                comp_info = comp_summary.get("indicators", {}).get(ind, {})
                                comp_records = comp_info.get("series", [])
                                if comp_records:
                                    chunk.append({
                                        "content": "\n".join(
                                            f"{int(r['year'])}  {r['value']}" for r in comp_records
                                        ),
                                        "country": comp_country,
                                        "indicator": ind,
                                        "title": f"{ind} — {comp_country}",
                                    })
                            fig_ts = build_timeseries_chart(chunk, title=INDICATOR_SHORT.get(ind, ind))
                            if fig_ts:
                                st.plotly_chart(fig_ts, use_container_width=True,
                                                key=f"cp_ts_{sel_country}_{ind[:15]}_{ci}_{row_start}")

                # Forecast section
                st.divider()
                st.subheader("🔮 5-Year Forecast (Linear Extrapolation)")
                forecast_ind = st.selectbox(
                    "Select indicator to forecast",
                    list(indicators_info.keys()),
                    format_func=lambda x: INDICATOR_SHORT.get(x, x),
                    key="cp_forecast_ind",
                )
                if forecast_ind in indicators_info:
                    series_records = indicators_info[forecast_ind].get("series", [])
                    if series_records:
                        series_df = pd.DataFrame(series_records)
                        hist_df, fc_df = forecast_series(series_df, n_years=5)
                        fig_fc = build_forecast_chart(hist_df, fc_df, sel_country, forecast_ind)
                        if fig_fc:
                            st.plotly_chart(fig_fc, use_container_width=True, key="cp_fc")
                            if not fc_df.empty:
                                fc_last = fc_df.iloc[-1]
                                curr_v  = indicators_info[forecast_ind].get("latest_value", 0)
                                fc_v    = fc_last["value"]
                                unit    = INDICATOR_UNITS.get(forecast_ind, "")
                                chg     = ((fc_v - curr_v) / abs(curr_v) * 100) if curr_v != 0 else 0
                                st.info(
                                    f"📌 **Forecast to {int(fc_last['year'])}:** "
                                    f"**{fc_v:.2f} {unit}** "
                                    f"({'▲' if chg > 0 else '▼'} {abs(chg):.1f}% from {cp_year}). "
                                    f"*Linear trend only — not a financial forecast.*"
                                )


# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — CORRELATIONS
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[3]:
    st.header("📊 Economic Correlation Explorer")
    st.caption("Discover relationships between macroeconomic indicators across G20 countries")

    if not is_ready or not _VIZ_OK:
        st.info("Ingest data first.")
    else:
        tidy_df = _get_tidy_df()
        if tidy_df.empty:
            st.warning("No data available.")
        else:
            corr_year = st.slider("Year for correlation snapshot", 2010, 2023, 2022, key="corr_year")
            corr_df   = build_correlation_matrix(tidy_df, year=corr_year)

            # Correlation heatmap
            col_h1, col_h2 = st.columns([3, 2])
            with col_h1:
                fig_corr = build_correlation_heatmap(corr_df)
                if fig_corr:
                    st.plotly_chart(fig_corr, use_container_width=True, key="corr_heatmap")
            with col_h2:
                st.subheader("📋 Key Insights")
                if not corr_df.empty:
                    # Find strongest pairs
                    pairs = []
                    cols_c = corr_df.columns.tolist()
                    for i in range(len(cols_c)):
                        for j in range(i + 1, len(cols_c)):
                            v = corr_df.iloc[i, j]
                            if not np.isnan(v):
                                pairs.append((cols_c[i], cols_c[j], v))
                    pairs.sort(key=lambda x: abs(x[2]), reverse=True)
                    st.markdown("**Strongest correlations:**")
                    for a, b, v in pairs[:5]:
                        icon = "🔴" if v < -0.4 else "🟢" if v > 0.4 else "🟡"
                        dir_label = "positive" if v > 0 else "negative"
                        st.markdown(f"{icon} **{a}** × **{b}** — r = {v:.2f} ({dir_label})")
                    st.divider()
                    st.caption("r > 0.5: strong positive | r < -0.5: strong negative")

            st.divider()

            # Specific scatter plots — classic macro relationships
            st.subheader("🔍 Classic Economic Relationships")
            scatter_presets = [
                ("Phillips Curve",
                 "Inflation, consumer prices (annual %)",
                 "Unemployment rate (% of total labour force)"),
                ("Okun's Law",
                 "GDP growth rate (annual %, seasonally adjusted)",
                 "Unemployment rate (% of total labour force)"),
                ("Trade vs. GDP per Capita",
                 "Trade (% of GDP)",
                 "GDP per capita (current US$)"),
                ("Inflation vs. Exchange Rate",
                 "Inflation, consumer prices (annual %)",
                 "Official exchange rate (LCU per US$)"),
            ]

            ind_list_avail = sorted(tidy_df["indicator"].unique())

            tab_labels = [p[0] for p in scatter_presets] + ["✏️ Custom"]
            scatter_tabs = st.tabs(tab_labels)

            for ti, (title, x_ind, y_ind) in enumerate(scatter_presets):
                with scatter_tabs[ti]:
                    if x_ind in ind_list_avail and y_ind in ind_list_avail:
                        fig_sc = build_scatter_plot(tidy_df, x_ind, y_ind, year=corr_year, title=title)
                        if fig_sc:
                            st.plotly_chart(fig_sc, use_container_width=True, key=f"scatter_{ti}")
                        else:
                            st.caption("Insufficient data for this scatter plot.")
                    else:
                        st.caption(f"Data unavailable for: {x_ind} or {y_ind}")
                        st.caption(f"Available: {ind_list_avail}")

            with scatter_tabs[-1]:
                cx1, cx2 = st.columns(2)
                custom_x = cx1.selectbox("X-axis indicator", ind_list_avail, key="corr_cx")
                custom_y = cx2.selectbox("Y-axis indicator", ind_list_avail, index=min(1, len(ind_list_avail)-1), key="corr_cy")
                if custom_x != custom_y:
                    fig_custom = build_scatter_plot(tidy_df, custom_x, custom_y, year=corr_year)
                    if fig_custom:
                        st.plotly_chart(fig_custom, use_container_width=True, key="corr_custom")
                else:
                    st.caption("Select two different indicators.")

            # Multi-year correlation trend
            st.divider()
            st.subheader("📈 Correlation Trend Over Time")
            st.caption("See how the correlation between two indicators has evolved year-by-year.")
            cy1, cy2 = st.columns(2)
            trend_x = cy1.selectbox("Indicator A", ind_list_avail, key="corr_tx")
            trend_y = cy2.selectbox("Indicator B", ind_list_avail, index=min(1, len(ind_list_avail)-1), key="corr_ty")
            if trend_x != trend_y:
                year_range  = range(max(2005, int(tidy_df["year"].min())), int(tidy_df["year"].max()) + 1)
                corr_series = []
                for yr in year_range:
                    cm = build_correlation_matrix(tidy_df, year=yr)
                    x_short = INDICATOR_SHORT.get(trend_x, trend_x)
                    y_short = INDICATOR_SHORT.get(trend_y, trend_y)
                    if not cm.empty and x_short in cm.columns and y_short in cm.columns:
                        corr_series.append({"year": yr, "correlation": cm.loc[x_short, y_short]})
                if corr_series:
                    import plotly.graph_objects as go
                    df_ct = pd.DataFrame(corr_series).dropna()
                    fig_ct = go.Figure(go.Scatter(
                        x=df_ct["year"], y=df_ct["correlation"],
                        mode="lines+markers",
                        line=dict(color="#2c7bb6", width=2),
                        fill="tozeroy",
                        fillcolor="rgba(44,123,182,0.1)",
                        hovertemplate="Year: %{x}<br>r = %{y:.3f}<extra></extra>",
                    ))
                    fig_ct.add_hline(y=0, line_dash="dot", line_color="#999")
                    fig_ct.update_layout(
                        title=f"Correlation: {INDICATOR_SHORT.get(trend_x,trend_x)} vs {INDICATOR_SHORT.get(trend_y,trend_y)}",
                        xaxis_title="Year", yaxis_title="Pearson r",
                        yaxis=dict(range=[-1.1, 1.1]),
                        template="plotly_white", height=320,
                        margin=dict(l=50, r=20, t=55, b=40),
                    )
                    st.plotly_chart(fig_ct, use_container_width=True, key="corr_trend")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — QUERY HISTORY
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[4]:
    st.header("📋 Query History & Analytics")
    st.caption("All queries asked this session with performance metrics")

    qh = st.session_state.get("query_history", [])
    if not qh:
        st.info("No queries yet. Ask a question in the Chat tab.")
    else:
        # Summary KPIs
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Total Queries", len(qh))
        k2.metric("Avg Latency",  f"{int(np.mean([q['latency_ms'] for q in qh]))} ms")
        k3.metric("Avg Chunks Retrieved", f"{np.mean([q['chunks'] for q in qh]):.1f}")
        k4.metric("Avg Graph Paths",      f"{np.mean([q['paths']  for q in qh]):.1f}")

        st.divider()

        # Latency chart
        if _VIZ_OK and len(qh) > 1:
            import plotly.graph_objects as go
            fig_lat = go.Figure(go.Bar(
                x=list(range(1, len(qh) + 1)),
                y=[q["latency_ms"] for q in qh],
                marker_color=["#2c7bb6" if q["latency_ms"] < 5000 else "#d7191c" for q in qh],
                hovertext=[q["query"][:60] + "…" for q in qh],
                hovertemplate="%{hovertext}<br>%{y} ms<extra></extra>",
            ))
            fig_lat.update_layout(
                title="Query Latency (ms)", xaxis_title="Query #",
                yaxis_title="Latency (ms)", template="plotly_white",
                height=260, margin=dict(l=40, r=10, t=45, b=30),
            )
            st.plotly_chart(fig_lat, use_container_width=True, key="qh_lat")

        # Strategy breakdown
        if _VIZ_OK:
            strategies = {}
            for q in qh:
                s = q.get("strategy", "hybrid")
                strategies[s] = strategies.get(s, 0) + 1
            import plotly.express as px
            fig_strat = px.pie(
                values=list(strategies.values()),
                names=list(strategies.keys()),
                title="Retrieval Strategy Mix",
                height=280,
                color_discrete_sequence=px.colors.qualitative.Set2,
            )
            fig_strat.update_traces(textinfo="label+percent")
            fig_strat.update_layout(template="plotly_white", margin=dict(l=0, r=0, t=45, b=0))
            st.plotly_chart(fig_strat, use_container_width=True, key="qh_strat")

        st.divider()
        st.subheader("📜 All Queries")

        # History table + re-run
        for i, q in enumerate(reversed(qh)):
            n = len(qh) - i
            with st.expander(f"**Q{n}** [{q['timestamp']}] {q['query'][:80]}…", expanded=(i == 0)):
                c1, c2, c3, c4 = st.columns(4)
                c1.markdown(f"⏱️ **{q['latency_ms']} ms**")
                c2.markdown(f"📦 **{q['chunks']}** chunks")
                c3.markdown(f"🕸️ **{q['paths']}** paths")
                c4.markdown(f"🎯 {q['strategy']} · {q['query_type']}")
                st.markdown(f"> {q['answer_snippet']}…")
                if st.button("🔄 Re-run this query", key=f"rerun_{i}"):
                    st.session_state["pending_query"] = q["query"]
                    st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
# TAB 5 — DATA EXPLORER
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[5]:
    st.header("🗂️ Data Explorer")
    st.caption("Browse all ingested economic data by country and indicator.")

    if vs_size == 0:
        st.info("No data yet.")
    else:
        all_chunks = _get_all_chunks()
        countries_all  = sorted({c.get("country","")   for c in all_chunks if c.get("country")})
        indicators_all = sorted({c.get("indicator","") for c in all_chunks if c.get("indicator")})
        sources_all    = sorted({c.get("source","")    for c in all_chunks if c.get("source")})

        col_f1, col_f2, col_f3 = st.columns(3)
        sel_c  = col_f1.selectbox("Country",   ["All"] + countries_all,  key="de_c")
        sel_i  = col_f2.selectbox("Indicator", ["All"] + indicators_all, key="de_i")
        sel_s  = col_f3.selectbox("Source",    ["All"] + sources_all,    key="de_s")

        filtered = [
            c for c in all_chunks
            if (sel_c == "All" or c.get("country","")   == sel_c)
            and (sel_i == "All" or c.get("indicator","") == sel_i)
            and (sel_s == "All" or c.get("source","")    == sel_s)
        ]
        col_res, col_exp = st.columns([3, 1])
        col_res.markdown(f"**{len(filtered)}** chunks match filters")

        # CSV export
        if filtered:
            from io import StringIO
            rows_exp = []
            for ch in filtered:
                rows_exp.append({
                    "title":      ch.get("title", ""),
                    "country":    ch.get("country", ""),
                    "indicator":  ch.get("indicator", ""),
                    "source":     ch.get("source", ""),
                    "pub_date":   ch.get("publication_date", ""),
                })
            df_export = pd.DataFrame(rows_exp)
            csv_buf = StringIO()
            df_export.to_csv(csv_buf, index=False)
            col_exp.download_button(
                "⬇️ Export CSV",
                csv_buf.getvalue(),
                file_name=f"economic_data_{sel_c}_{sel_i[:20] if sel_i != 'All' else 'all'}.csv",
                mime="text/csv",
                use_container_width=True,
            )

        if _VIZ_OK and filtered:
            ind_groups = group_chunks_by_indicator(filtered)
            chart_ind  = list(ind_groups.keys())[0] if ind_groups else None
            if chart_ind:
                col_c1, col_c2 = st.columns(2)
                with col_c1:
                    fig_ts = build_timeseries_chart(ind_groups[chart_ind][:12], title=chart_ind)
                    if fig_ts:
                        st.plotly_chart(fig_ts, use_container_width=True, key="de_ts")
                with col_c2:
                    fig_bar = build_bar_comparison_chart(ind_groups[chart_ind][:20], year=2023)
                    if not fig_bar:
                        fig_bar = build_bar_comparison_chart(ind_groups[chart_ind][:20], year=2022)
                    if fig_bar:
                        st.plotly_chart(fig_bar, use_container_width=True, key="de_bar")

        st.markdown("---")
        for chunk in filtered[:30]:
            with st.expander(f"**{chunk.get('title','?')[:65]}** | {chunk.get('country','')} | {chunk.get('source','')}"):
                cc1, cc2 = st.columns([1, 2])
                cc1.markdown(
                    f"**Indicator:** {chunk.get('indicator','—')}\n\n"
                    f"**Country:**   {chunk.get('country','—')}\n\n"
                    f"**Source:**    {chunk.get('source','—')}\n\n"
                    f"**Date:**      {chunk.get('publication_date','—')}"
                )
                cc2.text(chunk.get("content","")[:600])


# ══════════════════════════════════════════════════════════════════════════════
# TAB 6 — GRAPH EXPLORER
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[6]:
    st.header("🕸️ Knowledge Graph Explorer")
    st.caption("Visualise the economic knowledge graph and explore entity relationships.")

    if g_nodes == 0:
        st.info("No graph data yet.")
    else:
        col_gs1, col_gs2, col_gs3, col_gs4 = st.columns(4)
        col_gs1.metric("Nodes",   g_nodes)
        col_gs2.metric("Edges",   g_edges)
        col_gs3.metric("Avg Degree", f"{(2 * g_edges / max(g_nodes, 1)):.1f}")
        col_gs4.metric("Store", "NetworkX")

        col_s1, col_s2 = st.columns([2, 1])
        search_term = col_s1.text_input("Search nodes", placeholder="e.g. United States, Inflation")
        max_nodes   = col_s2.slider("Max nodes", 10, 80, 40, 5)

        display_results = []
        if search_term:
            matching = nx_graph.search_nodes(search_term, limit=5)
            seed_nodes = list({r.get("subject","") for r in matching} | {r.get("object","") for r in matching})
            for sn in seed_nodes[:3]:
                display_results.extend(nx_graph.get_neighbors(sn, limit=15))
            display_results = matching + display_results
        else:
            try:
                G = nx_graph._graph
                top_nodes = sorted(G.nodes(), key=lambda n: G.degree(n), reverse=True)[:max_nodes // 2]
                for n in top_nodes:
                    for _, neighbor, data in list(G.out_edges(n, data=True))[:3]:
                        display_results.append({"subject": n, "relationship": data.get("type","RELATED_TO"), "object": neighbor})
            except Exception:
                pass

        if display_results and _VIZ_OK:
            sg  = get_graph_subgraph_for_query(search_term, display_results[:max_nodes])
            fig = build_graph_network_chart(sg, query=search_term or "Full Knowledge Graph")
            if fig:
                st.plotly_chart(fig, use_container_width=True, key="ge_net")

        st.divider()
        col_t1, col_t2 = st.columns(2)
        with col_t1:
            st.subheader("🔵 Top Nodes by Degree")
            try:
                G = nx_graph._graph
                top_nodes = sorted(G.nodes(), key=lambda n: G.degree(n), reverse=True)[:25]
                node_data = [{"Node": n, "Type": G.nodes[n].get("label","?"), "Degree": G.degree(n)} for n in top_nodes]
                st.dataframe(pd.DataFrame(node_data), use_container_width=True, hide_index=True)
            except Exception as e:
                st.caption(f"Error: {e}")
        with col_t2:
            st.subheader("🔗 Edge Sample")
            try:
                G = nx_graph._graph
                edges = [{"Subject": u, "Relationship": d.get("type","?"), "Object": v}
                         for u, v, d in list(G.edges(data=True))[:30]]
                st.dataframe(pd.DataFrame(edges), use_container_width=True, hide_index=True)
            except Exception as e:
                st.caption(f"Error: {e}")

        if _VIZ_OK and vs_size > 0:
            st.divider()
            st.subheader("📊 Cross-Country Indicator Charts")
            tidy_df     = _get_tidy_df()
            ind_opts    = sorted(tidy_df["indicator"].unique()) if not tidy_df.empty else []
            if ind_opts:
                sel_ge_ind  = st.selectbox("Select indicator", ind_opts, key="ge_ind")
                ind_chunks  = [c for c in _get_all_chunks() if c.get("indicator","") == sel_ge_ind]
                col_gc1, col_gc2 = st.columns(2)
                with col_gc1:
                    fig_ts2 = build_timeseries_chart(ind_chunks[:18], title=f"{sel_ge_ind} — All Countries")
                    if fig_ts2:
                        st.plotly_chart(fig_ts2, use_container_width=True, key="ge_ts2")
                with col_gc2:
                    fig_bar3 = build_bar_comparison_chart(ind_chunks[:18], year=2023)
                    if not fig_bar3:
                        fig_bar3 = build_bar_comparison_chart(ind_chunks[:18], year=2022)
                    if fig_bar3:
                        st.plotly_chart(fig_bar3, use_container_width=True, key="ge_bar3")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 7 — ABOUT
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[7]:
    st.header("ℹ️ About This System")
    st.markdown("""
## Agentic Hybrid GraphRAG for Macroeconomic Intelligence

A production-grade hybrid Retrieval-Augmented Generation (RAG) system combining semantic vector search, knowledge graph traversal, and structured mathematical modeling to provide institutional-grade macroeconomic intelligence.

---

### 🥉 Medallion Data Architecture

The data pipeline processes unstructured and semi-structured macroeconomic data through a tiered **Medallion Architecture** to ensure clean, structured, and query-optimized data stores:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           BRONZE LAYER (Raw)                            │
 │  • World Bank API   • FRED API   • ECB API   • IMF WEO   • PDF Reports  │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                          SILVER LAYER (Enriched)                        │
 │  • Name Standardization  • Value Scaling  • Metadata Tagging            │
 │  • NLP Entity Extraction (spaCy)          • Document Overlap Chunking   │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           GOLD LAYER (Storage)                          │
 │  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐  │
 │  │      Vector Store     │ │    Knowledge Graph    │ │  Tidy Cache   │  │
 │  │  • ChromaDB           │ │  • Neo4j              │ │  • Pandas     │  │
 │  │  • SimpleVectorStore  │ │  • NetworkX (Fallback)│ │  • CSV Export │  │
 │  └───────────────────────┘ └───────────────────────┘ └───────────────┘  │
 └─────────────────────────────────────────────────────────────────────────┘
```

#### 1. Bronze Layer (Raw Ingestion)
- Fetches raw JSON data streams from public statistical APIs (World Bank, IMF, ECB, FRED, OECD) and loads unstructured PDF documents.
- Restores historical files locally under `data/` directories.

#### 2. Silver Layer (Processing & Enrichment)
- **Data Standardization**: Harmonizes country names (e.g. converting variations into standardized G20 names) and maps them to ISO3 codes.
- **NLP & Entity Resolution**: Runs a pipeline using `spaCy` to extract geographic nodes, institutions, timeframes, and indicators.
- **Chunking & Tokenization**: Splices documents into overlapping text fragments (800 token chunk size, 150 token overlap) carrying detailed metadata payloads.

#### 3. Gold Layer (Specialized Storage & Query Engines)
Our system separates state and queries into three storage engines, each optimized for a distinct access pattern:
*   **Semantic Vector Index (ChromaDB)**: Stores high-dimensional dense embeddings (`BAAI/bge-small-en-v1.5`) of the text chunks. It handles semantic similarity searches and retrieves qualitative contextual paragraphs.
*   **Structured Knowledge Graph (Neo4j / NetworkX)**: Stores parsed entities as nodes and associations (e.g., `(USA)-[HAS_INDICATOR]->(GDP_Growth)`) as edges. It is optimized for multi-hop relationship traversal and topological analysis.
*   **Tabular Analytical Cache (Pandas)**: Combines structured metrics into a unified tidy database. It powers quick regressions, Pearson correlations, 5-year linear forecasts, and Recession Risk scoring models.

---

### 🤖 Agentic Orchestration System

The query pipeline is driven by an agentic workflow configured via **LangGraph**, routing queries dynamically based on their complexity:

```
                              User Query
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  Planner Agent   │ ◄── Classifies Query Type &
                        └─────────┬────────┘     Retrieval Strategy
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
           ┌──────────────────┐    ┌──────────────────┐
           │   Vector Agent   │    │   Graph Agent    │
           │  (Chroma Search)  │    │  (Graph Search)  │
           └─────────┬────────┘    └─────────┬────────┘
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                        ┌──────────────────┐
                        │   Answer Agent   │ ◄── Synthesizes contextual
                        └─────────┬────────┘     responses with sources
                                 │
                                 ▼
                     Formulated Answer & Plots
```

1. **Planner Agent**: Classifies user prompts (e.g., Comparative Query vs. Research Query) and selects the best retrieval strategy (Vector, Graph, or Hybrid).
2. **Vector Agent**: Conducts semantic and keyword search against the Gold vector database.
3. **Graph Agent**: Queries the local NetworkX or remote Neo4j graph store to retrieve structural paths and neighbor relationships.
4. **Answer Agent**: Synthesizes retrieved textual context, graph linkages, and historical time-series statistics into an annotated LLM response with Plotly visualization widgets.

---

### 📡 Data Sources

| Source | Coverage | Indicators | Storage Format |
| :--- | :--- | :--- | :--- |
| **World Bank API** | G20 Countries (2000–2023) | GDP, Inflation, Unemployment, Trade, Exchange Rate | Vector + Graph + Pandas |
| **OECD / World Bank** | G7 Countries | GDP Annual Growth Rate | Vector + Graph + Pandas |
| **FRED** | United States Macro Series | CPI, Fed Funds Rate, M2, Treasury yields | Vector + Graph + Pandas |
| **IMF WEO DataMapper** | G20 Countries (2000–2031) | Real GDP Growth, General Govt Debt, Forecasts | Vector + Graph + Pandas |
| **ECB Data Portal** | Eurozone Series | ECB policy rates, USD exchange rates, HICP Inflation | Vector + Graph + Pandas |
| **World Bank Extended** | G20 Countries (2000–2023) | FDI inflows, population, CO2, R&D, Gross Capital | Vector + Graph + Pandas |
| **PDF Reports** | Local documents in `data/pdfs/` | Custom documents | Vector + Graph |

---

### 🛠️ Technology Stack

| Layer | Component | Implementation |
| :--- | :--- | :--- |
| **Orchestration** | Agentic Pipeline | LangGraph |
| **Inference** | Large Language Models | Gemini 2.5 Flash |
| **Vector Storage** | Semantic Index | ChromaDB (Fallback: SimpleVectorStore) |
| **Graph Storage** | Relational Network | Neo4j (Fallback: NetworkX) |
| **Natural Language** | NLP & Extraction | spaCy (`en_core_web_sm`) |
| **Data Processing** | Ingestion & Cleaning | Pandas, NumPy, Requests |
| **Visualizations** | Interactive Plots | Plotly (Scatter, Maps, Radars, Networks) |
| **Frontend UI** | Web Dashboard | Streamlit |

---

### 💡 Core Features

- **💬 Chat Interface**: Multi-agent Hybrid RAG with step-by-step reasoning logs, source listings, and dynamic follow-up suggestions.
- **🌍 Global Dashboard**: Interactive global choropleth map, country rankings, indicator heatmaps, and automatically generated Smart Insights.
- **🔬 Country Profile**: Deep dive radar profile comparison, indicators statistics, and auto-regressive 5-year linear projection models.
- **📊 Correlations**: Phillips Curve, Okun's Law, custom scatter plots, and Pearson correlation matrices for indicator pairs.
- **🚦 Recession Risk**: Combined country risk gauges, risk matrix dashboard, and visual risk indicators.
- **📝 Economic Report**: Standardized, downloadable PDF-style economic briefing reports generated by the LLM.
- **🕸️ Graph Explorer**: Live visualization of the underlying NetworkX/Neo4j knowledge graph structure.
""")
    col_a1, col_a2, col_a3, col_a4 = st.columns(4)
    col_a1.metric("Vector Chunks",  vs_size)
    col_a2.metric("Graph Nodes",    g_nodes)
    col_a3.metric("Graph Edges",    g_edges)
    col_a4.metric("Data Sources",   6)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 8 — RECESSION RISK MONITOR
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[8]:
    st.header("🚦 Recession Risk Monitor")
    st.caption("Composite recession risk scores for G20 countries — updated from ingested data")

    if not is_ready or not _VIZ_OK:
        st.info("👈 Ingest data first to compute recession risk scores.")
    else:
        tidy_df = _get_tidy_df()
        if tidy_df.empty:
            st.warning("No structured data available.")
        else:
            with st.spinner("Computing recession risk scores…"):
                all_risks = compute_all_risks(tidy_df)

            if not all_risks:
                st.warning("Could not compute risk scores — check that GDP growth and inflation data are ingested.")
            else:
                # ── Summary header KPIs ───────────────────────────────────────
                high_risk   = [r for r in all_risks if r["level"] == "High"]
                mod_risk    = [r for r in all_risks if r["level"] == "Moderate"]
                low_risk    = [r for r in all_risks if r["level"] == "Low"]

                rk1, rk2, rk3, rk4 = st.columns(4)
                rk1.metric("🔴 High Risk",     len(high_risk))
                rk2.metric("🟡 Moderate Risk", len(mod_risk))
                rk3.metric("🟢 Low Risk",      len(low_risk))
                avg_score = sum(r["score"] for r in all_risks) / len(all_risks)
                rk4.metric("📊 Avg Score", f"{avg_score:.1f} / 17")

                st.divider()

                # ── Traffic-light summary table ───────────────────────────────
                st.subheader("🌍 G20 Country Risk Overview")
                risk_rows = []
                for r in all_risks:
                    css_class = {
                        "High":     "risk-card-red",
                        "Moderate": "risk-card-yellow",
                        "Low":      "risk-card-green",
                    }.get(r["level"], "kpi-card")

                    comps  = r["components"]
                    gdp_s  = comps["GDP Growth"]["score"]
                    inf_s  = comps["Inflation"]["score"]
                    une_s  = comps["Unemployment Trend"]["score"]
                    dbt_s  = comps["Government Debt"]["score"]
                    ca_s   = comps["Current Account"]["score"]

                    risk_rows.append({
                        "Country":         r["country"],
                        "Risk Level":      f"{r['emoji']} {r['level']}",
                        "Score (0-17)":    r["score"],
                        "GDP Growth":      f"{'🟥'*gdp_s}{'⬜'*(4-gdp_s)}",
                        "Inflation":       f"{'🟥'*inf_s}{'⬜'*(4-inf_s)}",
                        "Unemployment":    f"{'🟥'*une_s}{'⬜'*(3-une_s)}",
                        "Govt Debt":       f"{'🟥'*dbt_s}{'⬜'*(3-dbt_s)}",
                        "Current Account": f"{'🟥'*ca_s}{'⬜'*(3-ca_s)}",
                    })

                df_risk = pd.DataFrame(risk_rows)
                st.dataframe(df_risk, use_container_width=True, hide_index=True)

                # ── Risk bar chart ────────────────────────────────────────────
                st.divider()
                col_bar, col_detail = st.columns([2, 3])
                with col_bar:
                    st.subheader("📊 Risk Score Distribution")
                    if _VIZ_OK:
                        import plotly.graph_objects as go
                        colors_risk = [r["color"] for r in all_risks]
                        fig_risk_bar = go.Figure(go.Bar(
                            x=[r["score"] for r in all_risks],
                            y=[r["country"] for r in all_risks],
                            orientation="h",
                            marker_color=colors_risk,
                            text=[f'{r["emoji"]} {r["score"]}' for r in all_risks],
                            textposition="outside",
                            hovertemplate="<b>%{y}</b><br>Score: %{x}/17<extra></extra>",
                        ))
                        fig_risk_bar.add_vline(x=4, line_dash="dot", line_color="#1a9641",
                                               annotation_text="Low→Mod", annotation_font_size=10)
                        fig_risk_bar.add_vline(x=8, line_dash="dot", line_color="#d7191c",
                                               annotation_text="Mod→High", annotation_font_size=10)
                        fig_risk_bar.update_layout(
                            xaxis=dict(range=[0, 18], title="Composite Risk Score"),
                            yaxis=dict(autorange="reversed"),
                            height=max(300, len(all_risks) * 26),
                            margin=dict(l=120, r=60, t=30, b=40),
                            template="plotly_white",
                        )
                        st.plotly_chart(fig_risk_bar, use_container_width=True, key="rr_bar")

                with col_detail:
                    st.subheader("🔍 Country Deep Dive")
                    risk_countries = [r["country"] for r in all_risks]
                    sel_risk_country = st.selectbox("Select country", risk_countries, key="rr_sel")
                    cr = next((r for r in all_risks if r["country"] == sel_risk_country), None)
                    if cr:
                        # Gauge + radar side by side
                        gc1, gc2 = st.columns(2)
                        with gc1:
                            fig_g = build_risk_gauge_fig(cr)
                            if fig_g:
                                st.plotly_chart(fig_g, use_container_width=True, key="rr_gauge")
                        with gc2:
                            fig_rad = build_risk_radar_fig(cr)
                            if fig_rad:
                                st.plotly_chart(fig_rad, use_container_width=True, key="rr_radar")

                        # Component breakdown
                        st.markdown(f"**{cr['emoji']} Summary:** {cr['summary']}")
                        st.markdown("**Risk Component Breakdown:**")
                        for comp_name, comp_data in cr["components"].items():
                            score    = comp_data["score"]
                            weight   = comp_data["weight"]
                            note     = comp_data["note"]
                            bar_filled = "🟥" * score + "⬜" * (weight - score)
                            st.markdown(
                                f"&nbsp;&nbsp;• **{comp_name}** [{bar_filled}] {score}/{weight} — _{note}_"
                            )


# ══════════════════════════════════════════════════════════════════════════════
# TAB 9 — ECONOMIC REPORT GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[9]:
    st.header("📝 Economic Report Generator")
    st.caption("Generate a comprehensive downloadable economic intelligence report for any country")

    if not is_ready or not _VIZ_OK:
        st.info("👈 Ingest data first to generate reports.")
    else:
        tidy_df = _get_tidy_df()
        if tidy_df.empty:
            st.warning("No structured data available.")
        else:
            all_countries = sorted(tidy_df["country"].unique())

            col_rg1, col_rg2, col_rg3 = st.columns([3, 2, 1])
            report_country = col_rg1.selectbox(
                "Select country", all_countries, key="rg_country"
            )
            report_year    = col_rg2.number_input(
                "Reference year", 2015, 2024, 2023, key="rg_year"
            )
            include_llm = col_rg3.checkbox("Use LLM", value=False, key="rg_llm",
                                            help="Enhance narrative with LLM (requires API key)")

            if st.button("🚀 Generate Economic Report", type="primary", use_container_width=False):
                with st.spinner(f"Building report for {report_country}…"):
                    report = build_country_report(tidy_df, report_country)

                st.session_state["current_report"] = report

            report = st.session_state.get("current_report")
            if report and report.get("country") == report_country:
                st.divider()

                # ── Report header ─────────────────────────────────────────────
                st.subheader(f"📊 {report['title']}")
                st.caption(f"*Generated: {report['generated']} · Data sources: IMF WEO, World Bank, ECB*")

                # ── Quick KPI row ─────────────────────────────────────────────
                metrics = report.get("metrics", [])
                kpi_inds = {"Real GDP Growth", "GDP Growth Rate", "GDP per Capita",
                             "Inflation (CPI, avg)", "Inflation (CPI)", "Unemployment Rate"}
                kpi_metrics = [m for m in metrics if m["label"] in kpi_inds][:5]
                if kpi_metrics:
                    kcols = st.columns(len(kpi_metrics))
                    for ki, km in enumerate(kpi_metrics):
                        kcols[ki].metric(
                            km["label"],
                            km["fmt"],
                            delta=km["trend"].replace("→ Stable","").replace("↗ Rising","↗").replace("↘ Falling","↘"),
                        )

                st.divider()

                # ── Full report markdown ──────────────────────────────────────
                col_report, col_chart = st.columns([3, 2])

                with col_report:
                    st.markdown("#### 📄 Full Report")
                    report_md = report.get("markdown", "")
                    st.markdown(report_md)

                with col_chart:
                    st.markdown("#### 📊 Key Metrics Timeline")
                    # Show time-series for GDP growth
                    gdp_ind = next(
                        (m for m in metrics if "Growth" in m["label"] and "GDP" in m["label"]),
                        None,
                    )
                    if gdp_ind is not None:
                        series_df = gdp_ind["series"]
                        if not series_df.empty:
                            import plotly.graph_objects as go
                            fig_rpt = go.Figure()
                            fig_rpt.add_trace(go.Scatter(
                                x=series_df["year"], y=series_df["value"],
                                mode="lines+markers",
                                line=dict(color="#2c7bb6", width=2),
                                fill="tozeroy",
                                fillcolor="rgba(44,123,182,0.1)",
                                name=gdp_ind["label"],
                                hovertemplate="Year: %{x}<br>%{y:.2f}%<extra></extra>",
                            ))
                            fig_rpt.add_hline(y=0, line_dash="dot", line_color="#d7191c", line_width=1)
                            fig_rpt = add_events_overlay(fig_rpt,
                                                          int(series_df["year"].min()),
                                                          int(series_df["year"].max()))
                            fig_rpt.update_layout(
                                title=f"{gdp_ind['label']} — {report_country}",
                                xaxis_title="Year",
                                yaxis_title="%",
                                height=280,
                                margin=dict(l=50, r=20, t=55, b=40),
                                template="plotly_white",
                            )
                            st.plotly_chart(fig_rpt, use_container_width=True, key="rpt_gdp")

                    # All indicators mini-table
                    if metrics:
                        st.markdown("#### 📋 All Available Data")
                        tbl = pd.DataFrame([
                            {"Indicator": m["label"], "Value": m["fmt"],
                             "Year": m["year"], "Trend": m["trend"]}
                            for m in metrics
                        ])
                        st.dataframe(tbl, use_container_width=True, hide_index=True)

                # ── Download buttons ──────────────────────────────────────────
                st.divider()
                dcol1, dcol2 = st.columns(2)
                report_md = report.get("markdown", "")
                dcol1.download_button(
                    "⬇️ Download Report (.md)",
                    report_md,
                    file_name=f"economic_report_{report_country.replace(' ','_').lower()}.md",
                    mime="text/markdown",
                    use_container_width=True,
                )
                dcol2.download_button(
                    "⬇️ Download Report (.txt)",
                    plain,
                    file_name=f"economic_report_{report_country.replace(' ','_').lower()}.txt",
                    mime="text/plain",
                    use_container_width=True,
                )


# ══════════════════════════════════════════════════════════════════════════════
# TAB 10 — POLICY SIMULATION SANDBOX
# ══════════════════════════════════════════════════════════════════════════════
with PAGE_TABS[10]:
    st.header("🎛️ Macroeconomic Policy Simulation Sandbox")
    st.caption("Apply hypothetical policy shocks and observe the forecast deviations and risk changes.")

    if not is_ready or not _VIZ_OK:
        st.info("👈 Ingest data first to run simulation sandbox.")
    else:
        tidy_df = _get_tidy_df()
        if tidy_df.empty:
            st.warning("No structured data available.")
        else:
            all_countries = sorted(tidy_df["country"].unique())

            # Setup session state default values for the sliders
            if "sandbox_ir" not in st.session_state:
                st.session_state.sandbox_ir = 0.0
            if "sandbox_gdp" not in st.session_state:
                st.session_state.sandbox_gdp = 0.0
            if "sandbox_debt" not in st.session_state:
                st.session_state.sandbox_debt = 0.0
            if "sandbox_lag" not in st.session_state:
                st.session_state.sandbox_lag = 1

            # Callback functions for Quick Scenarios to update state BEFORE widgets are drawn
            def trigger_crunch():
                st.session_state.sandbox_ir = -300.0
                st.session_state.sandbox_gdp = -4.0
                st.session_state.sandbox_debt = 15.0
                st.session_state.sandbox_lag = 1

            def trigger_oil():
                st.session_state.sandbox_ir = 250.0
                st.session_state.sandbox_gdp = -3.0
                st.session_state.sandbox_debt = 5.0
                st.session_state.sandbox_lag = 1

            def trigger_stimulus():
                st.session_state.sandbox_ir = -400.0
                st.session_state.sandbox_gdp = 3.0
                st.session_state.sandbox_debt = 12.0
                st.session_state.sandbox_lag = 0

            def trigger_crisis():
                st.session_state.sandbox_ir = 350.0
                st.session_state.sandbox_gdp = -2.5
                st.session_state.sandbox_debt = 20.0
                st.session_state.sandbox_lag = 1

            def trigger_reset():
                st.session_state.sandbox_ir = 0.0
                st.session_state.sandbox_gdp = 0.0
                st.session_state.sandbox_debt = 0.0
                st.session_state.sandbox_lag = 1

            # 1. Controls
            col_ctrl1, col_ctrl2 = st.columns([1, 1])

            with col_ctrl1:
                st.subheader("⚙️ Simulation Settings")

                sel_country = st.selectbox("Target Country", all_countries, key="sandbox_country_sel")

                # Sliders using st.slider but pointing to session state values
                ir_shock = st.slider(
                    "Interest Rates Shock (bps)", 
                    -500.0, 500.0, 
                    step=50.0, 
                    key="sandbox_ir",
                    help="Adjustment to central bank policy rate in basis points (100 bps = 1.0%)."
                )
                gdp_shock = st.slider(
                    "GDP growth Shock (%)", 
                    -5.0, 5.0, 
                    step=0.5, 
                    key="sandbox_gdp",
                    help="Direct annual percentage growth rate adjustment."
                )
                debt_shock = st.slider(
                    "Government Debt Shock (% of GDP)", 
                    -20.0, 20.0, 
                    step=1.0, 
                    key="sandbox_debt",
                    help="Direct percentage points of GDP adjustment to national debt."
                )
                lag_years = st.slider(
                    "Correlation Lag (Years)",
                    0, 3,
                    step=1,
                    key="sandbox_lag",
                    help="Number of years before secondary economic effects manifest."
                )

            with col_ctrl2:
                st.subheader("⚡ Quick Scenarios")
                st.markdown("Select a predefined scenario to instantly configure the sliders:")

                sc_col1, sc_col2 = st.columns(2)

                sc_col1.button("📉 2008 Credit Crunch", key="sandbox_btn_crunch", on_click=trigger_crunch, use_container_width=True)
                sc_col2.button("🛢️ Supply Chain Shock (Oil Spike)", key="sandbox_btn_oil", on_click=trigger_oil, use_container_width=True)
                sc_col1.button("💸 Post-Pandemic Stimulus", key="sandbox_btn_stim", on_click=trigger_stimulus, use_container_width=True)
                sc_col2.button("🏦 Sovereign Debt Crisis", key="sandbox_btn_crisis", on_click=trigger_crisis, use_container_width=True)
                st.button("🔄 Reset Sandbox", key="sandbox_btn_reset", on_click=trigger_reset, use_container_width=True)

                st.markdown("""
                > **Sandbox Mechanisms:**
                > - **Interest Rate Shock**: Adjusts baseline rate directly. Also lowers GDP growth ($-0.25 \\times \\text{shock}$) and Inflation ($-0.15 \\times \\text{shock}$) after the specified lag.
                > - **GDP Shock**: Adjusts baseline real growth. Also increases Inflation ($+0.20 \\times \\text{shock}$) and Interest Rates ($+0.10 \\times \\text{shock}$) after the lag.
                > - **Govt Debt Shock**: Adjusts gross debt ratio. Also raises Interest Rates ($+0.15 \\times \\text{shock}$) and lowers GDP growth ($-0.10 \\times \\text{shock}$) after the lag.
                """)

            st.divider()

            # Apply calculations
            ir_val = ir_shock / 100.0

            shocked_df = tidy_df.copy()
            if ir_shock != 0.0:
                shocked_df = simulate_policy_shock(shocked_df, sel_country, "Interest Rates", ir_val, lag_years)
            if gdp_shock != 0.0:
                shocked_df = simulate_policy_shock(shocked_df, sel_country, "GDP Growth", gdp_shock, lag_years)
            if debt_shock != 0.0:
                shocked_df = simulate_policy_shock(shocked_df, sel_country, "Government Debt", debt_shock, lag_years)

            # Recession Risk comparison
            risk_base = compute_country_risk(tidy_df, sel_country)
            risk_shocked = compute_country_risk(shocked_df, sel_country)

            st.subheader("🚦 Recession Risk Gauge — Before vs. After")
            col_g1, col_g2 = st.columns(2)
            with col_g1:
                st.markdown("<h4 style='text-align: center; color: #2c7bb6;'>Baseline Forecast Risk</h4>", unsafe_allow_html=True)
                fig_base = build_risk_gauge_fig(risk_base)
                if fig_base:
                    st.plotly_chart(fig_base, use_container_width=True, key="sandbox_gauge_base")
            with col_g2:
                st.markdown("<h4 style='text-align: center; color: #d7191c;'>Simulated Shock Risk</h4>", unsafe_allow_html=True)
                fig_shocked = build_risk_gauge_fig(risk_shocked)
                if fig_shocked:
                    st.plotly_chart(fig_shocked, use_container_width=True, key="sandbox_gauge_shocked")

            # Details of risk score changes
            st.markdown(f"**Risk Summary Change:**")
            st.write(f"- **Baseline Score**: `{risk_base['score']}/17` ({risk_base['level']} Risk) | {risk_base['summary']}")
            st.write(f"- **Simulated Score**: `{risk_shocked['score']}/17` ({risk_shocked['level']} Risk) | {risk_shocked['summary']}")

            st.divider()

            # Comparison plots
            st.subheader("📈 Forecast Trajectories Comparison")

            # Helper to build comparison charts
            def build_sandbox_comparison_chart(df_b, df_s, country, indicator):
                import plotly.graph_objects as go

                # Helper to map standard name to actual
                country_indicators = df_b[df_b["country"] == country]["indicator"].unique()
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
                    return candidates[0]

                target_ind = get_actual_indicator(indicator)
                base_data = df_b[(df_b["country"] == country) & (df_b["indicator"] == target_ind)].sort_values("year")
                shock_data = df_s[(df_s["country"] == country) & (df_s["indicator"] == target_ind)].sort_values("year")

                if base_data.empty:
                    return None

                unit = INDICATOR_UNITS.get(target_ind, "%")
                short = INDICATOR_SHORT.get(target_ind, target_ind)

                fig = go.Figure()

                # History (pre-2024)
                hist_df = base_data[base_data["year"] < 2024]
                if not hist_df.empty:
                    fig.add_trace(go.Scatter(
                        x=hist_df["year"],
                        y=hist_df["value"],
                        mode="lines+markers",
                        name="Historical Data",
                        line=dict(color="#555555", width=2),
                        marker=dict(size=4),
                        hovertemplate="Year: %{x}<br>Actual: %{y:.2f} " + unit + "<extra></extra>"
                    ))

                # Baseline forecast (2023 onwards)
                base_fc = base_data[base_data["year"] >= 2023]
                if not base_fc.empty:
                    fig.add_trace(go.Scatter(
                        x=base_fc["year"],
                        y=base_fc["value"],
                        mode="lines+markers",
                        name="Baseline Forecast",
                        line=dict(color="#2c7bb6", width=2.5),
                        marker=dict(size=5),
                        hovertemplate="Year: %{x}<br>Baseline: %{y:.2f} " + unit + "<extra></extra>"
                    ))

                # Shocked forecast (2023 onwards)
                shock_fc = shock_data[shock_data["year"] >= 2023]
                if not shock_fc.empty:
                    fig.add_trace(go.Scatter(
                        x=shock_fc["year"],
                        y=shock_fc["value"],
                        mode="lines+markers",
                        name="Simulated Shock",
                        line=dict(color="#d7191c", width=2.5, dash="dash"),
                        marker=dict(size=5, symbol="diamond"),
                        hovertemplate="Year: %{x}<br>Simulated: %{y:.2f} " + unit + "<extra></extra>"
                    ))

                fig.add_vline(x=2024, line_dash="dot", line_color="#888888", annotation_text="Shock Starts (2024)")
                fig.update_layout(
                    title=f"{short} Comparison",
                    xaxis_title="Year",
                    yaxis_title=f"{short} ({unit})" if unit else short,
                    template="plotly_white",
                    height=300,
                    margin=dict(l=40, r=20, t=40, b=40),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                )
                return fig

            # Show GDP and Inflation side by side, and Interest Rates and Debt below
            col_p1, col_p2 = st.columns(2)
            with col_p1:
                fig_gdp = build_sandbox_comparison_chart(tidy_df, shocked_df, sel_country, "GDP Growth")
                if fig_gdp:
                    st.plotly_chart(fig_gdp, use_container_width=True, key="sandbox_plot_gdp")
            with col_p2:
                fig_inf = build_sandbox_comparison_chart(tidy_df, shocked_df, sel_country, "Inflation")
                if fig_inf:
                    st.plotly_chart(fig_inf, use_container_width=True, key="sandbox_plot_inf")

            col_p3, col_p4 = st.columns(2)
            with col_p3:
                fig_ir = build_sandbox_comparison_chart(tidy_df, shocked_df, sel_country, "Interest Rates")
                if fig_ir:
                    st.plotly_chart(fig_ir, use_container_width=True, key="sandbox_plot_ir")
            with col_p4:
                fig_debt = build_sandbox_comparison_chart(tidy_df, shocked_df, sel_country, "Government Debt")
                if fig_debt:
                    st.plotly_chart(fig_debt, use_container_width=True, key="sandbox_plot_debt")

            st.divider()

            # Agent analysis section
            st.subheader("🤖 Historical Policy Critique Agent")
            st.caption("Ask the agent to critique your custom simulation by looking up historical central bank cycles.")

            if st.button("🚀 Analyze Simulation with Agent", key="sandbox_btn_analyze", type="primary"):
                def get_actual_indicator(std_name: str) -> str:
                    country_indicators = tidy_df[tidy_df["country"] == sel_country]["indicator"].unique()
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
                    return candidates[0]

                target_ind = get_actual_indicator("GDP Growth")
                base_series = tidy_df[(tidy_df["country"] == sel_country) & (tidy_df["indicator"] == target_ind) & (tidy_df["year"] >= 2024)].sort_values("year")
                shock_series = shocked_df[(shocked_df["country"] == sel_country) & (shocked_df["indicator"] == target_ind) & (shocked_df["year"] >= 2024)].sort_values("year")

                baseline_records = base_series[["year", "value"]].to_dict("records")
                shocked_records = shock_series[["year", "value"]].to_dict("records")

                sim_payload = {
                    "country": sel_country,
                    "shocked_indicator": "Interest Rates" if ir_shock != 0.0 else ("GDP Growth" if gdp_shock != 0.0 else "Government Debt"),
                    "shock_value": f"{ir_shock:+.0f} bps" if ir_shock != 0.0 else (f"{gdp_shock:+.1f}%" if gdp_shock != 0.0 else f"{debt_shock:+.1f}% of GDP"),
                    "baseline_risk": float(risk_base["score"]),
                    "baseline_level": risk_base["level"],
                    "shocked_risk": float(risk_shocked["score"]),
                    "shocked_level": risk_shocked["level"],
                    "baseline_forecast": baseline_records[:5],
                    "shocked_forecast": shocked_records[:5]
                }

                retrieval_query = f"Effects of policy shocks, interest rate tightening, debt spikes, and historical economic crises in {sel_country}"

                with st.spinner("Retrieving historical case studies and running agent synthesis..."):
                    wf = _get_workflow()
                    plan = wf.planner.plan(retrieval_query)
                    plan["retrieval_strategy"] = "hybrid"

                    vector_results = wf.vector_agent.retrieve({"query": retrieval_query, "plan": plan}).get("vector_results", [])
                    graph_results  = wf.graph_agent.retrieve({"query": retrieval_query, "plan": plan}).get("graph_results",  [])

                    ctx = {
                        "vector_results": vector_results,
                        "graph_results": graph_results,
                        "simulation_data": sim_payload
                    }

                    prompt = (
                        f"Critique the macroeconomic simulation for {sel_country}. "
                        f"The user shocked {sim_payload['shocked_indicator']} by {sim_payload['shock_value']}. "
                        f"This changed the Recession Risk score from {sim_payload['baseline_risk']:.1f}/17 to {sim_payload['shocked_risk']:.1f}/17. "
                        f"Compare the mathematical outcomes against matching historical policy cycles or structural crises in G20 economies (e.g. Volcker shock, debt crises, demand shocks)."
                    )

                    answer_data = wf.answer_agent.generate_answer(prompt, ctx)

                st.session_state["sandbox_critique"] = answer_data
                st.rerun()

            critique = st.session_state.get("sandbox_critique")
            if critique:
                st.divider()
                st.markdown("### 📄 Agent Critique Analysis")
                st.markdown(critique.get("answer", "No analysis generated."))

                sources = critique.get("sources", [])
                if sources:
                    st.markdown("---")
                    st.write("**Grounded Sources:**")
                    for s in sources:
                        st.markdown(f'<span class="source-tag">{s}</span>', unsafe_allow_html=True)

                st.markdown("---")
                _render_answer_tabs(critique, key_suffix="sandbox")

