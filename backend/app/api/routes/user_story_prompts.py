from typing import Any

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from sqlmodel import func, select, Session

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    UserStoryPrompt,
    UserStoryPromptCreate,
    UserStoryPromptPublic,
    UserStoryPromptUpdate,
    UserStoryPromptsPublic,
    Message,
    Image
)
from app.utils import upload_image_to_s3

router = APIRouter()


@router.get("/", response_model=UserStoryPromptsPublic)
def read_user_story_prompts(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
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
def read_user_story_prompt(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
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
    session: SessionDep,
    current_user: CurrentUser,
    prompt: str = Form(...),
    category_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None)
) -> Any:
    """
    Create new user story prompt.
    """
    print("Received form data:")
    print(f"prompt: {prompt}")
    print(f"category_id: {category_id}")
    print(f"image: {image.filename if image else 'No image uploaded'}")

    print("Current user:")
    print(current_user)

    image_id = None
    if image:
        image_url = upload_image_to_s3(image)
        new_image = Image(link=image_url)
        session.add(new_image)
        session.commit()
        session.refresh(new_image)
        image_id = new_image.id

    prompt_data = UserStoryPromptCreate(prompt=prompt, category_id=category_id, image_id=image_id)
    prompt = UserStoryPrompt(**prompt_data.dict(), user_id=current_user.id)
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.put("/{id}", response_model=UserStoryPromptPublic)
def update_user_story_prompt(
    *, session: SessionDep, current_user: CurrentUser, id: int, prompt_in: UserStoryPromptUpdate
) -> Any:
    """
    Update a user story prompt.
    """
    prompt = session.get(UserStoryPrompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="User story prompt not found")
    if not current_user.is_superuser and (prompt.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = prompt_in.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(prompt, key, value)
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.delete("/{id}")
def delete_user_story_prompt(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
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
