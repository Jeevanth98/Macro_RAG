# economic_graphrag/graph/neo4j_manager.py
from typing import List, Dict, Any

from economic_graphrag.config import settings


class Neo4jManager:
    """
    Manages the connection to a Neo4j database.
    Degrades gracefully when Neo4j is not available.
    """

    _instance = None
    _driver = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        try:
            from neo4j import GraphDatabase, basic_auth
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=basic_auth(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                connection_timeout=5,
            )
            self._driver.verify_connectivity()
            print("Neo4j connection successful.")
        except Exception as e:
            print(f"Neo4j not available (will return empty results): {e}")
            self._driver = None

    @property
    def available(self) -> bool:
        return self._driver is not None

    def close(self):
        if self._driver is not None:
            self._driver.close()
            print("Neo4j connection closed.")

    def execute_query(self, query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        if self._driver is None:
            return []
        try:
            with self._driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            print(f"Neo4j query error: {e}")
            return []

    def execute_write(self, query: str, parameters: Dict[str, Any] = None):
        if self._driver is None:
            return
        try:
            with self._driver.session() as session:
                session.write_transaction(self._run_transaction, query, parameters or {})
        except Exception as e:
            print(f"Neo4j write error: {e}")

    @staticmethod
    def _run_transaction(tx, query, parameters):
        tx.run(query, parameters)

    def create_constraints(self):
        if self._driver is None:
            return
        constraints = {
            "Country": "name",
            "Indicator": "name",
            "Report": "id",
            "Source": "name",
            "EconomicConcept": "name",
            "Institution": "name",
            "Region": "name",
            "Forecast": "id",
        }
        for label, prop in constraints.items():
            q = f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
            try:
                self.execute_write(q)
            except Exception as e:
                print(f"Constraint error for {label}: {e}")


neo4j_manager = Neo4jManager()
