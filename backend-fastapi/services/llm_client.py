import json
import os
from typing import Any, Optional

import requests


def _post_openai_compatible(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    response_format: Optional[dict[str, Any]] = None,
    temperature: float = 0.3,
) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if response_format:
        payload["response_format"] = response_format

    response = requests.post(base_url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def chat_text(system_prompt: str, user_prompt: str, temperature: float = 0.5) -> Optional[str]:
    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    try:
        if groq_api_key:
            return _post_openai_compatible(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_api_key,
                os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                system_prompt,
                user_prompt,
                temperature=temperature,
            )

        if openai_api_key:
            return _post_openai_compatible(
                "https://api.openai.com/v1/chat/completions",
                openai_api_key,
                os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                system_prompt,
                user_prompt,
                temperature=temperature,
            )
    except Exception as exc:
        print(f"LLM text request failed: {exc}")

    return None


def chat_json(system_prompt: str, user_prompt: str) -> Optional[dict[str, Any]]:
    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    response_text = None

    try:
        if groq_api_key:
            response_text = _post_openai_compatible(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_api_key,
                os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                system_prompt,
                user_prompt,
                response_format={"type": "json_object"},
                temperature=0.2,
            )
        elif openai_api_key:
            response_text = _post_openai_compatible(
                "https://api.openai.com/v1/chat/completions",
                openai_api_key,
                os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                system_prompt,
                user_prompt,
                response_format={"type": "json_object"},
                temperature=0.2,
            )
    except Exception as exc:
        print(f"LLM JSON request failed: {exc}")
        return None

    if not response_text:
        return None

    try:
        return json.loads(response_text)
    except json.JSONDecodeError as exc:
        print(f"LLM JSON parse failed: {exc}")
        return None
