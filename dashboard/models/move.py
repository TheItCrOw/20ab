from pydantic import BaseModel


class Move(BaseModel):
    username: str
    value: int | None = 20
