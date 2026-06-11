# economic_graphrag/llm/openrouter_client.py
import os
from typing import Any, Dict

import requests

from economic_graphrag.llm.json_utils import _strip_json_fences

FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-nano-9b-v2:free",
]


class OpenRouterClient:
    """
    Client for OpenRouter API (free models).
    """

    ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not self.api_key:
            print("WARNING: OPENROUTER_API_KEY is not set.")

    def generate(self, prompt: str, format: str = "json") -> Dict[str, Any]:
        if not self.api_key:
            return {"error": "OPENROUTER_API_KEY not configured"}

        system = (
            "You are a helpful macroeconomic expert. "
            + ("Always respond with valid JSON only, no extra text." if format == "json" else "")
        )

        for model in FREE_MODELS:
            try:
                response = requests.post(
                    self.ENDPOINT,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://replit.com",
                        "X-Title": "Economic GraphRAG",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.1,
                    },
                    timeout=45,
                )
            except requests.exceptions.RequestException as exc:
                print(f"OpenRouter request error ({model}): {exc}")
                continue

            if response.status_code != 200:
                err = response.text[:200]
                print(f"OpenRouter {model} error {response.status_code}: {err}")
                continue

            try:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if format == "json":
                    content = _strip_json_fences(content)
                return {"response": content}
            except (KeyError, IndexError, ValueError) as exc:
                print(f"OpenRouter parse error ({model}): {exc}")
                continue

        return {"error": "All OpenRouter models failed"}
