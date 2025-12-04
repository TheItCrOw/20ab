from datetime import datetime
from typing import List, Set
from pydantic import BaseModel, Field, model_validator

from models.round import Round


class Game(BaseModel):
    date: datetime
    rounds: List[Round] = Field(default_factory=list)
    winner: str
    loser: str

    participants: list[str] = Field(default_factory=set, exclude=True)

    @model_validator(mode="after")
    def compute_participants(self) -> "Game":
        self.participants = list({r.username for r in self.rounds})
        return self
