import logging
import os
import re
from pathlib import Path

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN")
EXTENSION_ORIGIN = os.environ.get("EXTENSION_ORIGIN", "")
MODEL = os.environ.get("MODEL", "anthropic/claude-sonnet-4.6")

# Startup assertions: fail fast if required env vars are missing
assert OPENROUTER_API_KEY, "OPENROUTER_API_KEY is required"
assert ALLOWED_ORIGIN, "ALLOWED_ORIGIN is required"

limiter = Limiter(key_func=get_remote_address)

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "v5.md"
assert _PROMPT_PATH.exists(), f"Prompt file missing: {_PROMPT_PATH}"
SYSTEM_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")
assert SYSTEM_PROMPT.strip(), "Prompt file is empty"

app = FastAPI()
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": (
                "Päiväkohtainen raja täynnä (5 muunnosta vuorokaudessa). "
                "Jos haluat käyttää palvelua enemmän, ota yhteyttä: "
                "https://pekkasetala.carrd.co/"
            )
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Virheellinen pyyntö"},
    )

_origins = [ALLOWED_ORIGIN]
if EXTENSION_ORIGIN:
    _origins.append(EXTENSION_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class TranslateRequest(BaseModel):
    text: str


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}


@app.post("/api/translate")
@limiter.limit("5/day")
async def translate(request: Request, body: TranslateRequest):
    text = body.text

    if not text or not text.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Teksti ei voi olla tyhjä"},
        )

    if len(text) > 2500:
        return JSONResponse(
            status_code=400,
            content={"error": "Teksti on liian pitkä"},
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://selkokielelle.fi",
        "X-Title": "selkokielelle.fi",
    }

    # Observed OpenRouter usage schema for anthropic/claude-sonnet-4.6 (verified 2026-04-23):
    #   cache reads   -> usage.prompt_tokens_details.cached_tokens
    #   cache writes  -> usage.prompt_tokens_details.cache_write_tokens
    #   per-call cost -> usage.cost (USD)
    payload = {
        "model": MODEL,
        "temperature": 0.2,
        "max_tokens": 2500,
        "messages": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
            },
            {"role": "user", "content": f"<teksti>{text}</teksti>"},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
    except httpx.TimeoutException:
        logger.error("OpenRouter timeout for request from %s", request.client.host)
        return JSONResponse(
            status_code=504,
            content={"error": "Palvelu ei vastaa juuri nyt, yritä uudelleen"},
        )

    if response.status_code != 200:
        logger.error("OpenRouter returned %s: %s", response.status_code, response.text[:200])
        return JSONResponse(
            status_code=502,
            content={"error": "Jokin meni pieleen, yritä uudelleen"},
        )

    try:
        data = response.json()
        choice = data["choices"][0]
        result = choice["message"]["content"]
        # Security: strip any HTML tags from LLM output (defense-in-depth)
        result = re.sub(r'<[^>]+>', '', result)
    except (KeyError, IndexError, ValueError) as e:
        logger.error("Failed to parse OpenRouter response: %s | body: %s", e, response.text[:200])
        return JSONResponse(
            status_code=502,
            content={"error": "Jokin meni pieleen, yritä uudelleen"},
        )

    if choice.get("finish_reason") == "length":
        logger.warning("finish_reason=length for text of %d chars", len(text))
        return JSONResponse(
            status_code=502,
            content={"error": "Teksti on liian pitkä muunnettavaksi kerralla. Kokeile lyhyempää tekstiä."},
        )

    usage = data.get("usage") or {}
    prompt_details = usage.get("prompt_tokens_details") or {}
    cached = prompt_details.get("cached_tokens", 0)
    wrote = prompt_details.get("cache_write_tokens", 0)
    cost = usage.get("cost")
    if cost is not None:
        logger.info("translate cached=%s wrote=%s cost=$%.5f", cached, wrote, cost)
    else:
        logger.info("translate cached=%s wrote=%s", cached, wrote)

    return {"result": result}
