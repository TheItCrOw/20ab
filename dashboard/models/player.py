from dataclasses import dataclass

from pydantic import BaseModel


class Player(BaseModel):
    username: str
    name: str = ""