# economic_graphrag/graph/networkx_graph.py
"""
In-memory knowledge graph backed by NetworkX with JSON persistence.
Acts as the primary graph store when Neo4j is unavailable.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import networkx as nx

from economic_graphrag.config import settings

_GRAPH_PATH = Path(settings.DATA_DIR) / "knowledge_graph.json"


class NetworkXGraph:
    """
    Directed knowledge graph using NetworkX with file-backed persistence.
    Thread-safe for single-process use.
    """

    _instance: Optional["NetworkXGraph"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._graph = nx.MultiDiGraph()
            cls._instance._load()
        return cls._instance

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def _load(self):
        _GRAPH_PATH.parent.mkdir(parents=True, exist_ok=True)
        if _GRAPH_PATH.exists():
            try:
                data = json.loads(_GRAPH_PATH.read_text())
                self._graph = nx.node_link_graph(data, edges="links", multigraph=True, directed=True)
                print(f"NetworkX graph loaded: {self._graph.number_of_nodes()} nodes, "
                      f"{self._graph.number_of_edges()} edges")
            except Exception as e:
                print(f"Could not load graph ({e}); starting fresh.")
                self._graph = nx.MultiDiGraph()

    def save(self):
        try:
            data = nx.node_link_data(self._graph, edges="links")
            _GRAPH_PATH.write_text(json.dumps(data))
        except Exception as e:
            print(f"Graph save error: {e}")

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------
    def merge_node(self, name: str, label: str, **attrs):
        """MERGE-like: create node if not exists, else update attrs."""
        if not self._graph.has_node(name):
            self._graph.add_node(name, label=label, **attrs)
        else:
            self._graph.nodes[name].update({"label": label, **attrs})

    def merge_edge(self, subject: str, obj: str, rel_type: str):
        """Add relationship if not already present."""
        for _, _, data in self._graph.out_edges(subject, data=True):
            if data.get("type") == rel_type and _ == subject:
                pass
        # Check existing edges between subject→obj
        existing = [
            d for _, _, d in self._graph.edges(subject, data=True)
            if d.get("type") == rel_type
        ]
        edges_to_obj = [
            (u, v, d) for u, v, d in self._graph.edges(data=True)
            if u == subject and v == obj and d.get("type") == rel_type
        ]
        if not edges_to_obj:
            self._graph.add_edge(subject, obj, type=rel_type)

    def clear(self):
        self._graph.clear()
        self.save()

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------
    def node_exists(self, name: str) -> bool:
        return self._graph.has_node(name)

    def get_neighbors(self, name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Return all edges (both in and out) for a node."""
        results = []
        if not self._graph.has_node(name):
            return results
        for u, v, data in self._graph.out_edges(name, data=True):
            results.append({"subject": u, "relationship": data.get("type", "RELATED_TO"), "object": v})
        for u, v, data in self._graph.in_edges(name, data=True):
            results.append({"subject": u, "relationship": data.get("type", "RELATED_TO"), "object": v})
        return results[:limit]

    def find_nodes_by_label(self, label: str, limit: int = 20) -> List[str]:
        return [
            n for n, d in self._graph.nodes(data=True)
            if d.get("label") == label
        ][:limit]

    def find_common_neighbors(self, name1: str, name2: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find nodes connected to both name1 and name2."""
        if not (self._graph.has_node(name1) and self._graph.has_node(name2)):
            return []
        n1 = set(nx.all_neighbors(self._graph, name1))
        n2 = set(nx.all_neighbors(self._graph, name2))
        common = n1 & n2
        return [{"node": c, "entity1": name1, "entity2": name2} for c in list(common)[:limit]]

    def search_nodes(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find nodes whose name contains the keyword (case-insensitive)."""
        kw = keyword.lower()
        matches = [
            n for n in self._graph.nodes()
            if kw in str(n).lower()
        ][:limit]
        results = []
        for m in matches:
            neighbors = self.get_neighbors(m, limit=5)
            results.extend(neighbors)
        return results[:limit]

    @property
    def node_count(self) -> int:
        return self._graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self._graph.number_of_edges()

    @property
    def available(self) -> bool:
        return True


# Singleton
nx_graph = NetworkXGraph()
