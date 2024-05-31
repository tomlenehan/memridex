from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, Session, select
from app.models import (
    ChatMessage,
    ChatMessageCreate,
    ChatMessagePublic,
    ChatMessagesPublic,
    Conversation,
    Message
)
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter()


@router.post("/{conversation_id}/messages", response_model=ChatMessagePublic)
def create_chat_message(
        *,
        session: Session = Depends(get_db),
        conversation_id: int,
        chat_message_in: ChatMessageCreate,
        current_user: User = Depends(get_current_user),
) -> ChatMessage:
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_message = ChatMessage(sender_id=current_user.id, conversation_id=conversation_id,
                               **chat_message_in.dict())
    session.add(chat_message)
    session.commit()
    session.refresh(chat_message)
    return chat_message


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
