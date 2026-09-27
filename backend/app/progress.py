"""Server-owned rewards. The caller commits the reward with the saved story."""
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session
from app.models import MemoryDay, MemoryXP


def award_saved_memory(session: Session, user_id: int, conversation_id: int) -> None:
    now = datetime.utcnow()
    reward_id = session.execute(
        insert(MemoryXP).values(user_id=user_id, conversation_key=conversation_id,
                                points=25, earned_at=now)
        .on_conflict_do_nothing(index_elements=["user_id", "conversation_key"])
        .returning(MemoryXP.id)
    ).scalar_one_or_none()
    if reward_id is not None:
        session.execute(
            insert(MemoryDay).values(user_id=user_id, activity_date=now.date())
            .on_conflict_do_nothing(index_elements=["user_id", "activity_date"])
        )
