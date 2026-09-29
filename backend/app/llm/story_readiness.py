"""Offer saving when the storyteller has shared a usable, specific memory."""

import logging
from typing import cast

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.config import settings
from app.core.db import engine
from app.llm.story_nodes import get_conversation_prompt
from app.llm.utils import MIN_READY_USER_TURNS
from app.models import ChatMessage, ChatMessageSender, Conversation, ConversationStatus

logger = logging.getLogger(__name__)


class StoryReadiness(BaseModel):
    ready: bool


async def assess_story_readiness_after_reply(
    conversation_id: int, expected_turn_count: int
) -> None:
    """Assess a completed turn without holding up the conversation response."""
    if expected_turn_count < MIN_READY_USER_TURNS:
        return

    with Session(engine) as session:
        conversation = session.get(Conversation, conversation_id)
        if (
            conversation is None
            or conversation.status != ConversationStatus.ACTIVE
            or conversation.ready_to_save
            or conversation.user_turn_count != expected_turn_count
        ):
            return

        user_messages = session.exec(
            select(ChatMessage)
            .where(
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.sender_type == ChatMessageSender.USER,
            )
            .order_by(col(ChatMessage.id).asc())
        ).all()
        storyteller_words = "\n".join(
            f"Reply {index}: {message.content.strip()}"
            for index, message in enumerate(user_messages, start=1)
            if message.content.strip()
        )
        if not storyteller_words:
            return

        instructions = (
            "Decide whether this storyteller has shared enough of one specific memory "
            "to create a truthful, concise first-person story. Return ready=true when "
            "there is a recognizable person, place, event, or moment with at least a "
            "couple of concrete details. A small memory is enough. Do not require names, "
            "sensory details, or a polished beginning and ending. Return ready=false "
            "for only vague generalities or one-word answers. Use only the storyteller's "
            "words as evidence; the opening prompt is context, not a fact about their life. "
            "This is an invitation to save, never an automatic decision to end the chat."
        )
        request = (
            f"Opening prompt: {get_conversation_prompt(conversation)}\n\n"
            f"Storyteller replies:\n{storyteller_words}"
        )

    try:
        model = ChatOpenAI(
            model=settings.STORY_READINESS_MODEL, temperature=0
        ).with_structured_output(StoryReadiness)
        decision = cast(
            StoryReadiness,
            await model.ainvoke(
                [SystemMessage(content=instructions), HumanMessage(content=request)]
            ),
        )
        if not decision.ready:
            return

        with Session(engine) as session:
            conversation = session.get(Conversation, conversation_id)
            if (
                conversation is not None
                and conversation.status == ConversationStatus.ACTIVE
                and conversation.user_turn_count == expected_turn_count
            ):
                conversation.ready_to_save = True
                session.add(conversation)
                session.commit()
    except Exception:
        logger.exception(
            "Unable to assess readiness for story node %s", conversation_id
        )
