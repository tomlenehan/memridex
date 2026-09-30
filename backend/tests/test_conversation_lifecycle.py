import asyncio

from app.llm.conversation_lifecycle import (
    choose_post_reply_action,
    run_post_reply_workflow,
)
from app.llm.evaluations import LIFECYCLE_EVALUATION_CASES, evaluate_lifecycle_case
from app.models import ConversationStatus


def test_lifecycle_evaluation_cases_match_the_workflow_contract() -> None:
    for case in LIFECYCLE_EVALUATION_CASES:
        assert evaluate_lifecycle_case(case["inputs"])["action"] == case["outputs"][
            "expected_action"
        ]


def test_finished_story_opens_branches() -> None:
    assert (
        choose_post_reply_action(
            status=ConversationStatus.COMPLETE,
            user_turn_count=3,
            ready_to_save=True,
            expected_turn_count=3,
        )
        == "branches"
    )


def test_post_reply_workflow_uses_a_named_parent_trace(monkeypatch) -> None:
    received: dict[str, object] = {}

    class FakeWorkflow:
        async def ainvoke(self, state, config):
            received["state"] = state
            received["config"] = config

    monkeypatch.setattr(
        "app.llm.conversation_lifecycle.post_reply_workflow", FakeWorkflow()
    )

    asyncio.run(run_post_reply_workflow(42, 3))

    assert received["state"] == {"conversation_id": 42, "expected_turn_count": 3}
    assert received["config"]["run_name"] == "memriplace.conversation.lifecycle"
