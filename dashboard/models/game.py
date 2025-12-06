from datetime import datetime
from typing import List, Set
from pydantic import BaseModel, Field, model_validator

from models.round import Round


class Game(BaseModel):
    date: datetime
    rounds: list[Round] = Field(default_factory=list)
    winner: str
    loser: str

    participants: list[str] = Field(default_factory=list, exclude=True)

    @model_validator(mode="after")
    def compute_participants(self) -> "Game":
        usernames = {
            move.username
            for rnd in self.rounds
            for move in rnd.moves
        }
        self.participants = list(usernames)
        return self
