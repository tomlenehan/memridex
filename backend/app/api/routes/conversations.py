from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import func, Session, select
from app.models import (
    Conversation,
    ConversationCreate,
    ConversationPublic,
    ConversationsPublic,
    ChatMessage,
    ChatMessageCreate,
    ChatMessagePublic,
    ChatMessagesPublic,
    UserStoryPrompt,
    Message
)
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter()

@router.post("/conversations/", response_model=ConversationPublic)
def create_conversation(
        *,
        sessions: Session = Depends(get_db),
        conversation_in: ConversationCreate,
        current_user: User = Depends(get_current_user),
) -> Conversation:
    user_story_prompt = sessions.get(UserStoryPrompt, conversation_in.user_story_prompt_id)
    if not user_story_prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")

    conversation = Conversation(user_id=current_user.id, user_story_prompt_id=user_story_prompt.id)
    sessions.add(conversation)
    sessions.commit()
    sessions.refresh(conversation)
    return conversation

@router.get("/conversations/", response_model=ConversationsPublic)
def read_conversations(
        sessions: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
) -> ConversationsPublic:
    conversations = sessions.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    ).all()
    count_statement = (
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.user_id == current_user.id)
    )
    count = sessions.exec(count_statement).one()
    return ConversationsPublic(data=conversations, count=count)

@router.get("/conversations/{id}", response_model=ConversationPublic)
def read_conversation(
        id: int,
        sessions: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
) -> Conversation:
    conversation = sessions.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return conversation

@router.put("/conversations/{id}", response_model=ConversationPublic)
def update_conversation(
        *,
        id: int,
        conversation_in: ConversationCreate,
        sessions: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
) -> Conversation:
    conversation = sessions.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    conversation.user_story_prompt_id = conversation_in.user_story_prompt_id

    sessions.add(conversation)
    sessions.commit()
    sessions.refresh(conversation)
    return conversation

@router.delete("/conversations/{id}")
def delete_conversation(
        id: int,
        sessions: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> Message:
    conversation = sessions.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    sessions.delete(conversation)
    sessions.commit()
    return Message(message="Conversation deleted successfully")

@router.post("/chat_messages/", response_model=ChatMessagePublic)
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

@router.get("/chat_messages/{conversation_id}", response_model=ChatMessagesPublic)
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
