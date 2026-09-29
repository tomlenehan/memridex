from typing import Any
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import delete, func, select, update

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    ChatMessage,
    Constellation,
    ConstellationReport,
    ConstellationVote,
    Contact,
    Conversation,
    MemoryDay,
    MemoryXP,
    Message,
    PublishedConstellation,
    PublishedMemory,
    StoryEmbedding,
    StoryRelationship,
    StorySummary,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
    UserStoryPrompt,
    StockStoryPrompt,
)
from app.utils import generate_new_account_email, get_local_uploads_directory, send_email
from app.api.deps import get_current_user

router = APIRouter()


def _delete_account_data(session: SessionDep, user_id: int) -> None:
    """Remove both private records and public copies in one database transaction."""
    public_files = session.exec(select(PublishedMemory.image_filename)
        .join(PublishedConstellation, PublishedMemory.publication_id == PublishedConstellation.id)
        .where(PublishedConstellation.owner_id == user_id,
               PublishedMemory.image_filename.is_not(None))).all()
    private_files = session.exec(select(StorySummary.image_url).where(
        StorySummary.user_id == user_id,
        StorySummary.image_url.startswith("disk-private://"),
    )).all()
    try:
        session.exec(delete(ConstellationVote).where(ConstellationVote.user_id == user_id))
        session.exec(delete(ConstellationReport).where(ConstellationReport.user_id == user_id))
        session.exec(delete(PublishedConstellation).where(PublishedConstellation.owner_id == user_id))
        session.exec(delete(Constellation).where(Constellation.owner_id == user_id))
        session.exec(delete(StoryEmbedding).where(StoryEmbedding.user_id == user_id))
        session.exec(delete(StoryRelationship).where(StoryRelationship.user_id == user_id))
        session.exec(delete(MemoryDay).where(MemoryDay.user_id == user_id))
        session.exec(delete(MemoryXP).where(MemoryXP.user_id == user_id))
        session.exec(delete(Contact).where(Contact.user_id == user_id))
        session.exec(delete(Item).where(Item.owner_id == user_id))
        session.exec(delete(StorySummary).where(StorySummary.user_id == user_id))
        session.exec(delete(ChatMessage).where(ChatMessage.sender_id == user_id))
        session.exec(update(Conversation).where(Conversation.user_id == user_id).values(parent_conversation_id=None))
        session.exec(delete(Conversation).where(Conversation.user_id == user_id))
        session.exec(delete(UserStoryPrompt).where(UserStoryPrompt.user_id == user_id))
        session.exec(delete(User).where(User.id == user_id))
        session.commit()
    except Exception:
        session.rollback()
        raise
    directory = get_local_uploads_directory()
    for filename in public_files:
        if filename and Path(filename).name == filename:
            (directory / "public_sky" / filename).unlink(missing_ok=True)
    for image_url in private_files:
        if image_url:
            filename = image_url.removeprefix("disk-private://")
            if Path(filename).name == filename:
                (directory / filename).unlink(missing_ok=True)


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """

    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
    operation_id="create_user"
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in)

    # Copy all prompts from StockStoryPrompt to UserStoryPrompt
    stock_prompts = session.query(StockStoryPrompt).all()
    for stock_prompt in stock_prompts:
        user_prompt = UserStoryPrompt(
            prompt=stock_prompt.prompt,
            user_id=user.id,
            category_id=stock_prompt.category_id,
            image_url=stock_prompt.image_url
        )
        session.add(user_prompt)

    session.commit()

    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
        *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(
        *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.from_orm(current_user)


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    _delete_account_data(session, current_user.id)
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    if not settings.USERS_OPEN_REGISTRATION:
        raise HTTPException(
            status_code=403,
            detail="Open user registration is forbidden on this server",
        )
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = crud.create_user(session=session, user_create=user_create)
    return user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
        user_id: int, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
        *,
        session: SessionDep,
        user_id: int,
        user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
        session: SessionDep, current_user: CurrentUser, user_id: int
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    _delete_account_data(session, user_id)
    return Message(message="User deleted successfully")
