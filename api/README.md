# LoopHarvest API

FastAPI backend scaffold for the LoopHarvest MVP.

## Run

```bash
pip install -e .[dev]
uvicorn src.main:app --reload
```

Create `api/.env` for local backend runtime. Required keys are documented in `.env.example`.

## Test

```bash
pytest
```
