# import os
# from typing import List
# from sqlmodel import Session, select, SQLModel, create_engine, Field
# from sqlalchemy import text
# from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# from langchain.schema import HumanMessage, AIMessage, SystemMessage
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain.vectorstores.faiss import FAISS
# import tiktoken
# import logging
#
# os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY") or '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'
#
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)
#
# MODEL_NAME = "gpt-4-turbo"
#
# # Dummy models for testing
# class ChatMessage(SQLModel, table=True):
#     id: int = Field(default=None, primary_key=True)
#     conversation_id: int
#     sender_type: str
#     content: str
#
# class Conversation(SQLModel, table=True):
#     id: int = Field(default=None, primary_key=True)
#     user_story_prompt: str
#
# class StorySummary(SQLModel, table=True):
#     id: int = Field(default=None, primary_key=True)
#     conversation_id: int
#     summary_text: str
#
# DATABASE_URL = "sqlite:///./test.db"
# engine = create_engine(DATABASE_URL, echo=True)
#
# # Create tables
# def init_db():
#     SQLModel.metadata.create_all(engine)
#
# # Clear existing data and add dummy data for testing
# def create_dummy_data():
#     with Session(engine) as session:
#         # Clear existing data
#         session.exec(text("DELETE FROM chatmessage"))
#         session.exec(text("DELETE FROM conversation"))
#         session.exec(text("DELETE FROM storysummary"))
#         session.commit()
#
#         # Add new dummy data
#         conversation = Conversation(id=1, user_story_prompt="Tell me about your day.")
#         session.add(conversation)
#         session.add_all([
#             ChatMessage(id=1, conversation_id=1, sender_type="USER", content="hi! I'm bob"),
#             ChatMessage(id=2, conversation_id=1, sender_type="AI", content="hi!"),
#             ChatMessage(id=3, conversation_id=1, sender_type="USER", content="I like vanilla ice cream"),
#             ChatMessage(id=4, conversation_id=1, sender_type="AI", content="nice"),
#             ChatMessage(id=5, conversation_id=1, sender_type="USER", content="whats 2 + 2"),
#             ChatMessage(id=6, conversation_id=1, sender_type="AI", content="4"),
#             ChatMessage(id=7, conversation_id=1, sender_type="USER", content="thanks"),
#             ChatMessage(id=8, conversation_id=1, sender_type="AI", content="no problem!"),
#             ChatMessage(id=9, conversation_id=1, sender_type="USER", content="having fun?"),
#             ChatMessage(id=10, conversation_id=1, sender_type="AI", content="yes!"),
#         ])
#         session.commit()
#
# def num_tokens_from_string(string: str) -> int:
#     """Returns the number of tokens in a text string."""
#     encoding = tiktoken.encoding_for_model(MODEL_NAME)
#     num_tokens = len(encoding.encode(string))
#     return num_tokens
#
# def get_formatted_history(conversation_id: int, session: Session) -> List:
#     conversation = session.get(Conversation, conversation_id)
#     story_prompt = conversation.user_story_prompt
#
#     chat_messages = session.exec(
#         select(ChatMessage)
#         .where(ChatMessage.conversation_id == conversation_id)
#         .order_by(ChatMessage.id.asc())
#     ).all()
#
#     messages = []
#     total_tokens = 0
#
#     if story_prompt:
#         system_prompt = (
#             f"You are an AI tasked with summarizing the conversation about the story prompt: {story_prompt}."
#         )
#         system_message = SystemMessage(content=system_prompt)
#         messages.append(system_message)
#         total_tokens += num_tokens_from_string(system_message.content)
#
#     for msg in chat_messages:
#         if msg.sender_type == "USER":
#             human_message = HumanMessage(content=msg.content)
#             messages.append(human_message)
#             total_tokens += num_tokens_from_string(human_message.content)
#         elif msg.sender_type == "AI":
#             ai_message = AIMessage(content=msg.content)
#             messages.append(ai_message)
#             total_tokens += num_tokens_from_string(ai_message.content)
#
#     logger.info(f"Total token count for conversation {conversation_id}: {total_tokens}")
#
#     return messages
#
# def index_messages(messages: List[HumanMessage]) -> FAISS:
#     # Convert messages to strings
#     message_texts = [message.content for message in messages]
#
#     # Create embeddings
#     embeddings = OpenAIEmbeddings()
#
#     # Create and populate the FAISS index
#     index = FAISS.from_texts(texts=message_texts, embedding=embeddings)
#
#     return index
#
# def get_relevant_messages(index: FAISS, query: str, k: int = 5) -> List[HumanMessage]:
#     # Perform the search on the index
#     docs = index.similarity_search(query, k=k)
#
#     # Extract the content of the documents
#     relevant_messages = [HumanMessage(content=doc.page_content) for doc in docs]
#
#     return relevant_messages
#
# def generate_summary(conversation_id: int, session: Session) -> str:
#     chat_history = get_formatted_history(conversation_id, session)
#
#     # Index messages
#     index = index_messages(chat_history)
#
#     # Get the relevant messages
#     relevant_messages = get_relevant_messages(index, "Please summarize this conversation")
#
#     model = ChatOpenAI(
#         model=MODEL_NAME,
#         streaming=False,
#         verbose=True,
#     )
#
#     prompt = ChatPromptTemplate.from_messages(
#         [
#             MessagesPlaceholder("history"),
#             ("human", "Please provide a summary of the conversation.")
#         ]
#     )
#
#     chain = prompt | model
#
#     try:
#         response = chain.invoke({"history": relevant_messages, "question": "Please provide a summary of the conversation."})
#         summary = response['output']
#         return summary
#     except Exception as e:
#         logger.error(f"Error generating summary: {e}")
#         return ""
#
# def save_summary(conversation_id: int, summary_text: str, session: Session):
#     story_summary = StorySummary(
#         conversation_id=conversation_id,
#         summary_text=summary_text
#     )
#     session.add(story_summary)
#     session.commit()
#     session.refresh(story_summary)
#     logger.info(f"Summary saved for conversation {conversation_id}")
#
# def summarize_conversation(conversation_id: int, session: Session):
#     summary = generate_summary(conversation_id, session)
#     if summary:
#         save_summary(conversation_id, summary, session)
#
# # Main function to run the script
# def main():
#     init_db()  # Initialize the database
#     create_dummy_data()  # Create dummy data
#     with Session(engine) as session:
#         summarize_conversation(1, session)
#
# if __name__ == '__main__':
#     main()
