import asyncio
import io
import json
import os
import sys

import pytest
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main as ai_main


class DummyImage:
    filename = "sample.png"

    async def read(self):
        buffer = io.BytesIO()
        Image.new("RGB", (16, 16), color=(255, 0, 0)).save(buffer, format="PNG")
        return buffer.getvalue()


def test_health_endpoint_returns_healthy_even_when_model_not_loaded():
    ai_main.app.state.engine = None
    ai_main.app.state.model_status = "loading"
    ai_main.app.state.model_error = None

    response = ai_main.get_inference_health()

    assert response == {"status": "healthy", "service": "ai-service"}


def test_ready_endpoint_reports_loading_when_model_not_ready():
    ai_main.app.state.engine = None
    ai_main.app.state.model_status = "loading"
    ai_main.app.state.model_error = None

    response = ai_main.get_ai_readiness()

    assert response.status_code == 503
    assert json.loads(response.body.decode("utf-8")) == {"status": "loading", "model_loaded": False}


def test_ready_endpoint_reports_ready_when_model_is_loaded():
    class Engine:
        interpreter = object()

    ai_main.app.state.engine = Engine()
    ai_main.app.state.model_status = "ready"
    ai_main.app.state.model_error = None

    response = ai_main.get_ai_readiness()

    assert response == {"status": "ready", "model_loaded": True}


def test_inference_returns_controlled_503_while_model_loads():
    ai_main.app.state.engine = None
    ai_main.app.state.model_status = "loading"
    ai_main.app.state.model_error = None

    with pytest.raises(Exception) as excinfo:
        asyncio.run(
            ai_main.estimate_depth(
                image=DummyImage(),
                reference_dem=None,
                gcp_json=None,
                colormap="turbo",
            )
        )

    assert excinfo.value.status_code == 503
    assert excinfo.value.detail["status"] == "model_loading"


def test_inference_does_not_crash_when_engine_is_none():
    ai_main.app.state.engine = None
    ai_main.app.state.model_status = "ready"
    ai_main.app.state.model_error = None

    with pytest.raises(Exception) as excinfo:
        asyncio.run(
            ai_main.estimate_depth(
                image=DummyImage(),
                reference_dem=None,
                gcp_json=None,
                colormap="turbo",
            )
        )

    assert excinfo.value.status_code == 503
    assert excinfo.value.detail["status"] == "model_unavailable"
