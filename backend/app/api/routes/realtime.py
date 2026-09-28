import json
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.llm.realtime import build_realtime_session_config, create_safety_identifier
from app.llm.story_nodes import MAX_NODE_USER_TURNS, get_conversation_prompt
from app.models import (
    ChatMessage,
    Conversation,
    ConversationStatus,
    RealtimeSessionOffer,
    User,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/conversations/{conversation_id}/realtime/session")
async def create_realtime_session(
    *,
    conversation_id: int,
    offer: RealtimeSessionOffer,
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_db),
) -> Response:
    conversation = db_session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if conversation.status != ConversationStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="This story node is finished")
    if conversation.user_turn_count >= MAX_NODE_USER_TURNS:
        raise HTTPException(status_code=409, detail="This story node is finished")
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Voice stories are not configured. Set OPENAI_API_KEY on the server.",
        )

    chat_messages = db_session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.timestamp.asc())
    ).all()
    story_prompt = get_conversation_prompt(conversation)
    session_config = build_realtime_session_config(
        story_prompt, chat_messages, conversation.user_turn_count, conversation.ready_to_save
    )

    files = {
        "sdp": (None, offer.sdp),
        "session": (None, json.dumps(session_config)),
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "OpenAI-Safety-Identifier": create_safety_identifier(current_user.id),
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/calls",
                headers=headers,
                files=files,
            )
    except httpx.HTTPError:
        logger.exception("Unable to create an OpenAI Realtime session")
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to the voice service. Please try again.",
        ) from None

    if response.is_error:
        logger.warning(
            "OpenAI Realtime session request failed with status %s: %s",
            response.status_code,
            response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail="The voice service could not start a conversation. Please try again.",
        )

    return Response(content=response.text, media_type="application/sdp")
