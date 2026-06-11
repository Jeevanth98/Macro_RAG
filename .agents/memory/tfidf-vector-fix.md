---
name: TF-IDF vector search fix
description: Why per-document TF-IDF embeddings break cosine similarity and how to fix it
---
## Problem
TF-IDF vectorizer fitted per-document (at ingestion time) stores incomparable embeddings:
each doc uses a different vocabulary, so cosine similarity between them is meaningless.
The vectorizer state is also not persisted between process restarts.

## Fix (SimpleVectorStore._tfidf_refit_and_score)
Re-fit TF-IDF on ALL stored document contents at query time (shared vocabulary), then
score query against all documents using sklearn cosine_similarity.
Use ngram_range=(1,2) and stop_words="english" for better matching.

**Why:** Cross-document TF-IDF cosine requires a shared vocabulary (same vectorizer fit).
**How to apply:** When embedder.mode != "gemini"/"sentence_transformers", bypass stored _embedding field and use _tfidf_refit_and_score instead.
