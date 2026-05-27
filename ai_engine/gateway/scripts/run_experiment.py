"""
Module: run_experiment.py
Purpose: Experimental runner to test and validate gateway endpoints
Layer: Testing/Validation

This script runs the implemented gateway layers and prints the output to console
for manual validation.

Supported Layers:
- Layer 0: Health + Models endpoint validation
- Layer 1: Chat + Vision endpoint validation (includes Layer 0)

Usage:
    python run_experiment.py --layer 0  # Test Layer 0 only
    python run_experiment.py --layer 1  # Test Layer 1 (includes Layer 0)
    python run_experiment.py            # Default: Layer 0
"""

import argparse
import asyncio
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ExperimentSettings:
    """Configuration required to run the gateway experiments."""

    base_url: str
    api_key: str
    google_ai_studio_api_key: str
    timeout_seconds: float
    sample_image_path: Path
    chat_prompt: str
    vision_prompt: str


class ExperimentRunner:
    """Runs manual validation experiments against the AI gateway."""

    def __init__(self, layer: int = 0, timeout_seconds: float = 120.0) -> None:
        self.layer = layer
        self.timeout_seconds = timeout_seconds
        self.settings = self._load_settings(timeout_seconds=timeout_seconds)
        self.client: httpx.AsyncClient | None = None
        self.successful_checks = 0
        self.failed_checks = 0

    def _load_settings(self, *, timeout_seconds: float) -> ExperimentSettings:
        script_dir = Path(__file__).resolve().parent
        gateway_dir = script_dir.parent
        env_path = gateway_dir / ".env"

        env_values = self._read_env_file(env_path)
        api_key = os.getenv("MY_API_KEY") or env_values.get("MY_API_KEY", "")
        if not api_key:
            raise ValueError(
                f"Missing MY_API_KEY. Set it in the environment or in {env_path}."
            )

        sample_image_path = script_dir / "data" / "spent_grain.jpg"
        if not sample_image_path.exists():
            raise FileNotFoundError(f"Sample image not found: {sample_image_path}")

        return ExperimentSettings(
            base_url=os.getenv("GATEWAY_BASE_URL", "http://localhost:8001"),
            api_key=api_key,
            google_ai_studio_api_key=(
                os.getenv("GOOGLE_AI_STUDIO_API_KEY")
                or os.getenv("GEMINI_API_KEY")
                or env_values.get("GOOGLE_AI_STUDIO_API_KEY", "")
                or env_values.get("GEMINI_API_KEY", "")
            ),
            timeout_seconds=timeout_seconds,
            sample_image_path=sample_image_path,
            chat_prompt=os.getenv(
                "EXPERIMENT_CHAT_PROMPT",
                "Give a concise health check response for this experiment.",
            ),
            vision_prompt=os.getenv(
                "EXPERIMENT_VISION_PROMPT",
                (
                    "Classify the waste shown in the image. "
                    "Choose exactly one label from this list: "
                    "vegetable scraps, fruit waste, mixed food scraps, spent grain, "
                    "coffee grounds, surplus meal, unclear. "
                    "Rules: return only the label. No explanation. No punctuation. "
                    "If more than one waste type is visible, return mixed food scraps. "
                    "If the image is too unclear to classify confidently, return unclear."
                ),
            ),
        )

    def _read_env_file(self, env_path: Path) -> dict[str, str]:
        if not env_path.exists():
            return {}

        env_values: dict[str, str] = {}
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            env_values[key.strip()] = value.strip()

        return env_values

    async def setup(self) -> None:
        """Initialize the HTTP client and verify local assets."""
        logger.info("=" * 80)
        logger.info("EXPERIMENT SETUP")
        logger.info("=" * 80)

        self.client = httpx.AsyncClient(
            base_url=self.settings.base_url,
            timeout=self.settings.timeout_seconds,
        )

        logger.info("Data and endpoint configuration")
        logger.info("  - Gateway base URL: %s", self.settings.base_url)
        logger.info("  - Testing layer: %s", self.layer)
        logger.info("  - Request timeout: %.1f seconds", self.settings.timeout_seconds)
        logger.info("  - Sample image: %s", self.settings.sample_image_path)
        if self.layer == 1:
            if self.settings.google_ai_studio_api_key:
                logger.info("  - Vision provider credentials: configured")
            else:
                logger.warning("  - Vision provider credentials: missing")
                logger.warning(
                    "    Set GOOGLE_AI_STUDIO_API_KEY or GEMINI_API_KEY in the environment or gateway .env before running Layer 1."
                )
        logger.info("")

    async def close(self) -> None:
        """Close the HTTP client if it was created."""
        if self.client is not None:
            await self.client.aclose()

    async def run_layer0_experiment(self) -> None:
        """Run Layer 0 experiment: health and models endpoint validation."""
        logger.info("=" * 80)
        logger.info("LAYER 0 EXPERIMENT: HEALTH + MODELS VALIDATION")
        logger.info("=" * 80)
        logger.info("")

        health_response = await self._run_check(
            name="GET /health",
            method="GET",
            path="/health",
        )
        if health_response is not None:
            self._print_response("Health response", health_response)

        models_response = await self._run_check(
            name="GET /models",
            method="GET",
            path="/models",
        )
        if models_response is not None:
            self._print_response("Models response", models_response)

        self._print_layer0_summary()

    async def run_layer1_experiment(self) -> None:
        """Run Layer 1 experiment: Layer 0 plus chat and vision requests."""
        logger.info("=" * 80)
        logger.info("LAYER 1 EXPERIMENT: HEALTH + MODELS + CHAT + VISION")
        logger.info("=" * 80)
        logger.info("")

        await self.run_layer0_experiment()

        chat_payload = {
            "messages": [
                {
                    "role": "user",
                    "content": self.settings.chat_prompt,
                }
            ]
        }
        chat_response = await self._run_check(
            name="POST /v1/chat",
            method="POST",
            path="/v1/chat",
            json_body=chat_payload,
            include_api_key=True,
        )
        if chat_response is not None:
            self._print_response("Chat response", chat_response)

        vision_payload = {
            "prompt": self.settings.vision_prompt,
            "temperature": 0.0,
            "max_tokens": 256,
            "images": [
                {
                    "source": str(self.settings.sample_image_path),
                }
            ],
        }
        vision_response = await self._run_check(
            name="POST /v1/vision",
            method="POST",
            path="/v1/vision",
            json_body=vision_payload,
            include_api_key=True,
        )
        if vision_response is not None:
            self._print_response("Vision response", vision_response)

        self._print_layer1_summary()

    async def _run_check(
        self,
        *,
        name: str,
        method: str,
        path: str,
        json_body: dict[str, Any] | None = None,
        include_api_key: bool = False,
    ) -> dict[str, Any] | None:
        """Run a single HTTP check and log the result."""
        if self.client is None:
            raise RuntimeError("Experiment client has not been initialized.")

        logger.info("-" * 80)
        logger.info("%s", name)
        logger.info("-" * 80)

        headers: dict[str, str] = {}
        if include_api_key:
            headers["x-api-key"] = self.settings.api_key

        try:
            response = await self.client.request(
                method=method,
                url=path,
                headers=headers,
                json=json_body,
            )
        except httpx.TimeoutException as exc:
            self.failed_checks += 1
            logger.error(
                "Request timed out after %.1f seconds for %s %s (%s)",
                self.settings.timeout_seconds,
                method,
                path,
                exc.__class__.__name__,
            )
            logger.error("Timeout details: %r", exc)
            if json_body is not None:
                logger.error(
                    "Request payload: %s",
                    json.dumps(json_body, indent=2, default=str),
                )
            logger.info("")
            return None
        except httpx.HTTPError as exc:
            self.failed_checks += 1
            logger.error(
                "Request failed for %s %s (%s): %r",
                method,
                path,
                exc.__class__.__name__,
                exc,
            )
            if json_body is not None:
                logger.error(
                    "Request payload: %s",
                    json.dumps(json_body, indent=2, default=str),
                )
            logger.info("")
            return None
        except Exception as exc:
            self.failed_checks += 1
            logger.error(
                "Unexpected request failure for %s %s (%s): %r",
                method,
                path,
                exc.__class__.__name__,
                exc,
                exc_info=True,
            )
            if json_body is not None:
                logger.error(
                    "Request payload: %s",
                    json.dumps(json_body, indent=2, default=str),
                )
            logger.info("")
            return None

        parsed_response = self._parse_response(response)
        if response.is_success:
            self.successful_checks += 1
            logger.info("Status: %s", response.status_code)
        else:
            self.failed_checks += 1
            logger.error("Status: %s", response.status_code)

        logger.info("")
        return parsed_response

    def _parse_response(self, response: httpx.Response) -> dict[str, Any]:
        try:
            payload = response.json()
        except ValueError:
            return {
                "status_code": response.status_code,
                "text": response.text,
            }

        if isinstance(payload, dict):
            return payload

        return {
            "status_code": response.status_code,
            "payload": payload,
        }

    def _print_response(self, label: str, payload: dict[str, Any]) -> None:
        logger.info("%s:", label)
        logger.info("%s", json.dumps(payload, indent=2, default=str))
        logger.info("")

    def _print_layer0_summary(self) -> None:
        logger.info("=" * 80)
        logger.info("LAYER 0 EXPERIMENT SUMMARY")
        logger.info("=" * 80)
        logger.info("Successful checks: %s", self.successful_checks)
        logger.info("Failed checks: %s", self.failed_checks)
        logger.info("Notes:")
        logger.info("  - Layer 0 validates basic gateway reachability and upstream model listing.")
        logger.info("  - /models depends on the upstream Ollama service being available.")
        logger.info("")

    def _print_layer1_summary(self) -> None:
        logger.info("=" * 80)
        logger.info("LAYER 1 EXPERIMENT SUMMARY")
        logger.info("=" * 80)
        logger.info("Successful checks: %s", self.successful_checks)
        logger.info("Failed checks: %s", self.failed_checks)
        logger.info("Notes:")
        logger.info("  - Layer 1 validates authenticated chat and vision flows.")
        logger.info("  - Vision uses the local sample image shipped in scripts/data.")
        logger.info("  - Chat uses the configured local text model via the gateway.")
        logger.info("  - Vision relies on the configured Google AI Studio model and API key.")
        logger.info("")


