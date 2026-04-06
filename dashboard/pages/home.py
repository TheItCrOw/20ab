import math
from datetime import date, datetime

from dash import html, dcc, register_page, Output, Input, callback
import dash_mantine_components as dmc
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

import constants
from constants import GAMES_PAGE_SIZE
from services.data_service import DataService, get_data_service
from utils.component_utils import build_game_table, get_filtered_games, build_leaderboard_table

register_page(__name__, path="/", name="Home")

data_service = DataService(constants.DATA_PATH)

layout = dbc.Container(
    fluid=True,
    children=[
        html.H1("Home", className="mt-4 mb-4 text-center"),

        dbc.Row([
            dbc.Col(
                html.Div(
                    [
                        html.Div(
                            [
                                dcc.Graph(id="wins-loses-bar-chart", config={
                                    "displayModeBar": False,
                                    "scrollZoom": False,
                                    "displaylogo": False,
                                    "staticPlot": True
                                }),
                            ],
                            className="w-100 my-card p-3 mb-4",
                        ),
                    ],
                ),
                xs=12, md=12, lg=12, xxl=6
            ),
            dbc.Col(
                html.Div(
                    [
                        html.H5(
                            [html.Span("Total Recorded Games:", className="me-1"),
                             html.Span(len(data_service.get_all_games()), className="ms-1"),
                             ],
                            className="w-100 mb-0 d-flex justify-content-between p-3 bg-lightgray", ),
                        html.Div(
                            [
                                # Actual game list
                                html.Div(id="recent-games-list"),

                                # Pagination at the bottom
                                dmc.Pagination(
                                    id="recent-games-pagination",
                                    total=1,  # will be updated by callback
                                    value=1,  # current page
                                    siblings=1,
                                    boundaries=1,
                                    color="dark",
                                    className="mt-3 pb-2 ps-2 pe-2",
                                ),
                            ]
                        )
                    ],
                    className="w-100 my-card mb-4",
                ),
                xs=12, md=12, lg=12, xxl=6
            ),
            dbc.Col([
                html.Div([
                    html.H5("Leaderboard", className="mb-0 p-3 bg-lightgray text-center"),
                    html.Div(id="leaderboard-table-container"),
                ], className="w-100 my-card mb-4")
            ], xs=12, md=12, lg=12, xxl=12)
        ],
        ),
    ],
)


@callback(
    Output("recent-games-pagination", "total"),
    Output("recent-games-pagination", "value"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_recent_games_pagination(selected_players: list[str], start_date: str, end_date: str):
    games = get_filtered_games(selected_players, start_date, end_date)

    total_pages = max(1, math.ceil(len(games) / GAMES_PAGE_SIZE))
    # Always reset to first page when filters change
    return total_pages, 1


@callback(
    Output("recent-games-list", "children"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
    Input("recent-games-pagination", "value"),
)
def update_recent_games_list(selected_players: list[str], start_date: str, end_date: str, page: int):
    games = get_filtered_games(selected_players, start_date, end_date)

    if not games:
        return html.P("No games in this period.", className="text-center p-3")

    # Pagination slice
    start_idx = (page - 1) * GAMES_PAGE_SIZE
    end_idx = start_idx + GAMES_PAGE_SIZE
    current_games = games[start_idx:end_idx]

    list_items = []
    for i, game in enumerate(current_games, start=1):
        rounds_table = build_game_table(game)

        accordion = dmc.Accordion(
            children=[
                dmc.AccordionItem(
                    children=[
                        dmc.AccordionControl(
                            [
                                html.Div(
                                    className="d-flex align-items-center justify-content-between",
                                    children=[
                                        html.Div(
                                            [
                                                html.Span(
                                                    str(p),
                                                    className=(
                                                        "me-2 small-font player-span "
                                                        f"{'bg-success text-white' if p == game.finisher else ''} "
                                                        f"{'bg-danger text-white' if p == game.loser else ''}"
                                                    ).strip(),
                                                )
                                                for p in game.participants
                                            ],
                                        ),
                                        html.Label(
                                            str(game.date.date()),
                                            className="small-font me-2",
                                        ),
                                    ],
                                )
                            ]
                        ),
                        dmc.AccordionPanel(rounds_table),
                    ],
                    value="0",
                )
            ],
            value="1",
        )

        list_items.append(accordion)

    return list_items


@callback(
    Output("wins-loses-bar-chart", "figure"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date")
)
def update_player_win_losses_chart(selected_players: list[str], start_date: str, end_date: str):
    if not selected_players:
        fig = go.Figure()
        fig.update_layout(
            title="No players selected",
            xaxis_title="Player",
            yaxis_title="Count",
        )
        return fig

    # If "All players" selected, expand to all usernames
    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    games = get_filtered_games(selected_players, start_date, end_date)

    wins = {name: 0 for name in selected_players}
    finishes = {name: 0 for name in selected_players}
    losses = {name: 0 for name in selected_players}

    for g in games:
        for name in g.winners:
            if name in wins:
                wins[name] += 1
        if g.finisher in finishes:
            finishes[g.finisher] += 1
        if g.loser in losses:
            losses[g.loser] += 1

    # Preserve the order of selected_players on x-axis
    x = selected_players
    y_wins = [wins[name] for name in x]
    y_finishes = [finishes[name] for name in x]
    y_losses = [losses[name] for name in x]

    fig = go.Figure(
        data=[
            go.Bar(name="Losses", x=x, y=y_losses),
            go.Bar(name="Wins", x=x, y=y_wins),
            go.Bar(name="Finishes", x=x, y=y_finishes),
        ]
    )

    fig.update_layout(
        barmode="group",
        title={
            "text": "Wins and Losses per Player",
            "x": 0,
            "xanchor": "left"
        },
        xaxis_title="Player",
        yaxis_title="Number of Games",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        margin=dict(l=0, r=0, t=0, b=0),
    )
    # Force integer ticks on the Y-axis
    fig.update_yaxes(dtick=1)

    return fig


@callback(
    Output("leaderboard-table-container", "children"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date")
)
def update_player_win_losses_chart(selected_players: list[str], start_date: str, end_date: str):
    games = get_filtered_games(selected_players, start_date, end_date)

    # If "All players" selected, expand to all usernames
    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    if not games:
        return html.P("No games in this period.", className="text-center p-3")

    players = [get_data_service().get_player_by_username(p) for p in selected_players]

    return build_leaderboard_table(players, games)
