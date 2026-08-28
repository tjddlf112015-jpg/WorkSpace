from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import GameRecord, User
from app.db.session import get_db
from app.schemas.game import HighestScoreResponse

router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("/highest", response_model=HighestScoreResponse | None)
def get_highest_score(db: Session = Depends(get_db)):
    statement = (
        select(GameRecord.score, User.email, GameRecord.played_at)
        .join(User, User.id == GameRecord.user_id)
        .order_by(GameRecord.score.desc(), GameRecord.played_at.asc(), GameRecord.id.asc())
        .limit(1)
    )
    result = db.execute(statement).first()
    if result is None:
        return None
    score, email, played_at = result
    return HighestScoreResponse(score=score, email=email, played_at=played_at)
