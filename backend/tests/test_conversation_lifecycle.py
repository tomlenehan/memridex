import asyncio
from types import SimpleNamespace

from app.api.routes.conversations import (
    STORY_PAUSE_MESSAGE,
    STORY_RESUME_QUESTION,
    activate_story_node,
)
from app.llm.conversation_lifecycle import (
    choose_post_reply_action,
    run_post_reply_workflow,
)
from app.llm.evaluations import LIFECYCLE_EVALUATION_CASES, evaluate_lifecycle_case
from app.llm.utils import MIN_READY_USER_TURNS
from app.models import ChatMessage, ChatMessageSender, Conversation, ConversationStatus


def test_lifecycle_evaluation_cases_match_the_workflow_contract() -> None:
    for case in LIFECYCLE_EVALUATION_CASES:
        assert evaluate_lifecycle_case(case["inputs"])["action"] == case["outputs"][
            "expected_action"
        ]


def test_finished_story_skips_readiness_workflow() -> None:
    assert (
        choose_post_reply_action(
            status=ConversationStatus.COMPLETE,
            user_turn_count=3,
            ready_to_save=True,
            expected_turn_count=3,
        )
        == "wait"
    )


def test_readiness_starts_only_after_the_minimum_number_of_replies() -> None:
    assert MIN_READY_USER_TURNS == 6
    for turns, expected in ((5, "wait"), (6, "readiness")):
        assert (
            choose_post_reply_action(
                status=ConversationStatus.ACTIVE,
                user_turn_count=turns,
                ready_to_save=False,
                expected_turn_count=turns,
            )
            == expected
        )


def test_resuming_ready_active_story_adds_one_question_after_pause_message() -> None:
    conversation = Conversation(
        id=42,
        user_id=7,
        status=ConversationStatus.ACTIVE,
        ready_to_save=False,
        user_turn_count=6,
    )
    latest_message = ChatMessage(
        id=2,
        conversation_id=42,
        sender_id=7,
        sender_type=ChatMessageSender.AI,
        content=STORY_PAUSE_MESSAGE,
    )

    class FakeSession:
        def __init__(self) -> None:
            self.added: list[object] = []
            self.latest_message = latest_message

        def get(self, model, _id):
            return conversation if model is Conversation else None

        def exec(self, _statement):
            return SimpleNamespace(first=lambda: self.latest_message)

        def add(self, item) -> None:
            self.added.append(item)
            if isinstance(item, ChatMessage):
                self.latest_message = item

        def commit(self) -> None:
            pass

        def refresh(self, _item) -> None:
            pass

    session = FakeSession()
    user = SimpleNamespace(id=7)

    activate_story_node(id=42, session=session, current_user=user)
    activate_story_node(id=42, session=session, current_user=user)

    resume_messages = [
        item
        for item in session.added
        if isinstance(item, ChatMessage) and item.content == STORY_RESUME_QUESTION
    ]
    assert len(resume_messages) == 1
    assert conversation.ready_to_save is False


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
