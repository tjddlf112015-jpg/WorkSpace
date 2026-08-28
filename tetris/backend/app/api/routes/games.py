from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import GameRecord, User
from app.db.session import get_db
from app.schemas.game import GameRecordCreate, GameRecordResponse

router = APIRouter(prefix="/games", tags=["games"])


@router.post("/records", response_model=GameRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    payload: GameRecordCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    record = GameRecord(user_id=current_user.id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records/me", response_model=list[GameRecordResponse])
def get_my_records(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    statement = (
        select(GameRecord)
        .where(GameRecord.user_id == current_user.id)
        .order_by(GameRecord.played_at.desc(), GameRecord.id.desc())
    )
    return list(db.scalars(statement).all())
