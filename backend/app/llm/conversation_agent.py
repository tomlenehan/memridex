from typing import AsyncIterable
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"

class Message(BaseModel):
    content: str

async def send_message(content: str, chat_history: list) -> AsyncIterable[str]:

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
