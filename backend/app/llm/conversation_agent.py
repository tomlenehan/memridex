from typing import AsyncIterable
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel
from app.llm.utils import MODEL_NAME
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Message(BaseModel):
    content: str

async def send_message(content: str, system_prompt: str, chat_history: list) -> AsyncIterable[str]:

    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [   ("system", "{system}"),
            MessagesPlaceholder("history"),
            ("human", "{question}")
        ]
    )

    chain = prompt | model

    try:
        async for chunk in chain.astream({"system": system_prompt, "history": chat_history, "question": content}):
            yield chunk.content
    except Exception as e:
        logger.error(f"Caught exception: {e}")
