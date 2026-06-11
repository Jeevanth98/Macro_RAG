# economic_graphrag/graph/entity_extractor.py
"""
Entity and relationship extractor.
Priority:
  1. Rule-based extraction from document metadata (always works, produces rich graph)
  2. spaCy NER for additional entity enrichment
  3. LLM extraction (best-effort, skipped on failure)
"""
from typing import Any, Dict, List, Set

from economic_graphrag.llm.llm_factory import FallbackLLMClient
from economic_graphrag.llm.json_utils import LLMJSONParseError, parse_json_object

_nlp = None
try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
    print("spaCy en_core_web_sm loaded for entity extraction.")
except Exception as e:
    print(f"spaCy model not available ({e}); using rule-based extraction only.")

# Known indicator → economic concept mappings
INDICATOR_CONCEPTS = {
    "GDP": ["economic output", "economic size", "national income", "gross domestic product"],
    "Inflation": ["price level", "purchasing power", "monetary policy", "cost of living"],
    "Unemployment": ["labour market", "job market", "economic slack", "jobless rate"],
    "Trade": ["international trade", "exports", "imports", "openness", "globalisation"],
    "GDP per capita": ["living standards", "productivity", "wealth per person"],
    "Exchange rate": ["currency", "monetary policy", "forex", "capital flows"],
    "CPI": ["price level", "cost of living", "purchasing power", "monetary policy"],
    "Federal Funds Rate": ["monetary policy", "interest rate", "central bank policy"],
    "Treasury": ["bond market", "interest rate", "government debt"],
    "M2": ["money supply", "monetary policy", "liquidity"],
}

# Regions / blocs for graph enrichment
COUNTRY_REGION = {
    "United States": ["G7", "G20", "NATO", "OECD"],
    "Germany": ["G7", "G20", "European Union", "OECD"],
    "France": ["G7", "G20", "European Union", "OECD"],
    "Italy": ["G7", "G20", "European Union", "OECD"],
    "Japan": ["G7", "G20", "OECD"],
    "United Kingdom": ["G7", "G20", "OECD"],
    "Canada": ["G7", "G20", "OECD"],
    "China": ["G20", "BRICS"],
    "India": ["G20", "BRICS"],
    "Brazil": ["G20", "BRICS"],
    "Russia": ["G20", "BRICS"],
    "South Africa": ["G20", "BRICS", "African Union"],
    "Argentina": ["G20", "Mercosur"],
    "Australia": ["G20", "OECD"],
    "Indonesia": ["G20", "ASEAN"],
    "Mexico": ["G20", "OECD", "Mercosur"],
    "Saudi Arabia": ["G20", "OPEC"],
    "South Korea": ["G20", "OECD"],
    "Turkey": ["G20", "NATO"],
}


def _match_indicator(text: str) -> str | None:
    """Return the canonical indicator name if found in text."""
    text_lower = text.lower()
    for ind in INDICATOR_CONCEPTS:
        if ind.lower() in text_lower:
            return ind
    return None


