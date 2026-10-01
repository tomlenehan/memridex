"""A small LangGraph workflow for the work that follows a saved AI reply."""

from typing import Literal, TypedDict

from langgraph.graph import END, StateGraph
from sqlmodel import Session

from app.core.db import engine
from app.llm.story_nodes import generate_story_branches_after_reply
from app.llm.story_readiness import assess_story_readiness_after_reply
from app.llm.tracing import llm_trace_config
from app.llm.utils import MAX_NODE_USER_TURNS, MIN_READY_USER_TURNS
from app.models import Conversation, ConversationStatus

PostReplyAction = Literal["wait", "readiness", "branches"]


class ConversationLifecycleState(TypedDict, total=False):
    conversation_id: int
    expected_turn_count: int
    action: PostReplyAction


def choose_post_reply_action(
    *,
    status: ConversationStatus,
    user_turn_count: int,
    ready_to_save: bool,
    expected_turn_count: int,
) -> PostReplyAction:
    """Choose a safe background action from the durable conversation state."""
    if user_turn_count != expected_turn_count:
        return "wait"
    if status in {ConversationStatus.READY_FOR_SUMMARY, ConversationStatus.COMPLETE}:
        return "branches"
    if user_turn_count >= MAX_NODE_USER_TURNS:
        return "branches"
    if status != ConversationStatus.ACTIVE or ready_to_save:
        return "wait"
    if user_turn_count >= MIN_READY_USER_TURNS:
        return "readiness"
    return "wait"


async def decide_next_action(
    state: ConversationLifecycleState,
) -> ConversationLifecycleState:
    with Session(engine) as session:
        conversation = session.get(Conversation, state["conversation_id"])
        if conversation is None:
            return {"action": "wait"}
        return {
            "action": choose_post_reply_action(
                status=conversation.status,
                user_turn_count=conversation.user_turn_count,
                ready_to_save=conversation.ready_to_save,
                expected_turn_count=state["expected_turn_count"],
            )
        }


async def assess_readiness(
    state: ConversationLifecycleState,
) -> ConversationLifecycleState:
    await assess_story_readiness_after_reply(
        state["conversation_id"], state["expected_turn_count"]
    )
    return {}


async def generate_branches(
    state: ConversationLifecycleState,
) -> ConversationLifecycleState:
    await generate_story_branches_after_reply(state["conversation_id"])
    return {}


def route_next_action(state: ConversationLifecycleState) -> PostReplyAction:
    return state["action"]


def build_post_reply_workflow():
    workflow = StateGraph(ConversationLifecycleState)
    workflow.add_node("decide_next_action", decide_next_action)
    workflow.add_node("assess_readiness", assess_readiness)
    workflow.add_node("generate_branches", generate_branches)
    workflow.set_entry_point("decide_next_action")
    workflow.add_conditional_edges(
        "decide_next_action",
        route_next_action,
        {
            "wait": END,
            "readiness": "assess_readiness",
            "branches": "generate_branches",
        },
    )
    workflow.add_edge("assess_readiness", END)
    workflow.add_edge("generate_branches", END)
    return workflow.compile()


post_reply_workflow = build_post_reply_workflow()


async def run_post_reply_workflow(
    conversation_id: int, expected_turn_count: int
) -> None:
    """Run an idempotent post-reply lifecycle check in the background."""
    await post_reply_workflow.ainvoke(
        {
            "conversation_id": conversation_id,
            "expected_turn_count": expected_turn_count,
        },
        config=llm_trace_config(
            "conversation.lifecycle",
            metadata={"expected_turn_count": expected_turn_count},
        ),
    )
