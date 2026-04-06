from datetime import datetime

from dash import html, dash_table
import dash_mantine_components as dmc

import constants
from models.game import Game
from models.player import Player
from services.data_service import get_data_service
from utils.statistics_utils import (
    total_wins, total_finishes, total_losses,
    win_percentage, finish_percentage, loss_percentage,
    avg_points_per_round, dropout_percentage,
    avg_final_score, current_streak,
)


def build_leaderboard_table(players: list[Player], games: list[Game]):
    rows = []

    for player in players:
        player_games = [g for g in games if player.username in g.participants]

        games_played = len(player_games)
        wins = total_wins(player, player_games)
        finishes = total_finishes(player, player_games)
        losses = total_losses(player, player_games)
        win_pct = win_percentage(player, player_games)
        finish_pct = finish_percentage(player, player_games)
        loss_pct = loss_percentage(player, player_games)
        avg_ppr = avg_points_per_round(player, player_games)
        dropout_pct = dropout_percentage(player, player_games)
        avg_fs = avg_final_score(player, player_games)
        streak_type, streak_len = current_streak(player, player_games)
        streak_str = f"{streak_type}{streak_len}" if streak_len > 0 else "—"

        rows.append({
            "Player": player.username,
            "Games": games_played,
            "Wins": wins,
            "Finishes": finishes,
            "Losses": losses,
            "Win%": win_pct * 100 if games_played > 0 else 0.0,
            "Finish%": finish_pct * 100 if games_played > 0 else 0.0,
            "Loss%": loss_pct * 100 if games_played > 0 else 0.0,
            "AvgPPR": avg_ppr,
            "Dropout%": dropout_pct * 100,
            "AvgFinal": avg_fs,
            "Streak": streak_str,
        })

    columns = [
        {"name": "Player", "id": "Player"},
        {"name": "Games", "id": "Games", "type": "numeric"},
        {"name": "Wins", "id": "Wins", "type": "numeric"},
        {"name": "Finishes", "id": "Finishes", "type": "numeric"},
        {"name": "Losses", "id": "Losses", "type": "numeric"},
        {"name": "Win %", "id": "Win%", "type": "numeric", "format": {"specifier": ".1f"}},
        {"name": "Finish %", "id": "Finish%", "type": "numeric", "format": {"specifier": ".1f"}},
        {"name": "Loss %", "id": "Loss%", "type": "numeric", "format": {"specifier": ".1f"}},
        {"name": "Avg PPR", "id": "AvgPPR", "type": "numeric", "format": {"specifier": ".2f"}},
        {"name": "Dropout %", "id": "Dropout%", "type": "numeric", "format": {"specifier": ".1f"}},
        {"name": "Avg Final Score", "id": "AvgFinal", "type": "numeric", "format": {"specifier": ".1f"}},
        {"name": "Streak", "id": "Streak"},
    ]

    datatable = dash_table.DataTable(
        id="leaderboard-table",
        columns=columns,
        data=rows,
        sort_action="native",
        sort_mode="multi",
        page_action="native",
        page_size=10,
        cell_selectable=False,
        fixed_columns={"headers": True, "data": 1},
        style_table={"overflowX": "auto", "minWidth": "100%"},
        style_header={
            "fontWeight": "600",
            "fontSize": "12px",
            "borderBottom": "2px solid #E3E6F0",
        },
        style_cell={
            "padding": "8px 12px",
            "whiteSpace": "nowrap",
            "fontSize": "13px",
            "border": "1px solid #EEF0F6",
        },
        style_cell_conditional=[
            {
                "if": {"column_id": "Player"},
                "fontWeight": "600",
                "borderRight": "2px solid #D4D7E8",
            }
        ],
    )

    # Optional: wrap in Mantine container/card to keep your DMC look
    return dmc.Paper(
        children=datatable,
        withBorder=False,
        shadow=None,
        # radius="md",
        className="p-0",
        p="xs",
    )


def build_game_table(game: Game) -> dmc.Table:
    # Determine column order
    if game.participants:
        players = game.participants
    else:
        players = [m.username for m in game.rounds[0].moves]

    # Table head: "Round" + player names
    head = players

    # Table body: one row per round
    body: list[list[str | int | float | None]] = []
    for round_idx, rnd in enumerate(game.rounds, start=1):
        values_by_player = {m.username: m.value for m in rnd.moves}

        row: list[str | int | float | None] = []
        for p in players:
            value = values_by_player.get(p)
            row.append("" if value is None else value)

        body.append(row)

    table_data = {
        "caption": f"Rounds for game on {game.date.date()}",
        "head": head,
        "body": body,
    }

    return dmc.Table(
        data=table_data,
        striped="even",
        highlightOnHover=True,
        withTableBorder=True,
        withColumnBorders=True,
        stickyHeader=True,
        horizontalSpacing="sm",
        verticalSpacing="xs",
        className="mt-2 small-font",
    )


def get_filtered_games(selected_players: list[str], start_date: str, end_date: str):
    if not selected_players:
        return []

    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    # If "All players" selected, expand to all usernames
    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    return get_data_service().get_games(start, end, selected_players)
