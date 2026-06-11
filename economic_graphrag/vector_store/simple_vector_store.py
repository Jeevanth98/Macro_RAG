# economic_graphrag/vector_store/simple_vector_store.py
"""
Lightweight JSON-backed vector store using cosine similarity.
Drop-in replacement when chromadb is unavailable.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np

from economic_graphrag.config import settings


def _cosine(a: List[float], b: List[float]) -> float:
    av, bv = np.array(a, dtype=float), np.array(b, dtype=float)
    # Pad shorter to match length
    if len(av) < len(bv):
        av = np.pad(av, (0, len(bv) - len(av)))
    elif len(bv) < len(av):
        bv = np.pad(bv, (0, len(av) - len(bv)))
    na, nb = np.linalg.norm(av), np.linalg.norm(bv)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(av, bv) / (na * nb))


def _keyword_score(query: str, content: str) -> float:
    qw = set(query.lower().split())
    cw = set(content.lower().split())
    return len(qw & cw) / len(qw) if qw else 0.0


class SimpleVectorStore:
    """
    JSON-backed vector store. Embeddings are stored alongside documents.
    Supports both embedding-based and keyword-based retrieval.
    """

    def __init__(
        self,
        path: str = settings.CHROMA_PATH,
        collection_name: str = settings.CHROMA_COLLECTION_NAME,
    ):
        self.db_path = Path(path) / f"{collection_name}.json"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._data: List[Dict[str, Any]] = []
        self._load()

    # ------------------------------------------------------------------
    def _load(self):
        if self.db_path.exists():
            try:
                self._data = json.loads(self.db_path.read_text())
                print(f"SimpleVectorStore: loaded {len(self._data)} records from {self.db_path}")
            except Exception as e:
                print(f"SimpleVectorStore load error ({e}); starting fresh.")
                self._data = []

    def _save(self):
        self.db_path.write_text(json.dumps(self._data))

    # ------------------------------------------------------------------
    def _get_embedder(self):
        try:
            from economic_graphrag.embeddings.embedder import embedder
            return embedder
        except Exception:
            return None

    # ------------------------------------------------------------------
    def add_documents(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return
        embedder = self._get_embedder()
        existing_ids = {item["chunk_id"] for item in self._data}
        new_chunks = [c for c in chunks if c.get("chunk_id") not in existing_ids]
        if not new_chunks:
            print(f"SimpleVectorStore: all {len(chunks)} chunks already stored.")
            return

        contents = [c["content"] for c in new_chunks]
        embeddings = None
        if embedder:
            try:
                embeddings = embedder.embed_documents(contents)
            except Exception as e:
                print(f"Embed error: {e}")

        for i, chunk in enumerate(new_chunks):
            record = dict(chunk)
            if embeddings and i < len(embeddings):
                record["_embedding"] = embeddings[i]
            self._data.append(record)

        self._save()
        print(f"SimpleVectorStore: added {len(new_chunks)} docs (total {len(self._data)}).")

    # ------------------------------------------------------------------
    def _tfidf_refit_and_score(self, query: str) -> List[Tuple[Dict[str, Any], float]]:
        """
        Re-fit TF-IDF on all stored document contents (shared vocabulary),
        then score the query against all documents.
        This is needed because the TF-IDF vectorizer state is not persisted
        between process restarts.
        """
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            import numpy as np

            contents = [item.get("content", "") for item in self._data]
            vectorizer = TfidfVectorizer(
                max_features=4096, sublinear_tf=True,
                stop_words="english", ngram_range=(1, 2),
            )
            doc_matrix = vectorizer.fit_transform(contents)
            q_vec = vectorizer.transform([query])

            # Cosine similarity: dot(q, d) / (|q| * |d|)
            from sklearn.metrics.pairwise import cosine_similarity
            scores = cosine_similarity(q_vec, doc_matrix)[0]
            return list(zip(self._data, scores.tolist()))
        except Exception as e:
            print(f"TF-IDF refit error ({e}); falling back to keyword search")
            return [
                (item, _keyword_score(query, item.get("content", "")))
                for item in self._data
            ]

    def similarity_search(
        self, query: str, top_k: int = 5
    ) -> List[Tuple[Dict[str, Any], float]]:
        if not self._data:
            return []

        embedder = self._get_embedder()
        use_semantic = bool(
            embedder
            and self._data
            and "_embedding" in self._data[0]
            and getattr(embedder, "mode", "tfidf") in ("gemini", "sentence_transformers")
        )

        if use_semantic:
            try:
                q_emb = embedder.embed_query(query)
                scored = [
                    (item, _cosine(q_emb, item["_embedding"]))
                    for item in self._data
                    if "_embedding" in item
                ]
            except Exception:
                use_semantic = False

        if not use_semantic:
            # TF-IDF mode: re-fit on full corpus for consistent vocabulary
            scored = self._tfidf_refit_and_score(query)

        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            ({k: v for k, v in item.items() if k != "_embedding"}, score)
            for item, score in scored[:top_k]
        ]

    # ------------------------------------------------------------------
    def metadata_filtered_search(
        self, query: str, filter_metadata: Dict[str, Any], top_k: int = 5
    ) -> List[Tuple[Dict[str, Any], float]]:
        filtered = [
            item for item in self._data
            if all(item.get(k) == v for k, v in filter_metadata.items())
        ]
        if not filtered:
            return []
        tmp = SimpleVectorStore.__new__(SimpleVectorStore)
        tmp._data = filtered
        tmp.db_path = self.db_path
        return tmp.similarity_search(query, top_k)

    def get_collection_size(self) -> int:
        return len(self._data)

    def get_all(self) -> List[Dict[str, Any]]:
        """Return all stored chunks (without the internal embedding field)."""
        return [{k: v for k, v in item.items() if k != "_embedding"} for item in self._data]

    def clear(self):
        self._data = []
        self._save()
