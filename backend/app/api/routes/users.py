from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import delete, func, select, update

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    get_current_user,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    ChatMessage,
    Constellation,
    ConstellationReport,
    ConstellationVote,
    Contact,
    Conversation,
    Item,
    MemoryDay,
    MemoryXP,
    Message,
    PublishedConstellation,
    PublishedMemory,
    StockStoryPrompt,
    StoryEmbedding,
    StoryRelationship,
    StorySummary,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserStoryPrompt,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import (
    generate_new_account_email,
    get_local_uploads_directory,
    send_email,
)

router = APIRouter()

PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024
PROFILE_IMAGE_DIRECTORY = "profile_images"
PROFILE_IMAGE_ROUTE = f"{settings.API_V1_STR}/users/profile-images/"


def _profile_image_type(data: bytes) -> tuple[str, str] | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png", "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg", "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp", "image/webp"
    return None


def _local_profile_image_filename(image_url: str | None) -> str | None:
    if not image_url or not image_url.startswith(PROFILE_IMAGE_ROUTE):
        return None
    filename = image_url.removeprefix(PROFILE_IMAGE_ROUTE)
    return filename if Path(filename).name == filename else None


def _delete_local_profile_image(image_url: str | None) -> None:
    filename = _local_profile_image_filename(image_url)
    if filename:
        (get_local_uploads_directory() / PROFILE_IMAGE_DIRECTORY / filename).unlink(
            missing_ok=True
        )


def _delete_account_data(session: SessionDep, user_id: int) -> None:
    """Remove both private records and public copies in one database transaction."""
    user = session.get(User, user_id)
    profile_image_url = user.profile_image_url if user else None
    public_files = session.exec(
        select(PublishedMemory.image_filename)
        .join(
            PublishedConstellation,
            PublishedMemory.publication_id == PublishedConstellation.id,
        )
        .where(
            PublishedConstellation.owner_id == user_id,
            PublishedMemory.image_filename.is_not(None),
        )
    ).all()
    private_files = session.exec(
        select(StorySummary.image_url).where(
            StorySummary.user_id == user_id,
            StorySummary.image_url.startswith("disk-private://"),
        )
    ).all()
    try:
        session.exec(
            delete(ConstellationVote).where(ConstellationVote.user_id == user_id)
        )
        session.exec(
            delete(ConstellationReport).where(ConstellationReport.user_id == user_id)
        )
        session.exec(
            delete(PublishedConstellation).where(
                PublishedConstellation.owner_id == user_id
            )
        )
        session.exec(delete(Constellation).where(Constellation.owner_id == user_id))
        session.exec(delete(StoryEmbedding).where(StoryEmbedding.user_id == user_id))
        session.exec(
            delete(StoryRelationship).where(StoryRelationship.user_id == user_id)
        )
        session.exec(delete(MemoryDay).where(MemoryDay.user_id == user_id))
        session.exec(delete(MemoryXP).where(MemoryXP.user_id == user_id))
        session.exec(delete(Contact).where(Contact.user_id == user_id))
        session.exec(delete(Item).where(Item.owner_id == user_id))
        session.exec(delete(StorySummary).where(StorySummary.user_id == user_id))
        session.exec(delete(ChatMessage).where(ChatMessage.sender_id == user_id))
        session.exec(
            update(Conversation)
            .where(Conversation.user_id == user_id)
            .values(parent_conversation_id=None)
        )
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
    _delete_local_profile_image(profile_image_url)


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
    operation_id="create_user",
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
            image_url=stock_prompt.image_url,
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


@router.post("/me/profile-image", response_model=UserPublic)
async def upload_profile_image(
    session: SessionDep,
    current_user: CurrentUser,
    image: UploadFile = File(...),
) -> Any:
    data = await image.read(PROFILE_IMAGE_MAX_BYTES + 1)
    if len(data) > PROFILE_IMAGE_MAX_BYTES:
        raise HTTPException(
            status_code=413, detail="Profile image must be 5 MB or smaller"
        )
    detected = _profile_image_type(data)
    if not detected:
        raise HTTPException(
            status_code=400,
            detail="Choose a PNG, JPEG, or WebP image",
        )

    suffix, _ = detected
    directory = get_local_uploads_directory() / PROFILE_IMAGE_DIRECTORY
    try:
        directory.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4()}{suffix}"
        (directory / filename).write_bytes(data)
    except OSError as error:
        raise HTTPException(
            status_code=500, detail="Could not store the profile image"
        ) from error

    previous_image_url = current_user.profile_image_url
    current_user.profile_image_url = f"{PROFILE_IMAGE_ROUTE}{filename}"
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    _delete_local_profile_image(previous_image_url)
    return current_user


@router.delete("/me/profile-image", response_model=UserPublic)
def delete_profile_image(session: SessionDep, current_user: CurrentUser) -> Any:
    previous_image_url = current_user.profile_image_url
    current_user.profile_image_url = None
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    _delete_local_profile_image(previous_image_url)
    return current_user


@router.get("/profile-images/{filename}", include_in_schema=False)
def read_profile_image(filename: str) -> FileResponse:
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Profile image not found")
    detected_type = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".webp": "image/webp",
    }.get(Path(filename).suffix.lower())
    image_path = get_local_uploads_directory() / PROFILE_IMAGE_DIRECTORY / filename
    if not detected_type or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Profile image not found")
    return FileResponse(
        image_path,
        media_type=detected_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


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
