# economic_graphrag/graph/graph_builder.py
"""
Builds the knowledge graph from document chunks.
Writes to NetworkX (always) and Neo4j (if available).
"""
from typing import Any, Dict, List

from economic_graphrag.graph.entity_extractor import EntityExtractor
from economic_graphrag.graph.networkx_graph import nx_graph
from economic_graphrag.graph.neo4j_manager import neo4j_manager


class GraphBuilder:
    """
    Processes chunks → extracts entities/relationships → populates graph stores.
    """

    def __init__(self):
        self.entity_extractor = EntityExtractor()

    def build_graph_from_chunks(
        self,
        chunks: List[Dict[str, Any]],
        save_every: int = 50,
        use_llm: bool = False,
    ):
        """
        Build the knowledge graph from document chunks.

        Args:
            chunks: List of document chunks.
            save_every: Persist graph to disk every N chunks.
            use_llm: If True, also attempt LLM-based extraction for a sample of chunks.
                     Defaults to False — rule-based + spaCy extraction is fast, reliable,
                     and sufficient for a production graph.
        """
        total = len(chunks)
        print(f"Building knowledge graph from {total} chunks …")

        for i, chunk in enumerate(chunks):
            try:
                if use_llm:
                    extracted = self.entity_extractor.extract_all(chunk)
                else:
                    # Fast path: rule-based metadata + spaCy only
                    rule_data = self.entity_extractor._rule_based_from_metadata(chunk)
                    spacy_ents = self.entity_extractor.extract_entities_spacy(
                        chunk.get("content", "")
                    )
                    # Merge spaCy into rule_data entities
                    entities = {k: list(v) for k, v in {
                        **{et: set(el) for et, el in rule_data["entities"].items()},
                        **{"Country": set(rule_data["entities"].get("Country", []))
                           | spacy_ents.get("Country", set()),
                           "Institution": set(rule_data["entities"].get("Institution", []))
                           | spacy_ents.get("Institution", set()),
                           "Region": set(rule_data["entities"].get("Region", []))
                           | spacy_ents.get("Region", set()),
                           },
                    }.items() if v}
                    extracted = {
                        "entities": entities,
                        "relationships": rule_data["relationships"],
                    }

                self._insert_networkx(extracted)
                if neo4j_manager.available:
                    self._insert_neo4j(extracted)
            except Exception as e:
                print(f"  Chunk {i+1}/{total} error: {e}")

            if (i + 1) % save_every == 0 or (i + 1) == total:
                nx_graph.save()
                print(f"  Processed {i+1}/{total} chunks …")

        print(f"Graph build complete: {nx_graph.node_count} nodes, {nx_graph.edge_count} edges")

    # ------------------------------------------------------------------
    def _insert_networkx(self, data: Dict[str, Any]):
        entities = data.get("entities", {})
        relationships = data.get("relationships", [])

        # Insert nodes
        for label, names in entities.items():
            for name in names:
                if name and len(name.strip()) > 0:
                    nx_graph.merge_node(name.strip(), label)

        # Insert relationships
        for rel in relationships:
            if len(rel) == 3:
                subj, rel_type, obj = rel
                subj, obj = subj.strip(), obj.strip()
                if subj and obj:
                    # Ensure nodes exist
                    if not nx_graph.node_exists(subj):
                        nx_graph.merge_node(subj, "EconomicConcept")
                    if not nx_graph.node_exists(obj):
                        nx_graph.merge_node(obj, "EconomicConcept")
                    nx_graph.merge_edge(subj, obj, rel_type.upper().replace(" ", "_"))

    # ------------------------------------------------------------------
    def _insert_neo4j(self, data: Dict[str, Any]):
        entities = data.get("entities", {})
        relationships = data.get("relationships", [])

        for label, names in entities.items():
            for name in names:
                if name:
                    q = f"MERGE (n:{label} {{name: $name}})"
                    neo4j_manager.execute_write(q, {"name": name.strip()})

        for rel in relationships:
            if len(rel) == 3:
                subj, rel_type, obj = rel
                rel_type = rel_type.upper().replace(" ", "_")
                q = """
                MERGE (a {name: $subj})
                MERGE (b {name: $obj})
                MERGE (a)-[:%s]->(b)
                """ % rel_type
                neo4j_manager.execute_write(q, {"subj": subj.strip(), "obj": obj.strip()})