class EntityExtractor:
    """
    Three-tier extractor:
      1. Rule-based from metadata (always works)
      2. spaCy NER
      3. LLM (best-effort)
    """

    def __init__(self):
        self.llm_client = FallbackLLMClient()

    # ------------------------------------------------------------------
    def extract_entities_spacy(self, text: str) -> Dict[str, Set[str]]:
        entities: Dict[str, Set[str]] = {
            "Country": set(), "Institution": set(), "Region": set()
        }
        if _nlp is None:
            return entities
        doc = _nlp(text[:4000])
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC"):
                entities["Country"].add(ent.text.strip())
            elif ent.label_ == "ORG":
                entities["Institution"].add(ent.text.strip())
            elif ent.label_ == "NORP":
                entities["Region"].add(ent.text.strip())
        return entities

    # ------------------------------------------------------------------
    def _rule_based_from_metadata(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build entities and relationships purely from document metadata fields.
        This always produces useful graph nodes/edges regardless of LLM availability.
        """
        entities: Dict[str, Set[str]] = {
            "Country": set(), "Indicator": set(), "Source": set(),
            "EconomicConcept": set(), "Region": set(), "Institution": set(),
        }
        relationships: List[List[str]] = []

        country = chunk.get("country", "").strip()
        indicator = chunk.get("indicator", "").strip()
        source = chunk.get("source", "").strip()
        title = chunk.get("title", "").strip()

        # ── Nodes ────────────────────────────────────────────────────────
        if country:
            entities["Country"].add(country)
        if indicator:
            entities["Indicator"].add(indicator)
        if source:
            entities["Source"].add(source)

        # Match indicator → concepts
        ind_key = _match_indicator(indicator or title)
        if ind_key and ind_key in INDICATOR_CONCEPTS:
            for concept in INDICATOR_CONCEPTS[ind_key]:
                entities["EconomicConcept"].add(concept)

        # Country → region memberships
        if country and country in COUNTRY_REGION:
            for region in COUNTRY_REGION[country]:
                entities["Region"].add(region)

        # ── Relationships ─────────────────────────────────────────────────
        if country and indicator:
            relationships.append([country, "HAS_INDICATOR", indicator])

        if country and source:
            relationships.append([country, "REPORTED_BY", source])

        if indicator and source:
            relationships.append([indicator, "PUBLISHED_BY", source])

        if country and ind_key:
            for concept in INDICATOR_CONCEPTS.get(ind_key, [])[:2]:
                relationships.append([indicator or ind_key, "MEASURES", concept])

        if country and country in COUNTRY_REGION:
            for region in COUNTRY_REGION[country][:2]:
                relationships.append([country, "BELONGS_TO", region])

        # Cross-indicator economic relationships (well-known macro links)
        known_links = [
            ("Inflation", "AFFECTS", "economic growth"),
            ("Inflation", "INFLUENCES", "Federal Funds Rate"),
            ("Federal Funds Rate", "AFFECTS", "GDP"),
            ("Unemployment", "CORRELATES_WITH", "GDP"),
            ("Trade", "CONTRIBUTES_TO", "GDP"),
            ("GDP per capita", "MEASURES", "living standards"),
            ("Exchange rate", "AFFECTS", "Trade"),
        ]
        for subj, rel, obj in known_links:
            if subj.lower() in (indicator or "").lower():
                relationships.append([subj, rel, obj])
                entities["EconomicConcept"].add(obj)

        valid_rels = [[s, r, o] for s, r, o in relationships if s and r and o]
        return {
            "entities": {k: list(v) for k, v in entities.items() if v},
            "relationships": valid_rels,
        }

    # ------------------------------------------------------------------
    def extract_with_llm(self, chunk_content: str) -> Dict[str, Any]:
        prompt = (
            "From the following economic text, extract entities and relationships.\n\n"
            "Respond ONLY with a valid JSON object with exactly two keys:\n"
            '- "entities": a dict where keys are one of ["Indicator","EconomicConcept",'
            '"Country","Institution","Report","Source","Forecast","Region"] and values are lists of strings.\n'
            '- "relationships": a list of 3-element lists [subject, relationship_type, object].\n'
            "  Allowed relationship_types: HAS_INDICATOR, CORRELATES_WITH, AFFECTS, PUBLISHED_BY, "
            "REPORTED_IN, BELONGS_TO, FORECASTS, DERIVED_FROM, HAS_TREND, INFLUENCES, MEASURES.\n\n"
            f'Text (first 1200 chars): "{chunk_content[:1200]}"\n\n'
            "Example:\n"
            '{"entities": {"Indicator": ["GDP"], "Country": ["United States"]}, '
            '"relationships": [["United States", "HAS_INDICATOR", "GDP"]]}'
        )
        try:
            response = self.llm_client.generate(prompt, format="json")
            if "error" in response or "response" not in response:
                return {"entities": {}, "relationships": []}
            result = parse_json_object(response["response"])
            if "entities" not in result or "relationships" not in result:
                return {"entities": {}, "relationships": []}
            return result
        except (LLMJSONParseError, Exception):
            return {"entities": {}, "relationships": []}

    # ------------------------------------------------------------------
    def extract_all(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combines rule-based + spaCy NER + LLM extraction.
        """
        content = chunk.get("content", "")

        # 1. Rule-based (always runs)
        rule_data = self._rule_based_from_metadata(chunk)

        # 2. spaCy NER
        spacy_ents = self.extract_entities_spacy(content)

        # 3. LLM (best-effort, don't block on failure)
        llm_data: Dict[str, Any] = {"entities": {}, "relationships": []}
        try:
            llm_data = self.extract_with_llm(content)
        except Exception:
            pass

        # ── Merge all sources ──────────────────────────────────────────────
        all_entities: Dict[str, Set[str]] = {
            "Country": set(), "Institution": set(), "Indicator": set(),
            "EconomicConcept": set(), "Report": set(), "Source": set(),
            "Forecast": set(), "Region": set(),
        }
        all_relationships: List[List[str]] = list(rule_data.get("relationships", []))

        # Rule-based entities
        for etype, elist in rule_data.get("entities", {}).items():
            if etype in all_entities:
                all_entities[etype].update(elist)

        # spaCy entities
        for k, v in spacy_ents.items():
            if k in all_entities:
                all_entities[k].update(v)

        # LLM entities and relationships
        for etype, elist in llm_data.get("entities", {}).items():
            if etype in all_entities and isinstance(elist, list):
                all_entities[etype].update(str(e) for e in elist)
        for r in llm_data.get("relationships", []):
            if isinstance(r, list) and len(r) == 3 and all(isinstance(x, str) for x in r):
                all_relationships.append(r)

        # Deduplicate relationships
        seen = set()
        unique_rels: List[List[str]] = []
        for r in all_relationships:
            key = tuple(r)
            if key not in seen:
                seen.add(key)
                unique_rels.append(r)

        return {
            "entities": {k: list(v) for k, v in all_entities.items() if v},
            "relationships": unique_rels,
        }
