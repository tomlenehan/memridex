from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select
from app.models import Conversation, ConversationCreate, ConversationPublic, ConversationsPublic, \
    ChatMessage, ChatMessageCreate, ChatMessagePublic, ChatMessagesPublic, UserStoryPrompt
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter()


@router.post("/conversations/", response_model=ConversationPublic)
def create_conversation(
        *,
        db: Session = Depends(get_db),
        conversation_in: ConversationCreate,
        current_user: User = Depends(get_current_user),
) -> Conversation:
    user_story_prompt = db.get(UserStoryPrompt, conversation_in.user_story_prompt_id)
    if not user_story_prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")

    conversation = Conversation(user_id=current_user.id, user_story_prompt_id=user_story_prompt.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/", response_model=ConversationsPublic)
def read_conversations(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
) -> ConversationsPublic:
    conversations = db.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    ).all()
    return ConversationsPublic(data=conversations, count=len(conversations))


@router.post("/chat_messages/", response_model=ChatMessagePublic)
def create_chat_message(
        *,
        db: Session = Depends(get_db),
        chat_message_in: ChatMessageCreate,
        current_user: User = Depends(get_current_user),
) -> ChatMessage:
    conversation = db.get(Conversation, chat_message_in.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_message = ChatMessage(sender_id=current_user.id, **chat_message_in.dict())
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message


@router.get("/chat_messages/{conversation_id}", response_model=ChatMessagesPublic)
def read_chat_messages(
        conversation_id: int,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
) -> ChatMessagesPublic:
    chat_messages = db.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .offset(skip)
        .limit(limit)
    ).all()
    return ChatMessagesPublic(data=chat_messages, count=len(chat_messages))
