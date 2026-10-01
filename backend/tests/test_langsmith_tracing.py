import os

from app.core.config import settings
from app.llm.tracing import configure_langsmith_tracing, llm_trace_config


def test_configure_langsmith_tracing_supports_current_environment_names(
    monkeypatch,
) -> None:
    for name in (
        "LANGSMITH_TRACING",
        "LANGSMITH_API_KEY",
        "LANGSMITH_PROJECT",
        "LANGSMITH_ENDPOINT",
        "LANGCHAIN_TRACING_V2",
        "LANGCHAIN_API_KEY",
        "LANGCHAIN_PROJECT",
        "LANGCHAIN_ENDPOINT",
    ):
        monkeypatch.setenv(name, "")
    monkeypatch.setattr(settings, "LANGSMITH_TRACING", True)
    monkeypatch.setattr(settings, "LANGSMITH_API_KEY", "test-langsmith-key")
    monkeypatch.setattr(settings, "LANGSMITH_PROJECT", "memriplace-test")
    monkeypatch.setattr(settings, "LANGSMITH_ENDPOINT", "https://api.smith.test")
    monkeypatch.setattr(settings, "LANGCHAIN_TRACING_V2", False)
    monkeypatch.setattr(settings, "LANGCHAIN_API_KEY", None)
    monkeypatch.setattr(settings, "LANGCHAIN_PROJECT", None)
    monkeypatch.setattr(settings, "LANGCHAIN_ENDPOINT", None)

    configure_langsmith_tracing()

    assert os.environ["LANGSMITH_TRACING"] == "true"
    assert os.environ["LANGSMITH_PROJECT"] == "memriplace-test"
    assert os.environ["LANGCHAIN_TRACING_V2"] == "true"
    assert os.environ["LANGCHAIN_PROJECT"] == "memriplace-test"


def test_configure_langsmith_tracing_removes_blank_endpoint_variables(
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "LANGSMITH_TRACING", True)
    monkeypatch.setattr(settings, "LANGSMITH_API_KEY", "test-langsmith-key")
    monkeypatch.setattr(settings, "LANGSMITH_ENDPOINT", None)
    monkeypatch.setattr(settings, "LANGCHAIN_ENDPOINT", None)
    monkeypatch.setenv("LANGSMITH_ENDPOINT", "")
    monkeypatch.setenv("LANGCHAIN_ENDPOINT", "")

    configure_langsmith_tracing()

    assert "LANGSMITH_ENDPOINT" not in os.environ
    assert "LANGCHAIN_ENDPOINT" not in os.environ


def test_llm_trace_config_names_the_product_operation() -> None:
    config = llm_trace_config("conversation.reply")

    assert config["run_name"] == "memriplace.conversation.reply"
    assert config["tags"] == ["memriplace", "conversation.reply"]
    assert config["metadata"]["product"] == "memriplace"
