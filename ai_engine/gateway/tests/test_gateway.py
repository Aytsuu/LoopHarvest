import httpx


class StubOllamaClient:
    def __init__(
        self,
        *,
        post_responses: list[httpx.Response] | None = None,
        get_responses: dict[str, httpx.Response] | None = None,
    ) -> None:
        self._post_responses = post_responses or []
        self._get_responses = get_responses or {}
        self.post_calls: list[dict] = []
        self.get_calls: list[str] = []

    async def post(self, path: str, json: dict) -> httpx.Response:
        self.post_calls.append({"path": path, "json": json})
        return self._post_responses[len(self.post_calls) - 1]

    async def get(self, path: str) -> httpx.Response:
        self.get_calls.append(path)
        return self._get_responses[path]


def build_response(method: str, url: str, status_code: int, payload: dict) -> httpx.Response:
    return httpx.Response(
        status_code=status_code,
        json=payload,
        request=httpx.Request(method, url),
    )


async def test_health_returns_gateway_status(client) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "1.0.0"}


async def test_models_proxies_ollama_tags(client) -> None:
    stub_client = StubOllamaClient(
        get_responses={
            "/api/tags": build_response(
                "GET",
                "http://ollama.test/api/tags",
                200,
                {"models": [{"name": "qwen2.5:1.5b"}, {"name": "gemma3:4b"}]},
            )
        }
    )
    client._transport.app.state.ollama_client = stub_client

    response = await client.get("/models")

    assert response.status_code == 200
    assert response.json() == {"models": [{"name": "qwen2.5:1.5b"}, {"name": "gemma3:4b"}]}
    assert stub_client.get_calls == ["/api/tags"]


async def test_chat_uses_fallback_model_when_default_model_fails(client) -> None:
    stub_client = StubOllamaClient(
        post_responses=[
            build_response("POST", "http://ollama.test/api/chat", 404, {"error": "model not found"}),
            build_response(
                "POST",
                "http://ollama.test/api/chat",
                200,
                {"model": "gemma3:4b", "message": {"content": "fallback ok"}},
            ),
        ]
    )
    client._transport.app.state.ollama_client = stub_client

    response = await client.post(
        "/v1/chat",
        headers={"x-api-key": "test-secret"},
        json={"messages": [{"role": "user", "content": "hello"}]},
    )

    assert response.status_code == 200
    assert response.json() == {"model": "gemma3:4b", "content": "fallback ok"}
    assert [call["json"]["model"] for call in stub_client.post_calls] == ["qwen2.5:1.5b", "gemma3:4b"]


async def test_chat_returns_upstream_error_for_explicit_model_without_fallback(client) -> None:
    stub_client = StubOllamaClient(
        post_responses=[
            build_response("POST", "http://ollama.test/api/chat", 404, {"error": "model not found"})
        ]
    )
    client._transport.app.state.ollama_client = stub_client

    response = await client.post(
        "/v1/chat",
        headers={"x-api-key": "test-secret"},
        json={
            "model": "custom-model",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": {"error": "model not found"}}
    assert len(stub_client.post_calls) == 1
    assert stub_client.post_calls[0]["json"]["model"] == "custom-model"


async def test_chat_rejects_invalid_api_key(client) -> None:
    response = await client.post(
        "/v1/chat",
        headers={"x-api-key": "wrong-key"},
        json={"messages": [{"role": "user", "content": "hello"}]},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthorized"


async def test_vision_uses_fallback_model_when_primary_fails(client) -> None:
    stub_client = StubOllamaClient(
        post_responses=[
            build_response("POST", "http://ollama.test/api/chat", 503, {"error": "temporary outage"}),
            build_response(
                "POST",
                "http://ollama.test/api/chat",
                200,
                {"model": "gemma3:4b", "message": {"content": "vision fallback ok"}},
            ),
        ]
    )
    client._transport.app.state.ollama_client = stub_client

    response = await client.post(
        "/v1/vision",
        headers={"x-api-key": "test-secret"},
        json={
            "prompt": "describe image",
            "images": [{"source": "data:image/png;base64,aGVsbG8="}],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "model": "gemma3:4b",
        "content": "vision fallback ok",
        "images_processed": 1,
    }
    assert [call["json"]["model"] for call in stub_client.post_calls] == ["qwen2.5vl:3b", "gemma3:4b"]
