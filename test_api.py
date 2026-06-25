import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv("backend-fastapi/.env")

async def test_llm():
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base_url = "https://api.openai.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, testing API connection."},
        ],
    }
    
    print(f"Testing OpenAI with key... {api_key[:10]}...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            print("Response:", response.json()["choices"][0]["message"]["content"])
            print("API CONNECTION SUCCESSFUL")
        except Exception as e:
            print("API CONNECTION FAILED:", str(e))

if __name__ == "__main__":
    asyncio.run(test_llm())
