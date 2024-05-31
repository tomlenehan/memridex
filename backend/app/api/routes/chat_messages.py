from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, Session, select
from app.models import (
    ChatMessage,
    ChatMessageCreate,
    ChatMessagePublic,
    ChatMessagesPublic,
    Conversation
)
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter()

@router.post("/", response_model=ChatMessagePublic)
def create_chat_message(
        *,
        sessions: Session = Depends(get_db),
        chat_message_in: ChatMessageCreate,
        current_user: User = Depends(get_current_user),
) -> ChatMessage:
    conversation = sessions.get(Conversation, chat_message_in.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_message = ChatMessage(sender_id=current_user.id, **chat_message_in.dict())
    sessions.add(chat_message)
    sessions.commit()
    sessions.refresh(chat_message)
    return chat_message

@router.get("/{conversation_id}", response_model=ChatMessagesPublic)
def read_chat_messages(
        conversation_id: int,
        sessions: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
) -> ChatMessagesPublic:
    chat_messages = sessions.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .offset(skip)
        .limit(limit)
    ).all()
    count_statement = (
        select(func.count())
        .select_from(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
    )
    count = sessions.exec(count_statement).one()
    return ChatMessagesPublic(data=chat_messages, count=count)
