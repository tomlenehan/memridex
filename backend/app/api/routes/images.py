from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select, Session

from app.api.deps import CurrentUser, SessionDep
from app.models import Image, ImagePublic, ImagesPublic, ImageCreate, ImageUpdate, Message

router = APIRouter()


@router.get("/", response_model=ImagesPublic)
def read_images(
        session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve images.
    """
    count_statement = select(func.count()).select_from(Image)
    count = session.exec(count_statement).one()
    statement = select(Image).offset(skip).limit(limit)
    images = session.exec(statement).all()
    return ImagesPublic(data=images, count=count)


@router.get("/{id}", response_model=ImagePublic)
def read_image(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get image by ID.
    """
    image = session.get(Image, id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.post("/", response_model=ImagePublic)
def create_image(
        *, session: SessionDep, current_user: CurrentUser, image_in: ImageCreate
) -> Any:
    """
    Create new image.
    """
    image = Image.from_orm(image_in)
    session.add(image)
    session.commit()
    session.refresh(image)
    return image


@router.put("/{id}", response_model=ImagePublic)
def update_image(
        *, session: SessionDep, current_user: CurrentUser, id: int, image_in: ImageUpdate
) -> Any:
    """
    Update an image.
    """
    image = session.get(Image, id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    update_dict = image_in.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(image, key, value)
    session.add(image)
    session.commit()
    session.refresh(image)
    return image


@router.delete("/{id}")
def delete_image(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
    """
    Delete an image.
    """
    image = session.get(Image, id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    session.delete(image)
    session.commit()
    return Message(message="Image deleted successfully")
