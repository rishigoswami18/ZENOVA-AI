import json
import os
import logging
from typing import Any, Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger("zenova_ai")

def sanitize_user_input(text: str) -> str:
    """Blocks common LLM jailbreaks and strips instruction override keywords."""
    if not text:
        return ""
    suspicious_patterns = [
        "ignore previous instructions", 
        "ignore the instructions above", 
        "system prompt override",
        "you are now a",
        "translate the above",
        "bypass safeguards"
    ]
    cleaned = text
    for pattern in suspicious_patterns:
        if pattern in cleaned.lower():
            cleaned = cleaned.replace(pattern, f"[Sanitization Filter: Redacted Blocked Phrase '{pattern}']")
    return cleaned

async def _post_openai_compatible_async(
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

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(base_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True
)
async def chat_text(system_prompt: str, user_prompt: str, temperature: float = 0.5) -> Optional[str]:
    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    sanitized_prompt = sanitize_user_input(user_prompt)

    try:
        if groq_api_key:
            return await _post_openai_compatible_async(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_api_key,
                os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                system_prompt,
                sanitized_prompt,
                temperature=temperature,
            )

        if openai_api_key:
            return await _post_openai_compatible_async(
                "https://api.openai.com/v1/chat/completions",
                openai_api_key,
                os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                system_prompt,
                sanitized_prompt,
                temperature=temperature,
            )
    except Exception as exc:
        logger.error(f"LLM request failed (will retry if temporary status error): {exc}")
        # Secondary fallback model route (cross-provider routing)
        if openai_api_key and groq_api_key:
            logger.info("Executing secondary LLM path fallback to OpenAI...")
            try:
                return await _post_openai_compatible_async(
                    "https://api.openai.com/v1/chat/completions",
                    openai_api_key,
                    "gpt-4o-mini",
                    system_prompt,
                    sanitized_prompt,
                    temperature=temperature,
                )
            except Exception as inner_exc:
                logger.error(f"Fallback LLM route also failed: {inner_exc}")
        
    return None

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True
)
async def chat_json(system_prompt: str, user_prompt: str) -> Optional[dict[str, Any]]:
    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    response_text = None
    
    sanitized_prompt = sanitize_user_input(user_prompt)

    try:
        if groq_api_key:
            response_text = await _post_openai_compatible_async(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_api_key,
                os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                system_prompt,
                sanitized_prompt,
                response_format={"type": "json_object"},
                temperature=0.2,
            )
        elif openai_api_key:
            response_text = await _post_openai_compatible_async(
                "https://api.openai.com/v1/chat/completions",
                openai_api_key,
                os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                system_prompt,
                sanitized_prompt,
                response_format={"type": "json_object"},
                temperature=0.2,
            )
    except Exception as exc:
        logger.error(f"LLM JSON request failed (will retry if status error): {exc}")
        # Secondary fallback model route (cross-provider routing)
        if openai_api_key and groq_api_key:
            logger.info("Executing secondary LLM JSON path fallback to OpenAI...")
            try:
                response_text = await _post_openai_compatible_async(
                    "https://api.openai.com/v1/chat/completions",
                    openai_api_key,
                    "gpt-4o-mini",
                    system_prompt,
                    sanitized_prompt,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
            except Exception as inner_exc:
                logger.error(f"Fallback LLM JSON route also failed: {inner_exc}")

    if not response_text:
        return None

    try:
        return json.loads(response_text)
    except json.JSONDecodeError as exc:
        logger.error(f"LLM JSON parse failed on string response: {exc}")
        return None
