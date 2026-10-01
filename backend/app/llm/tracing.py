"""LangSmith configuration and consistent, privacy-conscious trace labels."""

import logging
import os
from collections.abc import Mapping
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def configure_langsmith_tracing() -> None:
    """Bridge current LangSmith settings to the installed LangChain versions."""
    if not settings.langsmith_tracing_enabled:
        return

    api_key = settings.langsmith_api_key
    if not api_key:
        logger.warning(
            "LangSmith tracing is enabled but no LangSmith API key is configured"
        )
        return

    project = settings.langsmith_project
    endpoint = settings.langsmith_endpoint

    # LangChain 0.2 reads LANGCHAIN_* while newer LangSmith tooling uses LANGSMITH_*.
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = api_key
    os.environ["LANGSMITH_PROJECT"] = project
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = api_key
    os.environ["LANGCHAIN_PROJECT"] = project
    if endpoint:
        os.environ["LANGSMITH_ENDPOINT"] = endpoint
        os.environ["LANGCHAIN_ENDPOINT"] = endpoint
    else:
        # Compose forwards unset values as empty strings. This LangSmith client
        # treats an explicitly empty endpoint as invalid instead of using US default.
        os.environ.pop("LANGSMITH_ENDPOINT", None)
        os.environ.pop("LANGCHAIN_ENDPOINT", None)

    logger.info("LangSmith tracing enabled for project %s", project)


def llm_trace_config(
    operation: str, metadata: Mapping[str, str | int | bool] | None = None
) -> dict[str, Any]:
    """Describe an AI operation without attaching user identifiers or story content."""
    trace_metadata: dict[str, str | int | bool] = {
        "environment": settings.ENVIRONMENT,
        "product": "memriplace",
    }
    if metadata:
        trace_metadata.update(metadata)

    return {
        "run_name": f"memriplace.{operation}",
        "tags": ["memriplace", operation],
        "metadata": trace_metadata,
    }
