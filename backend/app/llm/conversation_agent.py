import logging
from collections.abc import AsyncIterable

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.llm.tracing import llm_trace_config
from app.llm.utils import MODEL_NAME

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Message(BaseModel):
    content: str


async def send_message(
    content: str, system_prompt: str, chat_history: list
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

    emitted_text = False
    try:
        async for chunk in chain.astream(
            {"system": system_prompt, "history": chat_history, "question": content},
            config=llm_trace_config(
                "conversation.reply",
                metadata={
                    "model": MODEL_NAME,
                },
            ),
        ):
            if isinstance(chunk.content, str) and chunk.content:
                emitted_text = True
                yield chunk.content
        if not emitted_text:
            raise RuntimeError("Conversation model returned no text")
    except Exception as error:
        # Do not save an empty assistant turn or log private conversation content.
        logger.error("Conversation response failed (%s)", type(error).__name__)
        raise
