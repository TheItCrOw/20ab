from dataclasses import dataclass

from pydantic import BaseModel

from models.move import Move


class Round(BaseModel):
    moves: list["Move"]
