from typing import List
from sqlmodel import Session, select
from app.models import ChatMessage, Conversation, StorySummary
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings
from pydantic import BaseModel
import tiktoken
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"


class Message(BaseModel):
    content: str


def num_tokens_from_string(string: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(MODEL_NAME)
    num_tokens = len(encoding.encode(string))
    return num_tokens


async def get_formatted_history(conversation_id: int, session: Session) -> List[Message]:
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
        system_prompt = (
            f"You are an AI tasked with summarizing the conversation about the story prompt: {story_prompt}.")
        system_message = SystemMessage(content=system_prompt)
        messages.append(system_message)
        total_tokens += num_tokens_from_string(system_message.content)

    for msg in chat_messages:
        if msg.sender_type == "USER":
            human_message = HumanMessage(content=msg.content)
            messages.append(human_message)
            total_tokens += num_tokens_from_string(human_message.content)
        elif msg.sender_type == "AI":
            ai_message = AIMessage(content=msg.content)
            messages.append(ai_message)
            total_tokens += num_tokens_from_string(ai_message.content)

    logger.info(f"Total token count for conversation {conversation_id}: {total_tokens}")

    return messages


async def index_messages(messages: List[Message]) -> FAISS:
    # Convert messages to strings
    message_texts = [message.content for message in messages]

    # Create embeddings
    embeddings = OpenAIEmbeddings()

    # Create and populate the FAISS index
    index = FAISS.from_texts(texts=message_texts, embedding=embeddings)

    return index


async def get_relevant_messages(index: FAISS, query: str, k: int = 5) -> List[Message]:
    # Perform the search on the index
    docs = index.similarity_search(query, k=k)

    # Extract the content of the documents
    relevant_messages = [Message(content=doc.page_content) for doc in docs]

    return relevant_messages


async def generate_summary(conversation_id: int, session: Session) -> str:
    chat_history = await get_formatted_history(conversation_id, session)

    # Index messages
    index = await index_messages(chat_history)

    # Get the relevant messages
    relevant_messages = await get_relevant_messages(index, "Please summarize this conversation")

    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=False,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            MessagesPlaceholder("history"),
            ("human", "Please provide a summary of the conversation.")
        ]
    )

    chain = prompt | model

    try:
        response = await chain({"history": relevant_messages,
                                "question": "Please provide a summary of the conversation."})
        summary = response['output']
        return summary
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return ""


async def save_summary(conversation_id: int, summary_text: str, session: Session):
    story_summary = StorySummary(
        conversation_id=conversation_id,
        summary_text=summary_text
    )
    session.add(story_summary)
    session.commit()
    session.refresh(story_summary)
    logger.info(f"Summary saved for conversation {conversation_id}")


async def summarize_conversation(conversation_id: int, session: Session):
    summary = await generate_summary(conversation_id, session)
    if summary:
        await save_summary(conversation_id, summary, session)
