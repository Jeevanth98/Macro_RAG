# economic_graphrag/retrieval/graph_retriever.py
"""
Graph retriever: queries NetworkX (primary) and Neo4j (if available).
"""
import re
from typing import Any, Dict, List

from economic_graphrag.graph.networkx_graph import nx_graph
from economic_graphrag.graph.neo4j_manager import neo4j_manager


_ECONOMIC_STOPWORDS = {
    "what", "how", "why", "when", "where", "which", "who", "does", "do",
    "is", "are", "was", "were", "the", "a", "an", "and", "or", "in",
    "of", "to", "for", "with", "on", "at", "by", "from", "between",
    "affect", "impact", "relationship", "compare", "difference", "rate",
    "data", "information", "tell", "me", "about",
}


def _extract_keywords(query: str, top_n: int = 5) -> List[str]:
    """Extract meaningful keywords from a query."""
    words = re.findall(r"[A-Za-z]{3,}", query)
    return [w for w in words if w.lower() not in _ECONOMIC_STOPWORDS][:top_n]


class GraphRetriever:
    """
    Retrieves relationship paths from the knowledge graph for a query.
    """

    def retrieve(self, query: str, query_type: str = "ResearchQuery") -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        # Try Neo4j first if available
        if neo4j_manager.available:
            results = self._retrieve_neo4j(query, query_type)

        # Always supplement with NetworkX
        nx_results = self._retrieve_networkx(query, query_type)

        # Deduplicate by merging
        seen = set()
        combined = []
        for r in results + nx_results:
            key = (r.get("subject"), r.get("relationship"), r.get("object"))
            if key not in seen:
                seen.add(key)
                combined.append(r)

        return combined[:15]

    # ------------------------------------------------------------------
    def _retrieve_networkx(self, query: str, query_type: str) -> List[Dict[str, Any]]:
        keywords = _extract_keywords(query)
        if not keywords:
            return []

        results = []

        if query_type in ("ComparisonQuery",) and len(keywords) >= 2:
            common = nx_graph.find_common_neighbors(keywords[0], keywords[1])
            results.extend(common)

        # For each keyword, find its graph neighborhood
        for kw in keywords[:3]:
            neighbors = nx_graph.get_neighbors(kw, limit=5)
            results.extend(neighbors)
            # Also search for nodes containing the keyword
            search_results = nx_graph.search_nodes(kw, limit=5)
            results.extend(search_results)

        return results[:15]

    # ------------------------------------------------------------------
    def _retrieve_neo4j(self, query: str, query_type: str) -> List[Dict[str, Any]]:
        keywords = _extract_keywords(query)
        if not keywords:
            return []

        entity = keywords[0]
        cypher = """
        MATCH (a)-[r]-(b)
        WHERE toLower(a.name) CONTAINS toLower($kw) OR toLower(b.name) CONTAINS toLower($kw)
        RETURN a.name AS subject, type(r) AS relationship, b.name AS object
        LIMIT 10
        """
        try:
            return neo4j_manager.execute_query(cypher, {"kw": entity})
        except Exception as e:
            print(f"Neo4j retrieval error: {e}")
            return []
