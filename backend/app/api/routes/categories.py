from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Category, CategoryCreate, CategoryPublic, CategoriesPublic, CategoryUpdate, Message

router = APIRouter()

@router.get("/", response_model=CategoriesPublic)
def read_categories(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve categories.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Category)
        count = session.exec(count_statement).one()
        statement = select(Category).offset(skip).limit(limit)
        categories = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Category)
            .where(Category.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Category)
            .where(Category.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        categories = session.exec(statement).all()

    return CategoriesPublic(data=categories, count=count)


@router.get("/{id}", response_model=CategoryPublic)
def read_category(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get category by ID.
    """
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not current_user.is_superuser and (category.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return category


@router.post("/", response_model=CategoryPublic)
def create_category(
    *, session: SessionDep, current_user: CurrentUser, category_in: CategoryCreate
) -> Any:
    """
    Create new category.
    """
    category = Category.model_validate(category_in, update={"owner_id": current_user.id})
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.put("/{id}", response_model=CategoryPublic)
def update_category(
    *, session: SessionDep, current_user: CurrentUser, id: int, category_in: CategoryUpdate
) -> Any:
    """
    Update a category.
    """
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not current_user.is_superuser and (category.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = category_in.model_dump(exclude_unset=True)
    category.sqlmodel_update(update_dict)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.delete("/{id}")
def delete_category(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
    """
    Delete a category.
    """
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not current_user.is_superuser and (category.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(category)
    session.commit()
    return Message(message="Category deleted successfully")
