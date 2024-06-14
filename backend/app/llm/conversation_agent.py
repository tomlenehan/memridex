from typing import AsyncIterable
from langchain_openai import ChatOpenAI
from app.llm.utils import get_formatted_history
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel
from sqlmodel import Session
from app.models import Conversation
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"

class Message(BaseModel):
    content: str

async def send_message(content: str, conversation_id: int, session: Session) -> AsyncIterable[str]:

    conversation = session.get(Conversation, conversation_id)
    story_prompt = conversation.user_story_prompt

    system_prompt = (f"You are an AI tasked with interviewing the user "
                     f"about this story prompt {story_prompt}. continue to ask good follow-up "
                     f"questions based on their input.")

    chat_history, total_tokens = get_formatted_history(conversation_id, system_prompt, session)

    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            MessagesPlaceholder("history"),
            ("human", "{question}")
        ]
    )

    chain = prompt | model

    try:
        async for chunk in chain.astream({"question": content, "history": chat_history}):
            yield chunk.content
    except Exception as e:
        logger.error(f"Caught exception: {e}")
