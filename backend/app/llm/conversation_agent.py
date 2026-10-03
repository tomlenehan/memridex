import logging
from collections.abc import AsyncIterable
from typing import Any

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.core.config import settings
from app.llm.tracing import llm_trace_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _ConversationChatOpenAI(ChatOpenAI):
    """Omit ChatOpenAI's default temperature for GPT-6 reasoning requests."""

    @property
    def _default_params(self) -> dict[str, Any]:
        params = super()._default_params
        # The pinned LangChain version adds temperature=0.7 to every request.
        params.pop("temperature", None)
        return params


class Message(BaseModel):
    content: str


async def send_message(
    content: str, system_prompt: str, chat_history: list
) -> AsyncIterable[str]:
    model = _ConversationChatOpenAI(
        model=settings.OPENAI_CONVERSATION_MODEL,
        streaming=True,
        model_kwargs={
            "extra_body": {
                "reasoning_effort": settings.OPENAI_CONVERSATION_REASONING_EFFORT
            }
        },
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
                    "model": settings.OPENAI_CONVERSATION_MODEL,
                    "reasoning_effort": settings.OPENAI_CONVERSATION_REASONING_EFFORT,
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
