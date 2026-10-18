import json
import os
import threading
from datetime import datetime
from pathlib import Path

import constants
from models.game import Game
from models.player import Player


class DataService:
    def __init__(self, data_path: str):
        self._data_path = data_path
        self._games_dir = Path(os.path.join(data_path, "games"))
        self._players_path = os.path.join(data_path, "players.json")
        self._lock = threading.Lock()

        # Cached data
        self._players: list[Player] = []
        self._games: list[Game] = []

        # mtime tracking
        self._games_fingerprint: float = 0.0
        self._players_mtime: float = 0.0

        # Initial load (blocking, before any requests)
        players, players_mt = self._read_players()
        games, games_fp = self._read_games()
        self._players = players
        self._players_mtime = players_mt
        self._games = games
        self._games_fingerprint = games_fp

    def _games_dir_fingerprint(self) -> float:
        """Sum of dir mtime + all game file mtimes. Catches adds, deletes, AND edits."""
        total = os.path.getmtime(self._games_dir)
        for path in self._games_dir.glob("*.json"):
            total += os.path.getmtime(path)
        return total

    def _needs_reload(self) -> bool:
        """Check if data files changed on disk."""
        try:
            return (
                self._games_dir_fingerprint() != self._games_fingerprint
                or os.path.getmtime(self._players_path) != self._players_mtime
            )
        except OSError:
            return False

    def _do_reload(self):
        """Read everything from disk (expensive), then swap under lock."""
        # Read outside the lock so other threads can still serve cached data
        players, players_mt = self._read_players()
        games, games_fp = self._read_games()

        with self._lock:
            self._players = players
            self._players_mtime = players_mt
            self._games = games
            self._games_fingerprint = games_fp
            print(f"[DataService] Reloaded: {len(games)} games, {len(players)} players")

    def _maybe_reload(self):
        """Reload if files changed on disk. Non-blocking for readers."""
        if self._needs_reload():
            self._do_reload()

    def _read_players(self) -> tuple[list[Player], float]:
        mtime = os.path.getmtime(self._players_path)
        with open(self._players_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        return [Player(**p) for p in raw], mtime

    def _read_games(self) -> tuple[list[Game], float]:
        fingerprint = self._games_dir_fingerprint()
        games: list[Game] = []
        for path in self._games_dir.glob("*.json"):
            try:
                with path.open("r", encoding="utf-8") as f:
                    raw = json.load(f)
                games.append(Game.model_validate(raw))
            except Exception as e:
                print(f"Warning: skipping {path.name} — {e}")
        return games, fingerprint

    # ── Public API ────────────────────────────────────

    def get_all_players(self) -> list[Player]:
        self._maybe_reload()
        return self._players

    def get_player_by_username(self, username: str) -> Player:
        self._maybe_reload()
        for player in self._players:
            if player.username == username:
                return player
        raise ValueError(f"Player with username '{username}' not found.")

    def get_all_games(self) -> list[Game]:
        self._maybe_reload()
        return self._games

    def get_games(self, start_date: datetime, end_date: datetime, players: list[str]) -> list[Game]:
        """Returns a filtered and sorted (date, desc) list of games."""
        self._maybe_reload()
        filtered = self._games

        if start_date and end_date:
            start_d = start_date.date() if hasattr(start_date, 'date') else start_date
            end_d = end_date.date() if hasattr(end_date, 'date') else end_date
            filtered = [g for g in filtered if start_d <= g.date.date() <= end_d]

        if players:
            players_set = set(players)
            filtered = [g for g in filtered if players_set.intersection(g.participants)]

        return sorted(filtered, key=lambda g: g.date, reverse=True)

    def reload(self):
        """Force reload from disk (called after POST /post-game)."""
        self._do_reload()


# ── Singleton ─────────────────────────────────────────

_instance_lock = threading.Lock()
_instance: DataService | None = None


def get_data_service() -> DataService:
    """Return the DataService singleton. Thread-safe, lazy-initialized."""
    global _instance
    if _instance is None:
        with _instance_lock:
            if _instance is None:
                _instance = DataService(constants.DATA_PATH)
    return _instance
