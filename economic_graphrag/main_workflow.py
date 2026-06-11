# economic_graphrag/main_workflow.py
from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, StateGraph

from economic_graphrag.agents.planner_agent import PlannerAgent
from economic_graphrag.agents.vector_agent import VectorAgent
from economic_graphrag.agents.graph_agent import GraphAgent
from economic_graphrag.agents.answer_agent import AnswerAgent
from economic_graphrag.retrieval.vector_retriever import VectorRetriever
from economic_graphrag.retrieval.graph_retriever import GraphRetriever
from economic_graphrag.vector_store.chroma_manager import ChromaVectorStore


class GraphState(TypedDict):
    query: str
    plan: Dict[str, Any]
    vector_results: List[Dict[str, Any]]
    graph_results: List[Dict[str, Any]]
    final_answer: Dict[str, Any]


class MainWorkflow:
    """
    Orchestrates the Hybrid GraphRAG pipeline via LangGraph.
    """

    def __init__(self):
        self.planner = PlannerAgent()

        vector_store = ChromaVectorStore()
        vector_retriever = VectorRetriever(vector_store)
        graph_retriever = GraphRetriever()

        self.vector_agent = VectorAgent(vector_retriever)
        self.graph_agent = GraphAgent(graph_retriever)
        self.answer_agent = AnswerAgent()

        self.graph = self._build_graph()

    def _build_graph(self):
        wf = StateGraph(GraphState)
        wf.add_node("planner", self._run_planner)
        wf.add_node("vector_retriever", self._run_vector)
        wf.add_node("graph_retriever", self._run_graph)
        wf.add_node("answer_generator", self._run_answer)

        wf.set_entry_point("planner")

        wf.add_conditional_edges(
            "planner",
            self._decide_strategy,
            {
                "vector": "vector_retriever",
                "graph": "graph_retriever",
                "hybrid": "vector_retriever",
            },
        )

        wf.add_edge("vector_retriever", "graph_retriever")
        wf.add_edge("graph_retriever", "answer_generator")
        wf.add_edge("answer_generator", END)
        return wf.compile()

    # --- Nodes ---

    def _run_planner(self, state: GraphState) -> Dict:
        plan = self.planner.plan(state["query"])
        return {"plan": plan}

    def _run_vector(self, state: GraphState) -> Dict:
        return self.vector_agent.retrieve(state)

    def _run_graph(self, state: GraphState) -> Dict:
        return self.graph_agent.retrieve(state)

    def _run_answer(self, state: GraphState) -> Dict:
        context = {
            "vector_results": state.get("vector_results", []),
            "graph_results": state.get("graph_results", []),
        }
        return {"final_answer": self.answer_agent.generate_answer(state["query"], context)}

    def _decide_strategy(self, state: GraphState) -> str:
        return state["plan"].get("retrieval_strategy", "hybrid")

    def execute(self, query: str) -> Dict[str, Any]:
        init = {
            "query": query,
            "plan": {},
            "vector_results": [],
            "graph_results": [],
            "final_answer": {},
        }
        return self.graph.invoke(init)
