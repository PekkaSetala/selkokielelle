import json

import httpx
import respx
from fastapi.testclient import TestClient

from main import app, SYSTEM_PROMPT, limiter

OR_URL = "https://openrouter.ai/api/v1/chat/completions"


@respx.mock
def test_payload_has_cache_control():
    storage = getattr(limiter, "_storage", None) or limiter.limiter.storage  # type: ignore[attr-defined]
    if hasattr(storage, "storage") and hasattr(storage.storage, "clear"):
        storage.storage.clear()
    elif hasattr(storage, "reset"):
        storage.reset()

    route = respx.post(OR_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {"content": "selkokieli-tulos"},
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "prompt_tokens_details": {
                        "cached_tokens": 0,
                        "cache_write_tokens": 0,
                    },
                    "cost": 0.001,
                },
            },
        )
    )

    client = TestClient(app)
    resp = client.post("/api/translate", json={"text": "Testiteksti."})
    assert resp.status_code == 200

    sent = json.loads(route.calls.last.request.content)
    system_content = sent["messages"][0]["content"]
    assert isinstance(system_content, list)
    assert system_content[0]["type"] == "text"
    assert system_content[0]["text"] == SYSTEM_PROMPT
    assert system_content[0]["cache_control"] == {"type": "ephemeral"}
