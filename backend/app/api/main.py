from fastapi import APIRouter

from app.api.routes import (items, login, users, utils, user_story_prompts, categories, images,
                            conversations, chat_messages, story_summaries)

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(chat_messages.router, prefix="/chat_messages", tags=["chat_messages"])
api_router.include_router(user_story_prompts.router, prefix="/user_story_prompts", tags=["user_story_prompts"])
api_router.include_router(story_summaries.router, prefix="/summaries", tags=["summaries"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(images.router, prefix="/images", tags=["images"])