from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, Form, File
from sqlmodel import Session, select
from app.api.deps import get_current_user, get_db
from app.models import User, StorySummary, StorySummaryPublic, Conversation, Message, StorySummaryCreate, StorySummaryUpdate
from app.llm.utils import get_formatted_history
from pydantic import BaseModel
from app.llm.conversation_summarize import generate_summary, generate_title
from app.utils import upload_image_to_s3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class SummaryCreateRequest(BaseModel):
    conversation_id: int
    tone: int
    author_style: Optional[str] = None

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
    request: SummaryCreateRequest,
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
) -> StorySummaryPublic:
    try:
        conversation = db_session.get(Conversation, request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        chat_history, _ = get_formatted_history(request.conversation_id, db_session)
        summary_content = ""

        system_message = (f"You are an AI ghostwriter tasked with summarizing the following conversation "
                          f"based on this story prompt {conversation.user_story_prompt.prompt}. "
                          f"Your output should be in relatively concise prose told from the perspective of the user "
                          f"and be fit to be published in an autobiography. ")

        if request.author_style:
            system_message += f" Write in the style of {request.author_style}."

        async for token in generate_summary(system_message, chat_history, request.tone):
            summary_content += token

        system_message = f"Please give a concise one sentence title based on the following story summary:"

        summary_title = generate_title(system_message, summary_content)

        story_summary_create = StorySummaryCreate(
            conversation_id=request.conversation_id,
            summary_text=summary_content,
            title=summary_title,
            user_id=current_user.id,
            image_url=conversation.user_story_prompt.image_url
        )
        story_summary = StorySummary.from_orm(story_summary_create)
        db_session.add(story_summary)
        db_session.commit()
        db_session.refresh(story_summary)

        conversation.status = "complete"
        db_session.add(conversation)
        db_session.commit()
        db_session.refresh(conversation)

        # Convert StorySummary to StorySummaryPublic
        story_summary_public = StorySummaryPublic.from_orm(story_summary)
        return story_summary_public
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_session.close()

@router.put("/{id}", response_model=StorySummaryPublic)
def update_story_summary(
        *,
        id: int,
        session: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
        title: Optional[str] = Form(None),
        summary_text: Optional[str] = Form(None),
        image: Optional[UploadFile] = File(None)
) -> Any:
    """
    Update a story summary.
    """
    try:
        # Fetch the summary and check if it exists
        summary = session.get(StorySummary, id)
        if not summary:
            raise HTTPException(status_code=404, detail="Story summary not found")

        # Fetch the conversation and check permissions
        conversation = session.get(Conversation, summary.conversation_id)
        if not current_user.is_superuser and (conversation.user_id != current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Update fields if provided
        if title:
            summary.title = title
        if summary_text:
            summary.summary_text = summary_text
        if image:
            image_url = upload_image_to_s3(image)
            summary.image_url = image_url

        summary.modified_at = datetime.utcnow()

        # Save changes
        session.add(summary)
        session.commit()
        session.refresh(summary)

        return summary
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")
    finally:
        session.close()


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
