from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import func, Session, select
from typing import Any
import logging

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
from app.llm.story_nodes import MAX_NODE_USER_TURNS, create_story_branches

logger = logging.getLogger(__name__)

router = APIRouter()

ROOT_NODE_TITLE = "Childhood beginnings"
ROOT_NODE_PROMPT = "Tell me about your childhood. What's one early moment you still remember?"


@router.post("/", response_model=ConversationPublic)
def create_conversation(
    *,
    session: Session = Depends(get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    user_story_prompt = None
    if conversation_in.user_story_prompt_id is not None:
        user_story_prompt = session.get(
            UserStoryPrompt, conversation_in.user_story_prompt_id
        )
        if not user_story_prompt:
            raise HTTPException(status_code=404, detail="User story prompt not found")
        if user_story_prompt.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    node_prompt = user_story_prompt.prompt if user_story_prompt else ROOT_NODE_PROMPT
    node_title = user_story_prompt.prompt[:72] if user_story_prompt else ROOT_NODE_TITLE
    conversation = Conversation(
        user_id=current_user.id,
        user_story_prompt_id=user_story_prompt.id if user_story_prompt else None,
        node_title=node_title,
        node_prompt=node_prompt,
        node_depth=0,
        user_turn_count=0,
        status=ConversationStatus.ACTIVE,
    )
    session.add(conversation)
    session.flush()
    initial_message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        sender_type=ChatMessageSender.AI,
        content=node_prompt,
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
        .order_by(Conversation.created_at.asc(), Conversation.id.asc())
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

    if conversation_in.user_story_prompt_id is not None:
        prompt = sessions.get(UserStoryPrompt, conversation_in.user_story_prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="User story prompt not found")
        if prompt.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        conversation.user_story_prompt_id = prompt.id
        conversation.node_prompt = prompt.prompt
        conversation.node_title = prompt.prompt[:72]

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


@router.post("/{id}/activate", response_model=ConversationPublic)
def activate_story_node(
    *,
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Conversation:
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Story node not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if conversation.status != ConversationStatus.INACTIVE:
        return conversation

    if conversation.parent_conversation_id is None:
        if conversation.node_depth > 0:
            raise HTTPException(status_code=409, detail="This story path is not unlocked yet")
    else:
        parent = session.get(Conversation, conversation.parent_conversation_id)
        if not parent or parent.user_id != current_user.id:
            raise HTTPException(status_code=409, detail="This story path is not unlocked yet")
        parent_finished = parent.status in {
            ConversationStatus.READY_FOR_SUMMARY,
            ConversationStatus.COMPLETE,
        } or parent.user_turn_count >= MAX_NODE_USER_TURNS
        if not parent_finished:
            raise HTTPException(status_code=409, detail="Finish the parent story first")
        if parent.user_turn_count >= MAX_NODE_USER_TURNS and parent.status == ConversationStatus.ACTIVE:
            parent.status = ConversationStatus.READY_FOR_SUMMARY
            session.add(parent)

    existing_message_id = session.exec(
        select(ChatMessage.id).where(ChatMessage.conversation_id == conversation.id)
    ).first()
    conversation.status = ConversationStatus.ACTIVE
    if existing_message_id is None:
        session.add(
            ChatMessage(
                conversation_id=conversation.id,
                sender_id=current_user.id,
                sender_type=ChatMessageSender.AI,
                content=conversation.node_prompt or ROOT_NODE_PROMPT,
            )
        )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


@router.post("/{id}/branches", response_model=List[ConversationPublic])
async def retry_story_branches(
    *,
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Conversation]:
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Story node not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if conversation.user_turn_count < MAX_NODE_USER_TURNS:
        raise HTTPException(status_code=409, detail="This story node is not ready to branch")
    if conversation.status not in {
        ConversationStatus.ACTIVE,
        ConversationStatus.READY_FOR_SUMMARY,
        ConversationStatus.COMPLETE,
    }:
        raise HTTPException(status_code=409, detail="Finish this story node first")

    try:
        if conversation.status == ConversationStatus.ACTIVE:
            conversation.status = ConversationStatus.READY_FOR_SUMMARY
            session.add(conversation)
            session.commit()
        return await create_story_branches(conversation, session)
    except Exception as error:
        logger.exception("Unable to generate story branches for node %s", id)
        session.rollback()
        raise HTTPException(
            status_code=502,
            detail="We couldn't find the next story paths. Please try again.",
        ) from error
