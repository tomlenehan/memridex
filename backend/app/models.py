from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum

# Shared properties
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRegister(SQLModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserUpdate(UserBase):
    email: Optional[str] = None  # type: ignore
    password: Optional[str] = None

class UserUpdateMe(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None

class UpdatePassword(SQLModel):
    current_password: str
    new_password: str

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    items: List["Item"] = Relationship(back_populates="owner")
    user_story_prompts: List["UserStoryPrompt"] = Relationship(back_populates="user")
    conversations: List["Conversation"] = Relationship(back_populates="user")
    chat_messages: List["ChatMessage"] = Relationship(back_populates="sender")
    story_summaries: List["StorySummary"] = Relationship(back_populates="user")
    contacts: List["Contact"] = Relationship(back_populates="user")

class UserPublic(UserBase):
    id: int
    user_story_prompts: List["UserStoryPrompt"]
    conversations: List["Conversation"]
    chat_messages: List["ChatMessage"]
    story_summaries: List["StorySummary"]
    contacts: List["Contact"]

class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int

class ItemBase(SQLModel):
    title: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    title: str

class ItemUpdate(ItemBase):
    title: Optional[str] = None  # type: ignore

class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    owner_id: int = Field(foreign_key="user.id", nullable=False)
    owner: Optional[User] = Relationship(back_populates="items")

class ItemPublic(ItemBase):
    id: int
    owner_id: int

class ItemsPublic(SQLModel):
    data: List[ItemPublic]
    count: int

class Image(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    link: str
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class ImageCreate(SQLModel):
    link: str
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class ImageUpdate(SQLModel):
    link: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = Field(default_factory=datetime.utcnow)

class ImagePublic(ImageCreate):
    id: int

class ImagesPublic(SQLModel):
    data: List[ImagePublic]
    count: int

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    stock_story_prompts: List["StockStoryPrompt"] = Relationship(back_populates="category")
    user_story_prompts: List["UserStoryPrompt"] = Relationship(back_populates="category")

class CategoryCreate(SQLModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CategoryPublic(CategoryCreate):
    id: int

class CategoriesPublic(SQLModel):
    data: List[CategoryPublic]
    count: int

class StockStoryPrompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    category: Optional[Category] = Relationship(back_populates="stock_story_prompts")
    image_url: Optional[str] = None  # New field for image URL

class UserStoryPrompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    user_id: int = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="user_story_prompts")
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    category: Optional[Category] = Relationship(back_populates="user_story_prompts")
    image_url: Optional[str] = None  # New field for image URL
    conversations: List["Conversation"] = Relationship(back_populates="user_story_prompt")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    modified_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class UserStoryPromptCreate(SQLModel):
    prompt: str
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime]
    modified_at: Optional[datetime]

class UserStoryPromptUpdate(SQLModel):
    prompt: Optional[str] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None

class UserStoryPromptPublic(UserStoryPromptCreate):
    id: int
    user_id: int
    category: Optional[Category]

class UserStoryPromptsPublic(SQLModel):
    data: List[UserStoryPromptPublic]
    count: int

class ConversationStatus(str, Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    READY_FOR_SUMMARY = "ready_for_summary"
    COMPLETE = "complete"

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="conversations")
    user_story_prompt_id: int = Field(foreign_key="userstoryprompt.id")
    user_story_prompt: Optional[UserStoryPrompt] = Relationship(back_populates="conversations")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    chat_messages: List["ChatMessage"] = Relationship(back_populates="conversation")
    status: ConversationStatus = Field(default=ConversationStatus.INACTIVE)
    story_summary: Optional["StorySummary"] = Relationship(back_populates="conversation")
    token_total: int = Field(default=0)

class ChatMessageSender(str, Enum):
    USER = "user"
    AI = "ai"
    FINAL = "final"

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    conversation: Optional[Conversation] = Relationship(back_populates="chat_messages")
    sender_id: int = Field(foreign_key="user.id")
    sender: Optional[User] = Relationship(back_populates="chat_messages")
    sender_type: ChatMessageSender = Field(default=ChatMessageSender.USER)
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StorySummary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    user_id: int = Field(foreign_key="user.id", nullable=False)
    conversation: Optional["Conversation"] = Relationship(back_populates="story_summary")
    user: Optional["User"] = Relationship(back_populates="story_summaries")
    title: Optional[str] = None
    summary_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
    image_url: Optional[str] = None

class StorySummaryPublic(SQLModel):
    id: int
    conversation_id: int
    title: Optional[str] = None
    summary_text: str
    image_url: Optional[str] = None
    created_at: datetime
    modified_at: Optional[datetime]

class StorySummaryCreate(SQLModel):
    conversation_id: int
    user_id: int
    summary_text: str
    title: Optional[str] = None
    image_url: Optional[str] = None

class StorySummaryUpdate(SQLModel):
    id: int
    title: Optional[str] = None
    summary_text: str
    image_url: Optional[str] = None
    modified_at: Optional[datetime]

class ConversationCreate(SQLModel):
    user_story_prompt_id: int

class ConversationPublic(ConversationCreate):
    id: int
    created_at: datetime
    status: ConversationStatus = Field(default=ConversationStatus.INACTIVE)

class ChatMessageCreate(SQLModel):
    sender_type: ChatMessageSender
    content: str

class ChatMessagePublic(ChatMessageCreate):
    id: int
    timestamp: datetime

class ConversationsPublic(SQLModel):
    data: List[ConversationPublic]
    count: int

class ChatMessagesPublic(SQLModel):
    data: List[ChatMessagePublic]
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
    sub: Optional[int] = None

class NewPassword(SQLModel):
    token: str
    new_password: str


class ContactBase(SQLModel):
    email: str

class Contact(ContactBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional["User"] = Relationship(back_populates="contacts")

class ContactCreate(ContactBase):
    pass

class ContactRead(ContactBase):
    id: int
    created_at: datetime

class ContactUpdate(SQLModel):
    email: Optional[str] = None
