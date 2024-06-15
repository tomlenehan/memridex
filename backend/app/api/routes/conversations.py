from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import func, Session, select
from typing import Any
from app.models import (
    Conversation,
    ConversationCreate,
    ConversationPublic,
    ConversationsPublic,
    ConversationStatus,
    ChatMessage,
    ChatMessageSender,
    UserStoryPrompt,
    Message
)
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter()


@router.post("/", response_model=ConversationPublic)
def create_conversation(
    *,
    session: Session = Depends(get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    user_story_prompt = session.get(UserStoryPrompt, conversation_in.user_story_prompt_id)
    if not user_story_prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")

    # Create the new conversation with status set to active
    conversation = Conversation(
        user_id=current_user.id,
        user_story_prompt_id=user_story_prompt.id,
        status=ConversationStatus.ACTIVE
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)

    # Create the first message with the prompt from the user_story_prompt
    initial_message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        sender_type=ChatMessageSender.AI,
        content=user_story_prompt.prompt
    )
    session.add(initial_message)
    session.commit()
    session.refresh(conversation)

    return conversation

@router.get("/", response_model=ConversationsPublic)
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

@router.get("/{id}", response_model=ConversationPublic)
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

@router.put("/{id}", response_model=ConversationPublic)
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

@router.delete("/{id}")
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
