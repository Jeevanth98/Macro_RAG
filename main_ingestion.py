# main_ingestion.py
"""
Full data ingestion pipeline:
  1. Load data from World Bank, FRED, OECD, IMF WEO, ECB, World Bank Extended
  2. Chunk documents
  3. Embed & store in vector store
  4. Extract entities & build knowledge graph (NetworkX + Neo4j if available)
"""
import sys
from pathlib import Path

from economic_graphrag.config import settings
from economic_graphrag.ingestion.worldbank_loader   import load_worldbank_data
from economic_graphrag.ingestion.fred_loader        import load_fred_data
from economic_graphrag.ingestion.oecd_loader        import load_oecd_data
from economic_graphrag.ingestion.pdf_loader         import load_pdf
from economic_graphrag.ingestion.imf_loader         import load_imf_data
from economic_graphrag.ingestion.ecb_loader         import load_ecb_data
from economic_graphrag.ingestion.wb_extended_loader import load_wb_extended_data
from economic_graphrag.chunking.chunker             import chunk_documents
from economic_graphrag.vector_store.chroma_manager  import ChromaVectorStore
from economic_graphrag.graph.graph_builder          import GraphBuilder
from economic_graphrag.graph.networkx_graph         import nx_graph
from economic_graphrag.graph.neo4j_manager          import neo4j_manager


def run_ingestion_pipeline(
    use_worldbank:    bool = True,
    use_fred:         bool = True,
    use_oecd:         bool = True,
    use_pdfs:         bool = True,
    use_imf:          bool = True,
    use_ecb:          bool = True,
    use_wb_extended:  bool = True,
    clear_existing:   bool = False,
    progress_callback=None,
) -> dict:
    """
    Runs the full ingestion pipeline.

    Returns:
        dict with ingestion statistics
    """
    def log(step: str, detail: str = ""):
        print(f"[{step}] {detail}")
        if progress_callback:
            progress_callback(step, detail)

    stats = {
        "docs_loaded":      0,
        "chunks_created":   0,
        "vector_store_size": 0,
        "graph_nodes":      0,
        "graph_edges":      0,
        "sources":          [],
    }

    # Setup directories
    for d in [settings.PDF_DIR, settings.WORLDBANK_DIR, settings.FRED_DIR, settings.OECD_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    all_docs = []

    # ── World Bank core ───────────────────────────────────────────────────────
    if use_worldbank:
        log("LOAD", "Fetching World Bank core data (G20: GDP, Inflation, Trade…)")
        wb_docs = load_worldbank_data()
        all_docs.extend(wb_docs)
        log("LOAD", f"  → {len(wb_docs)} World Bank documents")
        if wb_docs:
            stats["sources"].append("World Bank API")

    # ── FRED (US Federal Reserve) ─────────────────────────────────────────────
    if use_fred:
        if settings.FRED_API_KEY:
            log("LOAD", "Fetching FRED data (US macro series)…")
            fred_docs = load_fred_data()
            all_docs.extend(fred_docs)
            log("LOAD", f"  → {len(fred_docs)} FRED documents")
            if fred_docs:
                stats["sources"].append("FRED API")
        else:
            log("LOAD", "Skipping FRED (FRED_API_KEY not set)")

    # ── OECD / World Bank GDP growth ──────────────────────────────────────────
    if use_oecd:
        log("LOAD", "Fetching OECD/World Bank GDP growth (G7)…")
        oecd_docs = load_oecd_data()
        all_docs.extend(oecd_docs)
        log("LOAD", f"  → {len(oecd_docs)} OECD documents")
        if oecd_docs:
            stats["sources"].append("OECD / World Bank")

    # ── IMF WEO DataMapper (no key) ───────────────────────────────────────────
    if use_imf:
        log("LOAD", "Fetching IMF WEO data (Govt Debt, Current Account, GDP Growth…)")
        imf_docs = load_imf_data()
        all_docs.extend(imf_docs)
        log("LOAD", f"  → {len(imf_docs)} IMF documents")
        if imf_docs:
            stats["sources"].append("IMF WEO DataMapper")

    # ── ECB Data Portal (no key) ──────────────────────────────────────────────
    if use_ecb:
        log("LOAD", "Fetching ECB data (Policy Rates, EUR/USD, HICP Inflation…)")
        ecb_docs = load_ecb_data()
        all_docs.extend(ecb_docs)
        log("LOAD", f"  → {len(ecb_docs)} ECB documents")
        if ecb_docs:
            stats["sources"].append("ECB Data Portal")

    # ── World Bank Extended (no key) ──────────────────────────────────────────
    if use_wb_extended:
        log("LOAD", "Fetching World Bank Extended (FDI, Population, CO2, Debt…)")
        wbe_docs = load_wb_extended_data()
        all_docs.extend(wbe_docs)
        log("LOAD", f"  → {len(wbe_docs)} WB Extended documents")
        if wbe_docs:
            stats["sources"].append("World Bank Extended")

    # ── PDFs ──────────────────────────────────────────────────────────────────
    if use_pdfs:
        pdf_files = list(settings.PDF_DIR.glob("*.pdf"))
        if pdf_files:
            log("LOAD", f"Loading {len(pdf_files)} PDF(s)…")
            for p in pdf_files:
                docs = load_pdf(p)
                all_docs.extend(docs)
                log("LOAD", f"  → {len(docs)} pages from {p.name}")
            stats["sources"].append("PDF files")
        else:
            log("LOAD", "No PDFs found in data/pdfs/; skipping")

    if not all_docs:
        log("WARN", "No documents loaded from any source. Check API connectivity.")
        return stats

    stats["docs_loaded"] = len(all_docs)
    log("LOAD", f"Total documents loaded: {len(all_docs)}")

    # ── Chunk ─────────────────────────────────────────────────────────────────
    log("CHUNK", f"Chunking {len(all_docs)} documents…")
    all_chunks = chunk_documents(all_docs)
    stats["chunks_created"] = len(all_chunks)
    log("CHUNK", f"Created {len(all_chunks)} chunks")

    if not all_chunks:
        log("WARN", "No chunks created. Exiting.")
        return stats

    # ── Vector store ──────────────────────────────────────────────────────────
    log("VECTOR", "Storing chunks in vector store…")
    vector_store = ChromaVectorStore()
    if clear_existing:
        try:
            vector_store._store.clear()
            log("VECTOR", "Cleared existing vector store")
        except Exception:
            pass
    vector_store.add_documents(all_chunks)
    stats["vector_store_size"] = vector_store.get_collection_size()
    log("VECTOR", f"Vector store now has {stats['vector_store_size']} chunks")

    # ── Knowledge graph ───────────────────────────────────────────────────────
    log("GRAPH", "Building knowledge graph (rule-based extraction, no LLM rate-limits)…")
    if neo4j_manager.available:
        neo4j_manager.create_constraints()

    graph_builder = GraphBuilder()
    graph_builder.build_graph_from_chunks(all_chunks, use_llm=False)

    stats["graph_nodes"] = nx_graph.node_count
    stats["graph_edges"] = nx_graph.edge_count
    log("GRAPH", f"Graph: {stats['graph_nodes']} nodes, {stats['graph_edges']} edges")

    log("DONE", f"Ingestion complete. Sources: {', '.join(stats['sources'])}")
    return stats


if __name__ == "__main__":
    stats = run_ingestion_pipeline()
    print("\n=== Ingestion Summary ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")
