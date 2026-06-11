# economic_graphrag/agents/vector_agent.py
"""
VectorAgent: retrieves relevant document chunks from the vector store.
For ComparisonQuery, runs multi-entity retrieval so both entities get representation.
"""
import re
from typing import Any, Dict, List

from economic_graphrag.retrieval.vector_retriever import VectorRetriever


_STOPWORDS = {
    "what", "is", "are", "was", "were", "the", "a", "an", "and", "or", "in",
    "of", "to", "for", "with", "on", "at", "by", "from", "between", "how",
    "does", "do", "compare", "comparing", "difference", "versus", "vs",
    "over", "last", "decade", "year", "years", "rate", "rates",
}


def _extract_entities(query: str) -> List[str]:
    """Extract capitalized noun phrases / proper nouns from query."""
    # Match sequences of capitalized words (likely country/org names)
    caps = re.findall(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*", query)
    return [c for c in caps if c.lower() not in _STOPWORDS]


class VectorAgent:
    """
    Retrieves information from the vector store.
    Supports multi-query retrieval for comparison queries.
    """

    def __init__(self, vector_retriever: VectorRetriever):
        self.vector_retriever = vector_retriever

    def retrieve(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("--- Executing Vector Agent ---")
        query = state["query"]
        plan  = state.get("plan", {})
        query_type = plan.get("query_type", "ResearchQuery")
        strategy   = plan.get("retrieval_strategy", "hybrid")

        base_top_k = 8  # always retrieve at least 8 chunks

        results: List[Dict[str, Any]] = []

        if query_type == "ComparisonQuery":
            # Multi-entity retrieval: pull docs for each extracted entity
            entities = _extract_entities(query)
            per_entity = max(4, base_top_k // max(len(entities), 1))
            seen_ids: set = set()

            for entity in entities[:4]:
                sub_query = f"{entity} {_topic_from_query(query)}"
                sub_results = self.vector_retriever.retrieve(sub_query, per_entity)
                for r in sub_results:
                    cid = r.get("chunk_id", r.get("title", ""))
                    if cid not in seen_ids:
                        seen_ids.add(cid)
                        results.append(r)

            # Fall back to normal retrieval if entity extraction found nothing
            if not results:
                results = self.vector_retriever.retrieve(query, base_top_k)

            # Also add global top results
            global_top = self.vector_retriever.retrieve(query, 4)
            for r in global_top:
                cid = r.get("chunk_id", r.get("title", ""))
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    results.append(r)

        else:
            results = self.vector_retriever.retrieve(query, base_top_k)

        print(f"Found {len(results)} results from vector search.")
        return {"vector_results": results}


def _topic_from_query(query: str) -> str:
    """Extract the non-entity topic words (indicator, concept) from a query."""
    words = query.split()
    topic_words = [
        w for w in words
        if w.lower() not in _STOPWORDS and not w[0].isupper()
    ]
    return " ".join(topic_words[:5])
