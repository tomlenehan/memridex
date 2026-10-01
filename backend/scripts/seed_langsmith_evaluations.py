"""Create a small synthetic LangSmith dataset for lifecycle regression checks."""

from langsmith import Client

from app.core.config import settings
from app.llm.evaluations import LIFECYCLE_EVALUATION_CASES
from app.llm.tracing import configure_langsmith_tracing


def main() -> None:
    configure_langsmith_tracing()
    if not settings.langsmith_api_key:
        raise RuntimeError("Set LANGSMITH_API_KEY before creating evaluation data")

    dataset_name = f"{settings.langsmith_project}-conversation-lifecycle-evals"
    client = Client()
    if client.has_dataset(dataset_name=dataset_name):
        print(f"LangSmith dataset already exists: {dataset_name}")
        return

    client.create_dataset(
        dataset_name,
        description=(
            "Synthetic, non-customer cases that protect MemriPlace's "
            "conversation lifecycle decisions."
        ),
    )
    for case in LIFECYCLE_EVALUATION_CASES:
        client.create_example(
            inputs=case["inputs"],
            outputs=case["outputs"],
            dataset_name=dataset_name,
        )
    print(f"Created LangSmith dataset: {dataset_name}")


if __name__ == "__main__":
    main()
