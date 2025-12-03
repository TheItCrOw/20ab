from dash import html, dcc, register_page, Output, Input, callback
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

import constants
from services.data_service import DataService

register_page(__name__, path="/", name="Home")

data_service = DataService(constants.DATA_PATH)
players = data_service.get_all_players()
games = data_service.get_all_games()

layout = dbc.Container(
    fluid=True,
    children=[
        html.H1("Home", className="mt-4 mb-4 text-center"),

        html.Div(
            [
                html.Div(
                    [
                        dcc.Graph(id="wins-loses-bar-chart"),
                    ],
                    className="w-100",
                ),
            ],
            className="g-4",
        ),
    ],
)


@callback(
    Output("wins-loses-bar-chart", "figure"),
    Input("players-selection", "value"),
)
def update_player_bar_chart(selected_players):
    # Ensure we always have a list
    if not selected_players:
        # Empty figure with a small note
        fig = go.Figure()
        fig.update_layout(
            title="No players selected",
            xaxis_title="Player",
            yaxis_title="Count",
        )
        return fig

    # Initialize counters
    wins = {name: 0 for name in selected_players}
    losses = {name: 0 for name in selected_players}

    # Count wins and losses across all games
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
        title="Wins and Losses per Player",
        xaxis_title="Player",
        yaxis_title="Number of Games",
    )

    return fig
