from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import func, Session, select
from app.llm.utils import get_formatted_history
from app.models import (
    ChatMessage,
    ChatMessageCreate,
    ChatMessagePublic,
    ChatMessagesPublic,
    Conversation,
    Message,
    StorySummary,
    ConversationStatus
)
from app.api.deps import get_current_user, get_db
from app.models import User
from app.llm.conversation_agent import send_message, Message
from app.llm.conversation_summarize import generate_summary
from app.llm.utils import STORY_TOKEN_LIMIT
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{conversation_id}/messages", response_model=ChatMessagePublic)
async def create_chat_message(
        *,
        conversation_id: int,
        chat_message_in: ChatMessageCreate,
        current_user: User = Depends(get_current_user),
        db_session: Session = Depends(get_db)
) -> StreamingResponse:
    conversation = db_session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_message = ChatMessage(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        sender_type=chat_message_in.sender_type,
        content=chat_message_in.content
    )
    db_session.add(chat_message)
    db_session.commit()
    db_session.refresh(chat_message)

    async def message_generator(db_session: Session, current_user_id: int):
        response_content = ""

        conversation = db_session.get(Conversation, conversation_id)
        story_prompt = conversation.user_story_prompt.prompt
        chat_history, total_tokens = get_formatted_history(conversation_id, db_session)

        system_message = (f"You are an AI ghostwriter tasked with teasing out details from the user "
                         f"about this story prompt {story_prompt}. continue to ask good follow-up "
                         f"questions based on their input. Keep the questions interesting and engaging"
                          f"and keeep your language fun and casual.")

        async for token in send_message(chat_message_in.content, system_message, chat_history):
            response_content += token
            total_tokens += 1
            yield token

        # Save the AI message after streaming is complete
        ai_message = ChatMessage(
            conversation_id=conversation_id,
            sender_id=current_user_id,
            sender_type="AI",
            content=response_content
        )
        db_session.add(ai_message)
        db_session.commit()
        db_session.refresh(ai_message)

        if total_tokens > STORY_TOKEN_LIMIT:
            conversation.status = "ready_for_summary"
            db_session.add(conversation)
            db_session.commit()

    current_user_id = current_user.id

    return StreamingResponse(message_generator(db_session, current_user_id), media_type="text/event-stream")


@router.get("/{conversation_id}/messages", response_model=ChatMessagesPublic)
def read_chat_messages(
        conversation_id: int,
        session: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
) -> ChatMessagesPublic:
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    chat_messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.timestamp.asc())
        .offset(skip)
        .limit(limit)
    ).all()

    count_statement = (
        select(func.count())
        .select_from(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
    )
    count = session.exec(count_statement).one()
    return ChatMessagesPublic(data=chat_messages, count=count)


@router.get("/{conversation_id}/messages/{message_id}", response_model=ChatMessagePublic)
def read_chat_message(
        conversation_id: int,
        message_id: int,
        session: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
) -> ChatMessage:
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    chat_message = session.get(ChatMessage, message_id)
    if not chat_message or chat_message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Chat message not found")
    return chat_message


@router.delete("/{conversation_id}/messages/{message_id}", response_model=Message)
def delete_chat_message(
        conversation_id: int,
        message_id: int,
        session: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> Message:
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    chat_message = session.get(ChatMessage, message_id)
    if not chat_message or chat_message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Chat message not found")
    session.delete(chat_message)
    session.commit()
    return Message(message="Chat message deleted successfully")
