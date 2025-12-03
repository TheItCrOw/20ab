import json
import os
from datetime import datetime
from pathlib import Path
from typing import List

from models.game import Game
from models.player import Player
from models.round import Round


class DataService:
    def __init__(self, data_path : str):
        self.data_path = data_path

    def get_all_players(self) -> list[Player]:
        path = os.path.join(self.data_path, "players.json")
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        return [Player(**p) for p in raw]

    def get_all_games(self) -> list[Game]:
        games_dir = Path(os.path.join(self.data_path, "games"))
        games: list[Game] = []

        for path in games_dir.glob("*.json"):
            with path.open("r", encoding="utf-8") as f:
                raw = json.load(f)

            game = Game.model_validate(raw)
            games.append(game)

        return games
