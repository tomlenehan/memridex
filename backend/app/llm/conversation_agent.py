from typing import AsyncIterable
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel
from sqlmodel import func, Session, select
from app.models import (
    ChatMessage,
    Conversation
)
class Message(BaseModel):
    content: str


async def get_formatted_history(conversation_id: int, session: Session):

    conversation = session.get(Conversation, conversation_id)

    story_prompt = conversation.user_story_prompt.prompt

    chat_messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.timestamp.asc())
    ).all()

    # Convert chat messages to the desired format
    messages = []
    if story_prompt:
        system_prompt = (f"You are an AI journalist tasked with interviewing the user "
                         f"regarding {story_prompt}. continue to ask good follow-up"
                         f"questions based on their input.")
        messages.append(SystemMessage(content=system_prompt))

    for msg in chat_messages:
        if msg.sender_type == "HUMAN":
            messages.append(HumanMessage(content=msg.content))
        elif msg.sender_type == "AI":
            messages.append(AIMessage(content=msg.content))

    return messages

async def send_message(content: str, conversation_id: int, session: Session) -> AsyncIterable[str]:

    chat_history = await get_formatted_history(conversation_id, session)

    model = ChatOpenAI(
        model="gpt-3.5-turbo",
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
        for chunk in chain.stream({"question": content, "history": chat_history}):
            yield chunk.content
    except Exception as e:
        print(f"Caught exception: {e}")
