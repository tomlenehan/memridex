import hashlib
import logging
from datetime import datetime

from langchain_openai import OpenAIEmbeddings
from sqlmodel import Session, select

from app.core.config import settings
from app.models import StoryEmbedding, StorySummary

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"


def story_embedding_text(story: StorySummary) -> str:
    return f"{story.title or ''}\n{story.summary_text}".strip()


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        api_key=settings.OPENAI_API_KEY,
    )
    return embeddings.embed_documents(texts)


def ensure_story_embedding(session: Session, story: StorySummary) -> StoryEmbedding:
    text = story_embedding_text(story)
    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    embedding_row = session.exec(
        select(StoryEmbedding).where(
            StoryEmbedding.story_summary_id == story.id,
            StoryEmbedding.user_id == story.user_id,
        )
    ).first()

    if embedding_row and embedding_row.content_hash == content_hash:
        return embedding_row

    vector = embed_texts([text])[0]
    if embedding_row:
        embedding_row.embedding = vector
        embedding_row.content_hash = content_hash
        embedding_row.modified_at = datetime.utcnow()
    else:
        embedding_row = StoryEmbedding(
            user_id=story.user_id,
            story_summary_id=story.id,
            embedding=vector,
            embedding_model=EMBEDDING_MODEL,
            content_hash=content_hash,
        )
    session.add(embedding_row)
    return embedding_row


def ensure_user_story_embeddings(session: Session, user_id: int) -> None:
    stories = session.exec(
        select(StorySummary).where(StorySummary.user_id == user_id)
    ).all()
    existing = session.exec(
        select(StoryEmbedding).where(StoryEmbedding.user_id == user_id)
    ).all()
    by_story_id = {row.story_summary_id: row for row in existing}
    pending: list[tuple[StorySummary, str, str]] = []

    for story in stories:
        text = story_embedding_text(story)
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        row = by_story_id.get(story.id)
        if not row or row.content_hash != content_hash:
            pending.append((story, text, content_hash))

    for offset in range(0, len(pending), 64):
        batch = pending[offset : offset + 64]
        vectors = embed_texts([text for _, text, _ in batch])
        for (story, _, content_hash), vector in zip(batch, vectors, strict=True):
            row = by_story_id.get(story.id)
            if row:
                row.embedding = vector
                row.content_hash = content_hash
                row.embedding_model = EMBEDDING_MODEL
                row.modified_at = datetime.utcnow()
            else:
                row = StoryEmbedding(
                    user_id=user_id,
                    story_summary_id=story.id,
                    embedding=vector,
                    embedding_model=EMBEDDING_MODEL,
                    content_hash=content_hash,
                )
                by_story_id[story.id] = row
            session.add(row)
    if pending:
        session.commit()
