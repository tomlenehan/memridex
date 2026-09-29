import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, func, select

from app.api.deps import get_current_user, get_db
from app.models import (
    Message,
    User,
    UserStoryPrompt,
    UserStoryPromptCreate,
    UserStoryPromptPublic,
    UserStoryPromptsPublic,
    UserStoryPromptUpdate,
)
from app.utils import upload_image_to_s3

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=UserStoryPromptsPublic)
def read_user_story_prompts(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve user story prompts.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(UserStoryPrompt)
        count = session.exec(count_statement).one()
        statement = select(UserStoryPrompt).offset(skip).limit(limit)
        prompts = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(UserStoryPrompt)
            .where(UserStoryPrompt.user_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(UserStoryPrompt)
            .where(UserStoryPrompt.user_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        prompts = session.exec(statement).all()

    return UserStoryPromptsPublic(data=prompts, count=count)


@router.get("/{id}", response_model=UserStoryPromptPublic)
def read_user_story_prompt(
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get user story prompt by ID.
    """
    prompt = session.get(UserStoryPrompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")
    if not current_user.is_superuser and (prompt.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return prompt


@router.post("/", response_model=UserStoryPromptPublic)
def create_user_story_prompt(
    *,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    prompt: str = Form(...),
    category_id: int | None = Form(None),
    image: UploadFile | None = File(None),
) -> Any:
    """
    Create new user story prompt.
    """
    image_url = None
    if image:
        image_url = upload_image_to_s3(image)

    prompt_data = UserStoryPromptCreate(
        prompt=prompt,
        category_id=category_id,
        image_url=image_url,
        created_at=datetime.utcnow(),
        modified_at=datetime.utcnow(),
    )
    user_story_prompt = UserStoryPrompt(**prompt_data.dict(), user_id=current_user.id)
    session.add(user_story_prompt)
    session.commit()
    session.refresh(user_story_prompt)
    return user_story_prompt


@router.put("/{id}", response_model=UserStoryPromptPublic)
def update_user_story_prompt(
    *,
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    prompt: str | None = Form(None),
    category_id: int | None = Form(None),
    image: UploadFile | None = File(None),
) -> Any:
    """
    Update a user story prompt.
    """
    try:
        prompt_instance = session.get(UserStoryPrompt, id)
        if not prompt_instance:
            logger.error(f"User story prompt with id {id} not found.")
            raise HTTPException(status_code=404, detail="User story prompt not found")
        if not current_user.is_superuser and (
            prompt_instance.user_id != current_user.id
        ):
            logger.error(
                f"User {current_user.id} does not have permission to update prompt {id}."
            )
            raise HTTPException(status_code=400, detail="Not enough permissions")

        if image:
            image_url = upload_image_to_s3(image)
            update_data = UserStoryPromptUpdate(
                prompt=prompt, category_id=category_id, image_url=image_url
            )
        else:
            update_data = UserStoryPromptUpdate(
                prompt=prompt,
                category_id=category_id,
            )

        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(prompt_instance, key, value)

        session.add(prompt_instance)
        session.commit()
        session.refresh(prompt_instance)
        return prompt_instance
    except Exception as e:
        logger.error(f"Error updating user story prompt {id}: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/{id}")
def delete_user_story_prompt(
    id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Message:
    """
    Delete a user story prompt.
    """
    prompt = session.get(UserStoryPrompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")
    if not current_user.is_superuser and (prompt.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(prompt)
    session.commit()
    return Message(message="User story prompt deleted successfully")
