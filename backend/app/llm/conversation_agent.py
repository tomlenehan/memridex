from typing import AsyncIterable, Tuple
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import tiktoken
from pydantic import BaseModel
from sqlmodel import func, Session, select
from app.models import (
    ChatMessage,
    Conversation
)

class Message(BaseModel):
    content: str

MODEL_NAME = "gpt-3.5-turbo"

import logging
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def num_tokens_from_string(string: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(MODEL_NAME)
    num_tokens = len(encoding.encode(string))
    return num_tokens


async def get_formatted_history(conversation_id: int, session: Session):

    conversation = session.get(Conversation, conversation_id)

    story_prompt = conversation.user_story_prompt.prompt

    chat_messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.timestamp.asc())
    ).all()


    messages = []
    total_tokens = 0

    if story_prompt:
        system_prompt = (f"You are an AI tasked with interviewing the user "
                         f"about this story prompt {story_prompt}. continue to ask good follow-up "
                         f"questions based on their input.")
        system_message = SystemMessage(content=system_prompt)
        messages.append(system_message)
        total_tokens += num_tokens_from_string(system_message.content)

    for msg in chat_messages:
        if msg.sender_type == "HUMAN":
            human_message = HumanMessage(content=msg.content)
            messages.append(human_message)
            total_tokens += num_tokens_from_string(human_message.content)
        elif msg.sender_type == "AI":
            ai_message = AIMessage(content=msg.content)
            messages.append(ai_message)
            total_tokens += num_tokens_from_string(ai_message.content)

    logger.info(f"Total token count for conversation {conversation_id}: {total_tokens}")

    return messages, total_tokens

async def send_message(content: str, conversation_id: int, session: Session) -> AsyncIterable[str]:

    chat_history, total_tokens = await get_formatted_history(conversation_id, session)

    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            # ("system", "You are a helpful assistant."),
            MessagesPlaceholder("history"),
            ("human", "{question}")
        ]
    )

    chain = prompt | model

    try:
        async for chunk in chain.astream({"question": content, "history": chat_history}):
            yield chunk.content
    except Exception as e:
        print(f"Caught exception: {e}")
