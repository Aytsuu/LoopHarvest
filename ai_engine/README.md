# LoopHarvest AI Engine

Base local AI API stack for LoopHarvest using FastAPI, Ollama, and Docker Compose.

## Structure

```text
ai_engine/
  docker-compose.yml
  gateway/
    Dockerfile
    requirements.txt
    pyproject.toml
    .env.example
    src/
    tests/
  ollama/
    models/
```

## Quick start

1. Copy `gateway/.env.example` to `gateway/.env` and set `MY_API_KEY`.
2. Run `docker compose up -d` from `ai_engine/`.
3. Pull a model with `docker exec loopharvest-ollama ollama pull qwen2.5:1.5b`.
4. Call `GET /health`, `GET /models`, or `POST /v1/chat` on `http://localhost:8001`.
