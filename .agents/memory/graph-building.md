---
name: Graph building strategy
description: How to build a rich knowledge graph without LLM rate limits
---
## Rule: Use use_llm=False for graph building
LLM-based entity extraction (calling Gemini/OpenRouter for each chunk) hammers rate limits
and times out. Rule-based extraction from document metadata produces a richer, more reliable graph.

## Results (221 chunks → 220 nodes, 198 edges):
Rule-based extracts: country→HAS_INDICATOR→indicator, country→BELONGS_TO→region,
indicator→MEASURES→concept, indicator→PUBLISHED_BY→source, plus 7 known macro relationships
(Inflation→AFFECTS→economic growth, etc.)

## How to apply
- GraphBuilder.build_graph_from_chunks(chunks, use_llm=False) — always pass use_llm=False
- EntityExtractor._rule_based_from_metadata(chunk) uses country/indicator/source metadata fields
- COUNTRY_REGION dict maps each G20 country to its blocs (G7, G20, EU, BRICS, etc.)
