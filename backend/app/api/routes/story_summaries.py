from typing import Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Form
from sqlmodel import Session, select
from app.api.deps import get_current_user, get_db
from app.models import User, StorySummary, StorySummaryPublic, Conversation, Message, ConversationStatus
from app.llm.utils import get_formatted_history
from app.llm.conversation_summarize import generate_summary
from app.models import ChatMessage

router = APIRouter()

@router.get("/", response_model=list[StorySummaryPublic])
def read_story_summaries(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve story summaries.
    """
    if current_user.is_superuser:
        statement = select(StorySummary).offset(skip).limit(limit)
    else:
        statement = (
            select(StorySummary)
            .join(Conversation, StorySummary.conversation_id == Conversation.id)
            .where(Conversation.user_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
    summaries = session.exec(statement).all()
    return summaries

@router.get("/{id}", response_model=StorySummaryPublic)
def read_story_summary(
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get story summary by ID.
    """
    summary = session.get(StorySummary, id)
    if not summary:
        raise HTTPException(status_code=404, detail="Story summary not found")
    conversation = session.get(Conversation, summary.conversation_id)
    if not current_user.is_superuser and (conversation.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return summary

@router.post("/", response_model=StorySummaryPublic)
async def create_story_summary(
        conversation_id: int = Form(...),
        current_user: User = Depends(get_current_user),
        db_session: Session = Depends(get_db)
) -> StorySummaryPublic:
    conversation = db_session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_history, _ = get_formatted_history(conversation_id, db_session)
    summary_content = ""

    system_message = (f"You are an AI ghostwriter tasked with summarizing the following conversation "
                      f"based on this story prompt {conversation.user_story_prompt.prompt}. Your output should be in "
                      f"prose, fit to be published in a biography.")

    async for token in generate_summary(system_message, chat_history):
        summary_content += token

    final_message = ChatMessage(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        sender_type="final",
        content=summary_content
    )
    db_session.add(final_message)
    db_session.commit()
    db_session.refresh(final_message)

    story_summary = StorySummary(
        conversation_id=conversation_id,
        summary_text=summary_content
    )
    db_session.add(story_summary)
    db_session.commit()
    db_session.refresh(story_summary)

    return story_summary

@router.put("/{id}", response_model=StorySummaryPublic)
def update_story_summary(
    *,
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    summary_text: str
) -> Any:
    """
    Update a story summary.
    """
    summary = session.get(StorySummary, id)
    if not summary:
        raise HTTPException(status_code=404, detail="Story summary not found")
    conversation = session.get(Conversation, summary.conversation_id)
    if not current_user.is_superuser and (conversation.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    summary.summary_text = summary_text
    session.add(summary)
    session.commit()
    session.refresh(summary)
    return summary

@router.delete("/{id}")
def delete_story_summary(
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Message:
    """
    Delete a story summary.
    """
    summary = session.get(StorySummary, id)
    if not summary:
        raise HTTPException(status_code=404, detail="Story summary not found")
    conversation = session.get(Conversation, summary.conversation_id)
    if not current_user.is_superuser and (conversation.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    session.delete(summary)
    session.commit()
    return Message(message="Story summary deleted successfully")
