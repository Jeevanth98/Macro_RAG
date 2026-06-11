# economic_graphrag/agents/planner_agent.py
"""
Planner Agent:
  1. Rule-based classification (fast, always works)
  2. LLM refinement (best-effort, if available)
"""
import re
from typing import Dict, Any

from economic_graphrag.llm.llm_factory import FallbackLLMClient
from economic_graphrag.llm.json_utils import LLMJSONParseError, parse_json_object

# Keywords → query type
_DEFINITION_KW  = re.compile(r"\bwhat (is|are|was|were)\b", re.I)
_TREND_KW       = re.compile(r"\btrend|over time|since|from \d{4}|history|historical|evolved\b", re.I)
_COMPARISON_KW  = re.compile(r"\bcompare|versus|vs\.?|difference|between .+ and\b", re.I)
_FORECAST_KW    = re.compile(r"\bforecast|predict|projection|outlook|next year|future\b", re.I)
_RELATIONSHIP_KW= re.compile(r"\brelationship|effect of|impact of|how does|affect|influence|correlation\b", re.I)

# Keywords → strategy
_VECTOR_HINTS   = re.compile(r"\bdefine|definition|explain|overview|summary\b", re.I)
_GRAPH_HINTS    = re.compile(r"\brelationship|connection|link|correlat|between .+ and\b", re.I)


def _rule_classify(query: str) -> Dict[str, str]:
    if _FORECAST_KW.search(query):
        return {"query_type": "ForecastQuery", "retrieval_strategy": "hybrid"}
    if _COMPARISON_KW.search(query):
        return {"query_type": "ComparisonQuery", "retrieval_strategy": "hybrid"}
    if _RELATIONSHIP_KW.search(query):
        return {"query_type": "RelationshipQuery", "retrieval_strategy": "hybrid"}
    if _TREND_KW.search(query):
        return {"query_type": "TrendQuery", "retrieval_strategy": "vector"}
    if _DEFINITION_KW.search(query):
        return {"query_type": "DefinitionQuery", "retrieval_strategy": "vector"}
    return {"query_type": "ResearchQuery", "retrieval_strategy": "hybrid"}


class PlannerAgent:
    """
    Classifies the user query and decides the retrieval strategy.
    Uses rule-based classification first, LLM refinement as optional enhancement.
    """

    def __init__(self):
        self.llm_client = FallbackLLMClient()

    def plan(self, query: str) -> Dict[str, Any]:
        # 1. Fast rule-based classification (always available)
        rule_result = _rule_classify(query)
        default = {"query": query, **rule_result}

        # 2. Best-effort LLM refinement
        prompt = (
            "You are a macroeconomic expert agent. Classify the user's query and choose a retrieval strategy.\n\n"
            "Query types: DefinitionQuery, TrendQuery, ComparisonQuery, ForecastQuery, RelationshipQuery, ResearchQuery\n"
            "Retrieval strategy: vector (definitions/lookups), graph (relationships/comparisons), hybrid (default)\n\n"
            'Respond ONLY with a valid JSON object: {"query_type": "...", "retrieval_strategy": "..."}\n\n'
            f'Query: "{query}"'
        )
        try:
            response = self.llm_client.generate(prompt, format="json")
            if "response" in response and "error" not in response:
                result = parse_json_object(response["response"])
                if result.get("query_type") and result.get("retrieval_strategy"):
                    default["query_type"] = result["query_type"]
                    default["retrieval_strategy"] = result["retrieval_strategy"]
        except (LLMJSONParseError, Exception):
            pass  # Stick with rule-based result

        return default
