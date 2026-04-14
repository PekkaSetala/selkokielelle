import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from main import app, limiter

client = TestClient(app)

OR_URL = "https://openrouter.ai/api/v1/chat/completions"


def _ok_response(content: str = "Selkoteksti.", finish_reason: str = "stop"):
    return httpx.Response(
        200,
        json={
            "choices": [
                {
                    "message": {"content": content},
                    "finish_reason": finish_reason,
                }
            ]
        },
    )


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset slowapi storage between tests so the per-IP day quota is fresh."""
    storage = getattr(limiter, "_storage", None)
    if storage is None:
        limiter_storage = limiter.limiter.storage  # type: ignore[attr-defined]
    else:
        limiter_storage = storage
    if hasattr(limiter_storage, "storage") and hasattr(limiter_storage.storage, "clear"):
        limiter_storage.storage.clear()
    elif hasattr(limiter_storage, "reset"):
        limiter_storage.reset()
    yield


@respx.mock
def test_translate_success():
    respx.post(OR_URL).mock(return_value=_ok_response("Tämä on selkoa."))
    r = client.post("/api/translate", json={"text": "Vaikea teksti."})
    assert r.status_code == 200
    assert r.json() == {"result": "Tämä on selkoa."}


def test_empty_text():
    r = client.post("/api/translate", json={"text": ""})
    assert r.status_code == 400
    assert "tyhjä" in r.json()["error"]


def test_whitespace_only_text():
    r = client.post("/api/translate", json={"text": "   \n\t  "})
    assert r.status_code == 400


def test_text_over_limit_rejected():
    r = client.post("/api/translate", json={"text": "a" * 2501})
    assert r.status_code == 400
    assert "liian pitkä" in r.json()["error"]


@respx.mock
def test_text_at_limit_accepted():
    respx.post(OR_URL).mock(return_value=_ok_response("ok"))
    r = client.post("/api/translate", json={"text": "a" * 2500})
    assert r.status_code == 200


def test_missing_field_returns_400():
    r = client.post("/api/translate", json={})
    assert r.status_code == 400


@respx.mock
def test_openrouter_timeout_returns_504():
    respx.post(OR_URL).mock(side_effect=httpx.TimeoutException("timeout"))
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 504


@respx.mock
def test_openrouter_5xx_returns_502():
    respx.post(OR_URL).mock(return_value=httpx.Response(500, text="upstream"))
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 502


@respx.mock
def test_openrouter_malformed_response_returns_502():
    respx.post(OR_URL).mock(return_value=httpx.Response(200, json={"unexpected": True}))
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 502


@respx.mock
def test_finish_reason_length_returns_502():
    respx.post(OR_URL).mock(
        return_value=_ok_response("Katkeaa", finish_reason="length")
    )
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 502
    assert "liian pitkä" in r.json()["error"]


@respx.mock
def test_html_tags_stripped_from_output():
    respx.post(OR_URL).mock(
        return_value=_ok_response("hyvä <script>alert(1)</script> teksti")
    )
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 200
    body = r.json()["result"]
    assert "<script>" not in body
    assert "</script>" not in body
    assert "alert(1)" in body  # text content preserved, only tags removed


@respx.mock
def test_rate_limit_blocks_sixth_request_and_message_contains_contact():
    respx.post(OR_URL).mock(return_value=_ok_response("ok"))
    for _ in range(5):
        r = client.post("/api/translate", json={"text": "Vaikea."})
        assert r.status_code == 200, f"unexpected pre-limit status: {r.status_code}"
    r = client.post("/api/translate", json={"text": "Vaikea."})
    assert r.status_code == 429
    err = r.json()["error"]
    assert "pekkasetala.carrd.co" in err
    assert "5" in err


def test_health_endpoint():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
