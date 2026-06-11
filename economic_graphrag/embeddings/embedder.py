# economic_graphrag/embeddings/embedder.py
"""
Embedding layer with three tiers:
  1. Gemini text-embedding-004 (semantic, free)
  2. sentence-transformers (if installed)
  3. TF-IDF with scikit-learn (keyword-based fallback)
"""
import os
from typing import List

import numpy as np

from economic_graphrag.config import settings


class GeminiEmbedder:
    """Uses Gemini text-embedding-004."""

    ENDPOINT = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/text-embedding-004:embedContent"
    )
    DIM = 768

    def __init__(self, api_key: str):
        self.api_key = api_key

    def embed_one(self, text: str) -> List[float]:
        import requests
        resp = requests.post(
            self.ENDPOINT,
            headers={"Content-Type": "application/json",
                     "x-goog-api-key": self.api_key},
            json={"model": "models/text-embedding-004",
                  "content": {"parts": [{"text": text[:8000]}]}},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()["embedding"]["values"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results = []
        for t in texts:
            try:
                results.append(self.embed_one(t))
            except Exception as e:
                print(f"Gemini embed error: {e}")
                results.append([0.0] * self.DIM)
        return results

    def embed_query(self, query: str) -> List[float]:
        try:
            return self.embed_one(query)
        except Exception as e:
            print(f"Gemini embed error: {e}")
            return [0.0] * self.DIM


class TFIDFEmbedder:
    """TF-IDF based embedder using scikit-learn. Fits lazily."""

    def __init__(self):
        from sklearn.feature_extraction.text import TfidfVectorizer
        self._vectorizer = TfidfVectorizer(max_features=1024, sublinear_tf=True)
        self._fitted = False
        self._corpus: List[str] = []

    def _fit_if_needed(self, texts: List[str]):
        all_texts = self._corpus + [t for t in texts if t not in self._corpus]
        self._corpus = all_texts
        if len(all_texts) >= 1:
            self._vectorizer.fit(all_texts)
            self._fitted = True

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        self._fit_if_needed(texts)
        mat = self._vectorizer.transform(texts).toarray()
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms[norms == 0] = 1
        return (mat / norms).tolist()

    def embed_query(self, query: str) -> List[float]:
        if not self._fitted:
            self._fit_if_needed([query])
        vec = self._vectorizer.transform([query]).toarray()[0]
        norm = np.linalg.norm(vec)
        return (vec / norm).tolist() if norm > 0 else vec.tolist()


class Embedder:
    """
    Singleton embedder. Priority: Gemini API → sentence-transformers → TF-IDF.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init()
        return cls._instance

    def _init(self):
        self._backend = None
        self._mode = "none"

        # Tier 1: Gemini embedding API
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        if gemini_key:
            try:
                ge = GeminiEmbedder(gemini_key)
                ge.embed_one("test")
                self._backend = ge
                self._mode = "gemini"
                print("Embedder: using Gemini text-embedding-004")
                return
            except Exception as e:
                print(f"Embedder: Gemini unavailable ({e}), trying next...")

        # Tier 2: sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)

            class _STBackend:
                def __init__(self, m): self.m = m
                def embed_documents(self, texts): return self.m.encode(texts, convert_to_numpy=True).tolist()
                def embed_query(self, q): return self.m.encode(q, convert_to_numpy=True).tolist()

            self._backend = _STBackend(model)
            self._mode = "sentence_transformers"
            print(f"Embedder: using sentence-transformers ({settings.EMBEDDING_MODEL_NAME})")
            return
        except Exception as e:
            print(f"Embedder: sentence-transformers unavailable ({e}), falling back to TF-IDF")

        # Tier 3: TF-IDF
        self._backend = TFIDFEmbedder()
        self._mode = "tfidf"
        print("Embedder: using TF-IDF (scikit-learn)")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._backend.embed_documents(texts)

    def embed_query(self, query: str) -> List[float]:
        return self._backend.embed_query(query)

    @property
    def mode(self) -> str:
        return self._mode


embedder = Embedder()
