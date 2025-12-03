from dataclasses import dataclass, field
from datetime import datetime
from typing import Union, List

from pydantic import BaseModel

from models.round import Round


class Game(BaseModel):
    date: datetime
    rounds: List[Round] = []
    winner: str # the username of the winner
    loser: str # the username of the loser