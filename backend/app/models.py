from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
# TODO replace email str with EmailStr when sqlmodel supports it
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# TODO replace email str with EmailStr when sqlmodel supports it
class UserRegister(SQLModel):
    email: str
    password: str
    full_name: str | None = None


# Properties to receive via API on update, all are optional
# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdate(UserBase):
    email: str | None = None  # type: ignore
    password: str | None = None


# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdateMe(SQLModel):
    full_name: str | None = None
    email: str | None = None


class UpdatePassword(SQLModel):
    current_password: str
    new_password: str


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str
    items: List["Item"] = Relationship(back_populates="owner")
    user_story_prompts: List["UserStoryPrompt"] = Relationship(back_populates="user")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: int


class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str
    description: str | None = None


# Properties to receive on item creation
class ItemCreate(ItemBase):
    title: str


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = None  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    owner_id: int | None = Field(default=None, foreign_key="user.id", nullable=False)
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: int
    owner_id: int


class ItemsPublic(SQLModel):
    data: List[ItemPublic]
    count: int


# Model for Images
class Image(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    link: str
    description: str | None = None
    date: datetime = Field(default_factory=datetime.utcnow)
    stock_story_prompts: List["StockStoryPrompt"] = Relationship(back_populates="image")
    user_story_prompts: List["UserStoryPrompt"] = Relationship(back_populates="image")


# Model for Categories
class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None
    stock_story_prompts: List["StockStoryPrompt"] = Relationship(back_populates="category")
    user_story_prompts: List["UserStoryPrompt"] = Relationship(back_populates="category")


# Properties to receive on category creation
class CategoryCreate(SQLModel):
    name: str
    description: Optional[str] = None


# Properties to receive on category update
class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


# Properties to return via API, id is always required
class CategoryPublic(CategoryCreate):
    id: int


class CategoriesPublic(SQLModel):
    data: List[CategoryPublic]
    count: int

# Model for Stock Story Prompts
class StockStoryPrompt(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    prompt: str
    category_id: int | None = Field(default=None, foreign_key="category.id")
    category: Optional[Category] = Relationship(back_populates="stock_story_prompts")
    image_id: int | None = Field(default=None, foreign_key="image.id")
    image: Optional[Image] = Relationship(back_populates="stock_story_prompts")


# Model for User Story Prompts
class UserStoryPrompt(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    prompt: str
    user_id: int = Field(foreign_key="user.id")
    user: User | None = Relationship(back_populates="user_story_prompts")
    category_id: int | None = Field(default=None, foreign_key="category.id")
    category: Optional[Category] = Relationship(back_populates="user_story_prompts")
    image_id: int | None = Field(default=None, foreign_key="image.id")
    image: Optional[Image] = Relationship(back_populates="user_story_prompts")


# Properties to receive on user story prompt creation
class UserStoryPromptCreate(SQLModel):
    prompt: str
    category_id: Optional[int] = None
    image_id: Optional[int] = None


# Properties to receive on user story prompt update
class UserStoryPromptUpdate(SQLModel):
    prompt: Optional[str] = None
    category_id: Optional[int] = None
    image_id: Optional[int] = None


# Properties to return via API, id is always required
class UserStoryPromptPublic(UserStoryPromptCreate):
    id: int
    user_id: int


class UserStoryPromptsPublic(SQLModel):
    data: List[UserStoryPromptPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: int | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str
