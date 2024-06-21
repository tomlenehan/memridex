from typing import AsyncIterable, List
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import FAISS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-4-turbo"

async def index_messages(messages: List[HumanMessage]) -> FAISS:
    message_texts = [message.content for message in messages]

    embeddings = OpenAIEmbeddings()

    index = FAISS.from_texts(texts=message_texts, embedding=embeddings)

    return index

async def get_relevant_messages(index: FAISS, query: str, k: int = 20) -> List[HumanMessage]:
    docs = index.similarity_search(query, k=k)

    relevant_messages = [HumanMessage(content=doc.page_content) for doc in docs]

    return relevant_messages

async def generate_summary(system_prompt: str, chat_history: List[HumanMessage]) -> AsyncIterable[str]:
    index = await index_messages(chat_history)
    relevant_messages = await get_relevant_messages(index, "Please summarize this conversation")

    model = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        verbose=True,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system}"),
            MessagesPlaceholder("history"),
        ]
    )

    chain = prompt | model

    try:
        async for chunk in chain.astream({"system": system_prompt, "history": relevant_messages}):
            yield chunk.content
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise e
