import pytest
from fastapi import HTTPException
from sqlmodel import Session, create_engine

from app.api.routes.constellations import _owned
from app.api.routes import story_summaries
from app.core.security import get_password_hash
from app.models import Constellation, Conversation, StorySummary, User


def test_a_constellation_is_invisible_to_a_different_user():
    engine = create_engine("sqlite://")
    User.__table__.create(engine)
    Constellation.__table__.create(engine)
    try:
        with Session(engine) as session:
            owner = User(email="owner@example.com", hashed_password=get_password_hash("secret"))
            visitor = User(email="visitor@example.com", hashed_password=get_password_hash("secret"))
            session.add(owner)
            session.add(visitor)
            session.commit()
            session.refresh(owner)
            session.refresh(visitor)

            constellation = Constellation(owner_id=owner.id, title="A private shape")
            session.add(constellation)
            session.commit()
            session.refresh(constellation)

            with pytest.raises(HTTPException) as error:
                _owned(session, visitor.id, constellation.id)
            assert error.value.status_code == 404
    finally:
        engine.dispose()


def test_a_memory_cannot_be_edited_by_a_different_user():
    story = StorySummary(conversation_id=12, user_id=1, summary_text="A private memory")
    conversation = Conversation(user_id=1)

    class SessionStub:
        def get(self, model, _id):
            if model is StorySummary:
                return story
            if model is Conversation:
                return conversation
            return None

        def close(self):
            pass

    visitor = User(id=2, email="visitor@example.com", hashed_password="not-used", is_superuser=True)
    with pytest.raises(HTTPException) as error:
        story_summaries.update_story_summary(
            id=story.id or 1,
            session=SessionStub(),
            current_user=visitor,
            title="Attempted change",
        )
    assert error.value.status_code == 400
