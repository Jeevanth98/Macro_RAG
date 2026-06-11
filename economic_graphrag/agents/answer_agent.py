# economic_graphrag/agents/answer_agent.py
"""
AnswerAgent: synthesises a final answer from retrieved vector chunks + graph paths.
Two-tier:
  1. LLM synthesis (Gemini → OpenRouter free models)
  2. Rule-based structured synthesis (never returns an empty answer)
"""
import textwrap
from typing import Any, Dict, List

from economic_graphrag.llm.llm_factory import FallbackLLMClient
from economic_graphrag.llm.json_utils import LLMJSONParseError, parse_json_object


class AnswerAgent:
    """
    Synthesises a final answer from retrieved vector chunks and graph paths.
    """

    def __init__(self):
        self.llm_client = FallbackLLMClient()

    # ── Public API ────────────────────────────────────────────────────────────
    def generate_answer(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        vector_results: List[Dict] = context.get("vector_results", [])
        graph_results:  List[Dict] = context.get("graph_results", [])

        vector_str = self._format_vector(vector_results)
        graph_str  = self._format_graph(graph_results)

        # ── Attempt LLM synthesis ─────────────────────────────────────────
        prompt = (
            "You are an expert macroeconomic analyst. "
            "Answer the user's question using ONLY the provided context.\n\n"
            f"**User Question:** {query}\n\n"
            f"**Document Context (vector search):**\n{vector_str}\n\n"
            f"**Knowledge Graph Context (entity relationships):**\n{graph_str}\n\n"
            "Instructions:\n"
            "1. Provide a comprehensive, factual answer grounded in the context above.\n"
            "2. Reference specific data points, countries, or indicators from the context.\n"
            "3. If the context is insufficient, say so clearly — do NOT invent data.\n"
            "4. List any relevant sources.\n\n"
            "Respond with a valid JSON object:\n"
            '{"answer": "<detailed answer string>", '
            '"sources": ["<source 1>", "<source 2>"], '
            '"explainability": "<brief note on how you used the context>"}'
        )

        response = self.llm_client.generate(prompt, format="json")
        if "response" in response and "error" not in response:
            try:
                result = parse_json_object(response["response"])
                answer = result.get("answer", "").strip()
                if answer and len(answer) > 40:
                    return {
                        "answer": answer,
                        "sources": result.get("sources", self._collect_sources(vector_results)),
                        "explainability": result.get("explainability", "LLM synthesised from retrieved context."),
                    }
            except (LLMJSONParseError, Exception):
                raw = response.get("response", "").strip()
                if raw and len(raw) > 40:
                    return {
                        "answer": raw,
                        "sources": self._collect_sources(vector_results),
                        "explainability": "Raw LLM response (JSON parse failed).",
                    }

        # ── Fallback: rule-based structured synthesis ─────────────────────
        return self._rule_based_answer(query, vector_results, graph_results)

    # ── Rule-based fallback ───────────────────────────────────────────────────
    def _rule_based_answer(
        self,
        query: str,
        vector_results: List[Dict],
        graph_results: List[Dict],
    ) -> Dict[str, Any]:
        """
        Builds a structured answer from raw retrieved data.
        Always produces a readable, data-grounded response.
        """
        if not vector_results and not graph_results:
            return {
                "answer": (
                    "No relevant data found for your query. "
                    "Please run the data ingestion pipeline to populate the knowledge base, "
                    "then try again."
                ),
                "sources": [],
                "explainability": "No context retrieved — knowledge base may be empty.",
            }

        lines = [f"## Macroeconomic Analysis: {query}\n"]
        lines.append(
            "_Note: LLM synthesis temporarily unavailable — presenting structured data "
            "from the knowledge base directly._\n"
        )

        sources = self._collect_sources(vector_results)

        # ── Group vector results by country / indicator ───────────────────
        by_country: Dict[str, List[Dict]] = {}
        for r in vector_results:
            country = r.get("country", r.get("source", "General"))
            by_country.setdefault(country, []).append(r)

        if by_country:
            lines.append("### 📊 Retrieved Data\n")
            for country, chunks in list(by_country.items())[:6]:
                lines.append(f"**{country}**")
                for chunk in chunks[:2]:
                    content = chunk.get("content", "")
                    indicator = chunk.get("indicator", "")
                    if indicator:
                        lines.append(f"- *{indicator}*")
                    # Extract the first 3 lines of data from the content
                    data_lines = [
                        ln.strip() for ln in content.splitlines()
                        if ln.strip() and not ln.startswith("=") and len(ln.strip()) > 5
                    ][:5]
                    for dl in data_lines:
                        lines.append(f"  {dl}")
                lines.append("")

        # ── Graph context ─────────────────────────────────────────────────
        if graph_results:
            lines.append("### 🕸️ Knowledge Graph Relationships\n")
            for r in graph_results[:12]:
                subj = r.get("subject", r.get("entity1", "?"))
                rel  = r.get("relationship", "RELATED_TO")
                obj  = r.get("object", r.get("entity2", "?"))
                lines.append(f"- **{subj}** → `{rel}` → **{obj}**")
            lines.append("")

        # ── Summary ───────────────────────────────────────────────────────
        lines.append("### 📋 Summary\n")
        lines.append(
            f"The knowledge base contains {len(vector_results)} relevant chunks "
            f"and {len(graph_results)} graph relationships for this query. "
            "The data above was retrieved from real macroeconomic databases "
            f"({', '.join(sources[:3]) if sources else 'World Bank, OECD'}) "
            "and represents actual economic statistics."
        )

        return {
            "answer": "\n".join(lines),
            "sources": sources,
            "explainability": (
                f"Rule-based synthesis from {len(vector_results)} vector chunks "
                f"and {len(graph_results)} graph paths. "
                "LLM synthesis was unavailable — data presented directly."
            ),
        }

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _collect_sources(self, vector_results: List[Dict]) -> List[str]:
        seen: set = set()
        sources: List[str] = []
        for r in vector_results:
            src = r.get("source", r.get("title", ""))
            if src and src not in seen:
                seen.add(src)
                sources.append(src)
        return sources[:6]

    def _format_vector(self, results: List[Dict]) -> str:
        if not results:
            return "No document context retrieved."
        lines = []
        for i, r in enumerate(results[:5], 1):
            src     = r.get("source", r.get("title", "Unknown"))
            country = r.get("country", "")
            score   = r.get("score", 0)
            content = r.get("content", "")[:600]
            lines.append(
                f"[{i}] {src}{' | ' + country if country else ''} (relevance: {score:.2f})\n{content}"
            )
        return "\n\n".join(lines)

    def _format_graph(self, results: List[Dict]) -> str:
        if not results:
            return "No graph relationships found."
        lines = []
        for r in results[:10]:
            subj = r.get("subject", r.get("entity1", "?"))
            rel  = r.get("relationship", "RELATED_TO")
            obj  = r.get("object", r.get("entity2", "?"))
            lines.append(f"  ({subj}) --[{rel}]--> ({obj})")
        return "\n".join(lines)
