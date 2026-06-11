---
name: OpenRouter free models (verified 2025-06)
description: Which OpenRouter free models work vs return 404/429
---
## Working (verified):
- google/gemma-4-31b-it:free ✅ (primary)
- google/gemma-4-26b-a4b-it:free ✅
- openai/gpt-oss-120b:free ✅
- nvidia/nemotron-3-super-120b-a12b:free ✅

## Rate-limited (429, retry later):
- moonshotai/kimi-k2.6:free (429 upstream rate limit)

## Dead (404, removed):
- deepseek/deepseek-r1-0528:free, meta-llama/llama-4-scout:free, google/gemma-3-27b-it:free, microsoft/phi-4-reasoning:free, deepseek/deepseek-chat-v3-0324:free

**Why:** OpenRouter free model availability changes frequently. Verify via GET /api/v1/models (pricing.completion == "0").
**How to apply:** Always put gemma-4-31b-it:free first in FREE_MODELS list.
