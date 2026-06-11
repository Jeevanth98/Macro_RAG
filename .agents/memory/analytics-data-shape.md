---
name: Analytics data shape
description: Structure of ingested data, chunk fields, and graph internals
---

## Chunk fields
document_id, title, source, content, publication_date, country, indicator, chunk_id, page

## Coverage
- 221 chunks, 18 G20 countries, 7 indicators
- Countries use World Bank naming: "Korea, Rep.", "Turkiye" (not South Korea / Turkey)
- Content has `year  value` rows with scientific notation (e.g. `1.695855e+12`)
- GDP values need /1e12 scaling for Trillion USD display

## Knowledge graph
- `nx_graph._graph` is the internal NetworkX MultiDiGraph (attr is `_graph`, not `_g`)
- Edge data uses `type` key for relationship type (not `relation`)
- Node `label` field = node type (Country, Indicator, EconomicConcept, Region, Source, Institution, Report)
- 220 nodes, 198 edges; most "Institution" nodes are raw numeric values (parsing artifact)

## Analytics modules (added)
- `economic_graphrag/analytics/data_processor.py` — build_tidy_df, forecast_series, detect_trend, etc.
- `economic_graphrag/viz/advanced_charts.py` — choropleth, correlation heatmap, scatter, forecast, radar
