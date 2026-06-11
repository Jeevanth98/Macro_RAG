---
name: GraphRAG stack constraints
description: Active tech stack choices and known fallback behavior for this project
---

## Active Stack (not what's imported — what actually works)
- **Embedder**: TF-IDF (scikit-learn) — Gemini embedding gives 404, sentence-transformers not installed
- **Vector store**: SimpleVectorStore (JSON + numpy at `data/chroma_db/macro_economics.json`) — chromadb gives 403
- **Graph**: NetworkX (`nx_graph._graph` — internal attr is `_graph`, edges use `type` key); Neo4j not available
- **LLM**: Gemini Flash (rate-limited, 20 req/min free) → OpenRouter `google/gemma-4-31b-it:free` fallback
- **Graph building**: Always `use_llm=False` in `graph_builder.build_graph_from_chunks()` — LLM hammers limits

**Why:** Replit environment doesn't allow Neo4j Docker, chromadb connectivity issues, free tier Gemini limits.

**How to apply:** Whenever debugging retrieval or LLM issues, check these fallback chains first, not the primary code paths.
