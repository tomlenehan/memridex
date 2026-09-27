from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import select
from app.api.deps import CurrentUser, SessionDep
from app.models import MemoryDay, MemoryXP

router = APIRouter()


class ProgressPublic(BaseModel):
    total_xp: int
    level: int
    level_xp: int
    next_level_xp: int = 100
    streak: int
    best_streak: int
    saved_memories: int
    active_dates: list[str]
    today: str
    timezone: str = "UTC"


@router.get("/", response_model=ProgressPublic)
def read_progress(session: SessionDep, current_user: CurrentUser) -> ProgressPublic:
    total = session.exec(select(func.coalesce(func.sum(MemoryXP.points), 0))
                         .where(MemoryXP.user_id == current_user.id)).one()
    count = session.exec(select(func.count(MemoryXP.id))
                         .where(MemoryXP.user_id == current_user.id)).one()
    days = session.exec(select(MemoryDay.activity_date)
                        .where(MemoryDay.user_id == current_user.id)
                        .order_by(MemoryDay.activity_date)).all()
    today = datetime.utcnow().date()
    best = run = 0
    previous = None
    for day in days:
        run = run + 1 if previous and day == previous + timedelta(days=1) else 1
        best = max(best, run)
        previous = day
    streak = run if previous in (today, today - timedelta(days=1)) else 0
    return ProgressPublic(total_xp=total, level=total // 100 + 1, level_xp=total % 100,
                          streak=streak, best_streak=best, saved_memories=count,
                          active_dates=[d.isoformat() for d in days if d >= today - timedelta(days=6)],
                          today=today.isoformat())
