import json
import os
from functools import lru_cache
from datetime import date, datetime
from pathlib import Path
from typing import List

import constants
from models.game import Game
from models.player import Player
from models.round import Round


class DataService:
    def __init__(self, data_path: str):
        print("Initializing first DataService...")
        self.data_path = data_path
        self.players = self._load_players()
        self.games = self._load_games()
        print("Loaded all data, cached it; ready to work.")

    def get_player_by_username(self, username: str) -> Player:
        for player in self.players:
            if player.username == username:
                return player
        raise ValueError(f"Player with username '{username}' not found.")

    def get_all_players(self) -> list[Player]:
        return self.players

    def get_all_games(self) -> list[Game]:
        return self.games

    def get_games(self, start_date: datetime, end_date: datetime, players: list[str]) -> list[Game]:
        """Returns a filtered and sorted (date, desc) list of games."""
        filtered_games = self.games

        if start_date and end_date:
            filtered_games = [
                game for game in filtered_games
                if start_date <= game.date <= end_date
            ]

        if players:
            players_set = set(players)
            filtered_games = [
                game for game in filtered_games
                if players_set.intersection(game.participants)
            ]

        return sorted(filtered_games, key=lambda game: game.date, reverse=True)

    def _load_players(self) -> list[Player]:
        path = os.path.join(self.data_path, "players.json")
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        return [Player(**p) for p in raw]

    def _load_games(self) -> list[Game]:
        games_dir = Path(os.path.join(self.data_path, "games"))
        games: list[Game] = []

        for path in games_dir.glob("*.json"):
            with path.open("r", encoding="utf-8") as f:
                raw = json.load(f)

            game = Game.model_validate(raw)
            games.append(game)

        return games


@lru_cache(maxsize=1)
def get_data_service() -> DataService:
    return DataService(constants.DATA_PATH)
