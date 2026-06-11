# economic_graphrag/vector_store/chroma_manager.py
# Tries to import chromadb; if unavailable, transparently falls back
# to the lightweight SimpleVectorStore implementation.

from typing import Any, Dict, List, Tuple

from economic_graphrag.config import settings
from economic_graphrag.vector_store.base import BaseVectorStore


def _build_store() -> BaseVectorStore:
    try:
        import chromadb
        from economic_graphrag.embeddings.embedder import embedder

        class _ChromaVectorStore(BaseVectorStore):
            def __init__(self):
                self.client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
                self.collection = self.client.get_or_create_collection(
                    name=settings.CHROMA_COLLECTION_NAME
                )

            def add_documents(self, chunks: List[Dict[str, Any]]):
                if not chunks:
                    return
                ids = [c["chunk_id"] for c in chunks]
                contents = [c["content"] for c in chunks]
                embeddings = embedder.embed_documents(contents)
                metadatas = [
                    {k: v for k, v in c.items() if k != "content" and isinstance(v, (str, int, float, bool))}
                    for c in chunks
                ]
                self.collection.add(
                    embeddings=embeddings,
                    documents=contents,
                    metadatas=metadatas,
                    ids=ids,
                )

            def _format(self, results) -> List[Tuple[Dict[str, Any], float]]:
                out = []
                if not results or not results.get("ids"):
                    return out
                for i in range(len(results["ids"][0])):
                    chunk = results["metadatas"][0][i]
                    chunk["content"] = results["documents"][0][i]
                    score = 1 - results["distances"][0][i]
                    out.append((chunk, score))
                return out

            def similarity_search(self, query: str, top_k: int = 5):
                qe = embedder.embed_query(query)
                return self._format(self.collection.query(query_embeddings=[qe], n_results=top_k))

            def metadata_filtered_search(self, query: str, filter_metadata: Dict[str, Any], top_k: int = 5):
                qe = embedder.embed_query(query)
                return self._format(
                    self.collection.query(query_embeddings=[qe], n_results=top_k, where=filter_metadata)
                )

            def get_collection_size(self) -> int:
                return self.collection.count()

            def get_all(self) -> List[Dict[str, Any]]:
                results = self.collection.get()
                out = []
                if not results or not results.get("ids"):
                    return out
                for i in range(len(results["ids"])):
                    chunk = (results["metadatas"][i] or {}).copy()
                    chunk["content"] = results["documents"][i]
                    chunk["chunk_id"] = results["ids"][i]
                    out.append(chunk)
                return out

        print("Using ChromaDB vector store.")
        return _ChromaVectorStore()
    except ImportError:
        from economic_graphrag.vector_store.simple_vector_store import SimpleVectorStore
        print("chromadb not available — using SimpleVectorStore fallback.")
        return SimpleVectorStore()


class ChromaVectorStore(BaseVectorStore):
    """
    Public API: delegates to chromadb if available, otherwise SimpleVectorStore.
    """

    def __init__(self, path: str = settings.CHROMA_PATH, collection_name: str = settings.CHROMA_COLLECTION_NAME):
        self._store = _build_store()

    def add_documents(self, chunks: List[Dict[str, Any]]):
        return self._store.add_documents(chunks)

    def similarity_search(self, query: str, top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        return self._store.similarity_search(query, top_k)

    def metadata_filtered_search(self, query: str, filter_metadata: Dict[str, Any], top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        return self._store.metadata_filtered_search(query, filter_metadata, top_k)

    def get_collection_size(self) -> int:
        return self._store.get_collection_size()

    def get_all(self) -> List[Dict[str, Any]]:
        return self._store.get_all()
