# economic_graphrag/llm/llm_factory.py
import os
from typing import Any, Dict


def get_llm_client():
    """
    Returns the best available LLM client.
    Prefers Gemini if GEMINI_API_KEY is set, otherwise OpenRouter.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    if gemini_key:
        from economic_graphrag.llm.gemini_client import GeminiClient
        return GeminiClient()
    elif openrouter_key:
        from economic_graphrag.llm.openrouter_client import OpenRouterClient
        return OpenRouterClient()
    else:
        raise RuntimeError("No LLM API key configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.")


class FallbackLLMClient:
    """
    Tries Gemini first, falls back to OpenRouter.
    """

    def __init__(self):
        self._clients = []
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if gemini_key:
            from economic_graphrag.llm.gemini_client import GeminiClient
            self._clients.append(GeminiClient())
        if openrouter_key:
            from economic_graphrag.llm.openrouter_client import OpenRouterClient
            self._clients.append(OpenRouterClient())
        if not self._clients:
            raise RuntimeError("No LLM API key configured.")

    def generate(self, prompt: str, format: str = "json") -> Dict[str, Any]:
        for client in self._clients:
            result = client.generate(prompt, format=format)
            if "error" not in result:
                return result
            print(f"LLM client {type(client).__name__} failed: {result.get('error')}")
        return {"error": "All LLM clients failed"}