async def main(layer: int) -> None:
    """Main entry point for the experiment runner."""
    runner = ExperimentRunner(layer=layer)
    try:
        await runner.setup()

        if layer == 0:
            await runner.run_layer0_experiment()
        elif layer == 1:
            await runner.run_layer1_experiment()
        else:
            logger.error("Invalid layer: %s. Must be 0 or 1.", layer)
    except KeyboardInterrupt:
        logger.info("")
        logger.info("Experiment interrupted by user")
    except Exception as exc:
        logger.error("Experiment failed: %s", exc, exc_info=True)
        raise
    finally:
        await runner.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="LoopHarvest AI Gateway - Experimental Runner"
    )
    parser.add_argument(
        "--layer",
        type=int,
        choices=[0, 1],
        default=0,
        help="Layer to test: 0 (Health+Models) or 1 (Layer 0 + Chat + Vision)",
    )
    args = parser.parse_args()

    print("")
    print("=" * 80)
    print(" LOOPHARVEST AI GATEWAY - EXPERIMENTAL RUNNER ".center(80, "="))
    if args.layer == 0:
        print(" Layer 0: Health + Models Test ".center(80, "="))
    else:
        print(" Layer 1: Health + Models + Chat + Vision Test ".center(80, "="))
    print("=" * 80)
    print("")

    asyncio.run(main(args.layer))
