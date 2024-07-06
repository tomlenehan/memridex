import tiktoken
from sqlmodel import Session, select
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from app.models import ChatMessage
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"
# MODEL_NAME = "gpt-3.5-turbo"
STORY_TOKEN_LIMIT = 40

def num_tokens_from_string(string: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(MODEL_NAME)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def get_formatted_history(conversation_id: int, session: Session) -> tuple[
    list[HumanMessage | AIMessage | SystemMessage], int]:

    chat_messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.id.asc())
    ).all()

    messages = []
    total_tokens = 0

    for msg in chat_messages:
        if msg.sender_type == "user":
            human_message = HumanMessage(content=msg.content)
            messages.append(human_message)
            total_tokens += num_tokens_from_string(human_message.content)
        elif msg.sender_type == "ai":
            ai_message = AIMessage(content=msg.content)
            messages.append(ai_message)
            total_tokens += num_tokens_from_string(ai_message.content)

    logger.error(f"Formatted messages: {messages}")
    logger.info(f"Total token count for conversation {conversation_id}: {total_tokens}")

    return messages, total_tokens

