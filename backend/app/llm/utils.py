import logging

import tiktoken
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from sqlmodel import Session, select

from app.models import ChatMessage, Conversation, ConversationStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"
# MODEL_NAME = "gpt-3.5-turbo"
MIN_READY_USER_TURNS = 2
MAX_NODE_USER_TURNS = 8

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

    logger.debug("Formatted %s messages for conversation %s", len(messages), conversation_id)
    logger.info("Total token count for conversation %s: %s", conversation_id, total_tokens)

    return messages, total_tokens


def refresh_story_status(conversation: Conversation, session: Session) -> None:
    if conversation.id is None:
        return
    _, total_tokens = get_formatted_history(conversation.id, session)
    conversation.token_total = total_tokens
    if (
        conversation.user_turn_count >= MAX_NODE_USER_TURNS
        and conversation.status == ConversationStatus.ACTIVE
    ):
        conversation.status = ConversationStatus.READY_FOR_SUMMARY
        conversation.ready_to_save = True
    session.add(conversation)
