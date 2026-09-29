import logging
from collections.abc import AsyncIterable, Sequence
from typing import cast

from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.llm.utils import MODEL_NAME

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Message(BaseModel):
    content: str


async def send_message(
    content: str, system_prompt: str, chat_history: Sequence[BaseMessage]
) -> AsyncIterable[str]:
    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system}"),
            MessagesPlaceholder("history"),
            ("human", "{question}"),
        ]
    )

    chain = prompt | model

    try:
        async for chunk in chain.astream(
            {"system": system_prompt, "history": chat_history, "question": content}
        ):
            yield cast(str, chunk.content)
    except Exception as e:
        logger.error(f"Caught exception: {e}")
