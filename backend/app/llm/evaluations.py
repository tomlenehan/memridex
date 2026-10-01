"""Synthetic LangSmith evaluation data for the conversation lifecycle."""

from typing import TypedDict

from app.llm.conversation_lifecycle import PostReplyAction, choose_post_reply_action
from app.models import ConversationStatus


class LifecycleEvaluationCase(TypedDict):
    inputs: dict[str, str | int | bool]
    outputs: dict[str, str]


LIFECYCLE_EVALUATION_CASES: list[LifecycleEvaluationCase] = [
    {
        "inputs": {
            "case": "early-memory",
            "status": ConversationStatus.ACTIVE.value,
            "user_turn_count": 1,
            "ready_to_save": False,
            "expected_turn_count": 1,
        },
        "outputs": {"expected_action": "wait"},
    },
    {
        "inputs": {
            "case": "still-unfolding-after-five-turns",
            "status": ConversationStatus.ACTIVE.value,
            "user_turn_count": 5,
            "ready_to_save": False,
            "expected_turn_count": 5,
        },
        "outputs": {"expected_action": "wait"},
    },
    {
        "inputs": {
            "case": "specific-memory-after-six-turns",
            "status": ConversationStatus.ACTIVE.value,
            "user_turn_count": 6,
            "ready_to_save": False,
            "expected_turn_count": 6,
        },
        "outputs": {"expected_action": "readiness"},
    },
    {
        "inputs": {
            "case": "memory-already-ready",
            "status": ConversationStatus.ACTIVE.value,
            "user_turn_count": 3,
            "ready_to_save": True,
            "expected_turn_count": 3,
        },
        "outputs": {"expected_action": "wait"},
    },
    {
        "inputs": {
            "case": "story-finished",
            "status": ConversationStatus.COMPLETE.value,
            "user_turn_count": 3,
            "ready_to_save": True,
            "expected_turn_count": 3,
        },
        "outputs": {"expected_action": "wait"},
    },
    {
        "inputs": {
            "case": "stale-background-job",
            "status": ConversationStatus.ACTIVE.value,
            "user_turn_count": 3,
            "ready_to_save": False,
            "expected_turn_count": 2,
        },
        "outputs": {"expected_action": "wait"},
    },
]


def evaluate_lifecycle_case(inputs: dict[str, str | int | bool]) -> dict[str, str]:
    action: PostReplyAction = choose_post_reply_action(
        status=ConversationStatus(str(inputs["status"])),
        user_turn_count=int(inputs["user_turn_count"]),
        ready_to_save=bool(inputs["ready_to_save"]),
        expected_turn_count=int(inputs["expected_turn_count"]),
    )
    return {"action": action}
