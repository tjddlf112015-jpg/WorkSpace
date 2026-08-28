from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GameRecordCreate(BaseModel):
    score: int = Field(ge=0, le=10_000_000)
    lines_cleared: int = Field(default=0, ge=0, le=10_000)
    level: int = Field(default=1, ge=1, le=100)


class GameRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    score: int
    lines_cleared: int
    level: int
    played_at: datetime


class HighestScoreResponse(BaseModel):
    score: int
    email: str
    played_at: datetime
