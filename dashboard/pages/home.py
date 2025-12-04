from datetime import date, datetime

from dash import html, dcc, register_page, Output, Input, callback
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

import constants
from services.data_service import DataService, get_data_service

register_page(__name__, path="/", name="Home")

data_service = DataService(constants.DATA_PATH)
players = data_service.get_all_players()

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
                                dcc.Graph(id="wins-loses-bar-chart"),
                            ],
                            className="w-100 my-card",
                        ),
                    ],
                ),
                xs=12, md=12, lg=12, xxl=6
            ),
            dbc.Col(
                html.Div(
                    [
                        html.Div(
                            className="w-100 my-card",
                            id="recent-games-list"
                        ),
                    ],
                ),
                xs=12, md=12, lg=12, xxl=6
            )]
        )

    ],
)


@callback(
    Output("recent-games-list", "children"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date")
)
def update_recent_games_list(selected_players: list[str], start_date: str, end_date: str):
    if not selected_players:
        return html.H5("No Players selected.")
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = list(map(lambda p: p.username, players))

    current_games = get_data_service().get_games(start, end, selected_players)

    list_items = []
    for game in current_games:
        list_items.append(
            html.Div(
                [html.Label(str(game.date.date()))] +
                [html.Span(str(p)) for p in game.participants]
            )
        )

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

    # If "All" is selected, take all players.
    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = list(map(lambda p: p.username, players))

    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    wins = {name: 0 for name in selected_players}
    losses = {name: 0 for name in selected_players}

    # Count wins and losses across all games
    games = get_data_service().get_games(start, end, selected_players)
    for g in games:
        winner = getattr(g, "winner", None)
        loser = getattr(g, "loser", None)

        if winner in wins:
            wins[winner] += 1
        if loser in losses:
            losses[loser] += 1

    # Preserve the order of selected_players on x-axis
    x = selected_players
    y_wins = [wins[name] for name in x]
    y_losses = [losses[name] for name in x]

    fig = go.Figure(
        data=[
            go.Bar(name="Wins", x=x, y=y_wins),
            go.Bar(name="Losses", x=x, y=y_losses),
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
