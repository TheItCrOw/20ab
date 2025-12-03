from dataclasses import dataclass

from pydantic import BaseModel


class Round(BaseModel):
    username: str
    value: int | None = 20