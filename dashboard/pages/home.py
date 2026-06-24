import math
from datetime import datetime

from dash import html, dcc, register_page, Output, Input, callback
import dash_mantine_components as dmc
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

import constants
from constants import GAMES_PAGE_SIZE
from services.data_service import get_data_service
from utils.component_utils import build_game_table, get_filtered_games, build_leaderboard_table
from utils.statistics_utils import (
    score_trajectory, total_wins, total_finishes, total_losses,
    drinks_balance, current_streak,
)

register_page(__name__, path="/", name="Home")

_LOADING_COLOR = "#10B981"
_CHART_CFG = {"displayModeBar": False, "scrollZoom": False, "displaylogo": False, "staticPlot": True}

# Chart colors
_CLR_WIN    = "#10B981"
_CLR_LOSS   = "#EF4444"
_CLR_FINISH = "#F59E0B"
_CLR_BAR    = "#10B981"


def _card(*children, extra_class=""):
    return html.Div(children, className=f"w-100 my-card mb-4 {extra_class}".strip())


def _card_with_header(title, *children, badge=None):
    header_children = [html.Span(title, className="section-header-title")]
    if badge is not None:
        header_children.append(
            html.Span(str(badge), className="small-font text-muted")
        )
    return html.Div([
        html.Div(header_children, className="section-header"),
        *children,
    ], className="w-100 my-card mb-4")


def _kpi_card(card_id, label, icon_class, color_class):
    return html.Div([
        html.Div(label, className="kpi-label"),
        html.Div("—", id=card_id, className="kpi-value"),
        html.Div("", id=f"{card_id}-sub", className="kpi-sub"),
        html.I(className=f"{icon_class} kpi-icon"),
    ], className=f"kpi-card {color_class}")


layout = dbc.Container(
    fluid=True,
    children=[
        html.H1("Home", className="page-title"),

        # ── KPI summary row ────────────────────
        html.Div([
            _kpi_card("kpi-games",   "Total Games",    "fa-solid fa-layer-group", "kpi-emerald"),
            _kpi_card("kpi-players", "Active Players",  "fa-solid fa-users",       "kpi-blue"),
            _kpi_card("kpi-streak",  "Longest Streak", "fa-solid fa-fire",        "kpi-gold"),
            _kpi_card("kpi-drinks",  "Top Spender",    "fa-solid fa-beer-mug-empty", "kpi-red"),
        ], className="kpi-row"),

        dbc.Row([
            # ── Wins/Losses bar chart ────────────────
            dbc.Col(
                _card(
                    dcc.Loading(
                        dcc.Graph(id="wins-loses-bar-chart", config=_CHART_CFG),
                        type="circle",
                        color=_LOADING_COLOR,
                        className="chart-loading-wrap",
                    ),
                    extra_class="p-3",
                ),
                xs=12, md=12, lg=12, xxl=6,
            ),

            # ── Game list ────────────────────────────
            dbc.Col(
                html.Div([
                    html.Div(
                        [
                            html.Span("Recent Games", className="section-header-title"),
                            html.Span(
                                [html.Span(len(get_data_service().get_all_games()), className="fw-bold"),
                                 html.Span(" total", className="ms-1 text-muted small-font")],
                            ),
                        ],
                        className="section-header",
                    ),
                    dcc.Loading(
                        html.Div(id="recent-games-list"),
                        type="circle",
                        color=_LOADING_COLOR,
                        className="list-loading-wrap",
                    ),
                    dmc.Pagination(
                        id="recent-games-pagination",
                        total=1,
                        value=1,
                        siblings=1,
                        boundaries=1,
                        color="green",
                        className="mt-2 pb-2 ps-3 pe-3",
                    ),
                ], className="w-100 my-card mb-4"),
                xs=12, md=12, lg=12, xxl=6,
            ),

            # ── Leaderboard ──────────────────────────
            dbc.Col(
                html.Div([
                    html.Div(
                        html.Span("Leaderboard", className="section-header-title"),
                        className="section-header",
                    ),
                    dcc.Loading(
                        html.Div(id="leaderboard-table-container"),
                        type="circle",
                        color=_LOADING_COLOR,
                        className="list-loading-wrap",
                    ),
                ], className="w-100 my-card mb-4"),
                xs=12, md=12, lg=12, xxl=12,
            ),

            # ── Score trajectory ─────────────────────
            dbc.Col(
                _card(
                    dcc.Loading(
                        dcc.Graph(id="score-trajectory-chart", config=_CHART_CFG),
                        type="circle",
                        color=_LOADING_COLOR,
                        className="chart-loading-wrap",
                    ),
                    extra_class="p-3",
                ),
                xs=12, md=12, lg=12, xxl=8,
            ),

            # ── Monthly activity ─────────────────────
            dbc.Col(
                _card(
                    dcc.Loading(
                        dcc.Graph(id="monthly-activity-chart", config=_CHART_CFG),
                        type="circle",
                        color=_LOADING_COLOR,
                        className="chart-loading-wrap",
                    ),
                    extra_class="p-3",
                ),
                xs=12, md=12, lg=12, xxl=4,
            ),
        ]),
    ],
)


# ─────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────

@callback(
    Output("kpi-games",       "children"),
    Output("kpi-games-sub",   "children"),
    Output("kpi-players",     "children"),
    Output("kpi-players-sub", "children"),
    Output("kpi-streak",      "children"),
    Output("kpi-streak-sub",  "children"),
    Output("kpi-drinks",      "children"),
    Output("kpi-drinks-sub",  "children"),
    Input("players-selection", "value"),
    Input("date-selection",    "start_date"),
    Input("date-selection",    "end_date"),
)
def update_kpis(selected_players, start_date, end_date):
    games = get_filtered_games(selected_players, start_date, end_date)

    if constants.ALL_PLAYERS_NAME in (selected_players or []):
        player_names = [p.username for p in get_data_service().get_all_players()]
    else:
        player_names = selected_players or []

    # Total games
    total_games = len(games)
    games_sub = f"in selected period"

    # Active players (those who actually played in the filtered games)
    active = set()
    for g in games:
        active.update(g.participants)
    active_count = len(active)
    total_registered = len(get_data_service().get_all_players())
    players_sub = f"of {max(total_registered, active_count)} registered"

    # Longest current streak
    best_streak_name, best_streak_val, best_streak_type = "—", 0, ""
    for username in player_names:
        player = get_data_service().get_player_by_username(username)
        player_games = [g for g in games if username in g.participants]
        if not player_games:
            continue
        s_type, s_len = current_streak(player, player_games)
        if s_len > best_streak_val:
            best_streak_val = s_len
            best_streak_name = username
            best_streak_type = s_type

    streak_display = f"{best_streak_type}{best_streak_val}" if best_streak_val > 0 else "—"
    streak_sub = best_streak_name if best_streak_val > 0 else ""

    # Top spender (most negative drinks balance = spent the most)
    top_spender_name, top_spender_bal = "—", 0.0
    for username in player_names:
        player = get_data_service().get_player_by_username(username)
        player_games = [g for g in games if username in g.participants]
        if not player_games:
            continue
        bal = drinks_balance(player, player_games)
        if bal < top_spender_bal:
            top_spender_bal = bal
            top_spender_name = username

    drinks_display = f"{abs(top_spender_bal):.2f}€" if top_spender_bal < 0 else "—"
    drinks_sub = top_spender_name if top_spender_bal < 0 else ""

    return (
        str(total_games), games_sub,
        str(active_count), players_sub,
        streak_display, streak_sub,
        drinks_display, drinks_sub,
    )


@callback(
    Output("recent-games-pagination", "total"),
    Output("recent-games-pagination", "value"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_pagination(selected_players, start_date, end_date):
    games = get_filtered_games(selected_players, start_date, end_date)
    total_pages = max(1, math.ceil(len(games) / GAMES_PAGE_SIZE))
    return total_pages, 1


@callback(
    Output("recent-games-list", "children"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
    Input("recent-games-pagination", "value"),
)
def update_recent_games(selected_players, start_date, end_date, page):
    games = get_filtered_games(selected_players, start_date, end_date)

    if not games:
        return html.P("No games in this period.", className="text-center p-4 text-muted small-font")

    start_idx = (page - 1) * GAMES_PAGE_SIZE
    current_games = games[start_idx: start_idx + GAMES_PAGE_SIZE]

    _DRINK_PRICE = 3.50

    items = []
    for game in current_games:
        pills = html.Div(
            [
                html.Span(
                    p,
                    className=(
                        "me-1 small-font player-span"
                        + (" bg-finish"  if p == game.finisher else "")
                        + (" bg-danger"  if p == game.loser    else "")
                        + (" bg-win"     if p != game.finisher and p != game.loser else "")
                    ),
                )
                for p in game.participants
            ],
        )

        drinks_cost = (len(game.participants) - 1) * _DRINK_PRICE
        meta = html.Div(
            [
                html.Span(
                    f"{game.loser} pays ~{drinks_cost:.2f}",
                    className="small-font me-3",
                    style={"color": "var(--loss)", "whiteSpace": "nowrap"},
                ),
                html.Span(
                    str(game.date.date()),
                    className="small-font",
                    style={"color": "var(--text-3)", "whiteSpace": "nowrap"},
                ),
            ],
            className="d-flex align-items-center gap-2",
        )

        accordion = dmc.Accordion(
            children=[
                dmc.AccordionItem(
                    children=[
                        dmc.AccordionControl(
                            html.Div(
                                [pills, meta],
                                className="d-flex align-items-center justify-content-between w-100",
                            )
                        ),
                        dmc.AccordionPanel(build_game_table(game)),
                    ],
                    value="0",
                )
            ],
            value="1",
        )
        items.append(accordion)

    return items


@callback(
    Output("wins-loses-bar-chart", "figure"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_bar_chart(selected_players, start_date, end_date):
    if not selected_players:
        return go.Figure().update_layout(title="No players selected")

    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    games = get_filtered_games(selected_players, start_date, end_date)

    wins     = {n: 0 for n in selected_players}
    finishes = {n: 0 for n in selected_players}
    losses   = {n: 0 for n in selected_players}

    for g in games:
        for name in g.winners:
            if name in wins:
                wins[name] += 1
        if g.finisher in finishes:
            finishes[g.finisher] += 1
        if g.loser in losses:
            losses[g.loser] += 1

    x = selected_players
    fig = go.Figure(data=[
        go.Bar(name="Losses",   x=x, y=[losses[n]   for n in x], marker_color=_CLR_LOSS,
               marker_line_width=0),
        go.Bar(name="Wins",     x=x, y=[wins[n]     for n in x], marker_color=_CLR_WIN,
               marker_line_width=0),
        go.Bar(name="Finishes", x=x, y=[finishes[n] for n in x], marker_color=_CLR_FINISH,
               marker_line_width=0),
    ])
    fig.update_layout(
        barmode="group",
        title={"text": "Finishes / Wins / Losses per Player", "x": 0, "xanchor": "left"},
        legend=dict(orientation="h", yanchor="top", y=-0.18, xanchor="center", x=0.5),
        margin=dict(l=0, r=0, t=36, b=68),
        bargap=0.25,
        bargroupgap=0.08,
    )
    fig.update_yaxes(tickmode="auto", nticks=6, rangemode="tozero", title=None, automargin=True)
    fig.update_xaxes(title=None, automargin=True)
    return fig


@callback(
    Output("leaderboard-table-container", "children"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_leaderboard(selected_players, start_date, end_date):
    games = get_filtered_games(selected_players, start_date, end_date)

    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    if not games:
        return html.P("No games in this period.", className="text-center p-4 text-muted small-font")

    players = [get_data_service().get_player_by_username(p) for p in selected_players]
    return build_leaderboard_table(players, games)


@callback(
    Output("score-trajectory-chart", "figure"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_trajectory(selected_players, start_date, end_date):
    fig = go.Figure()

    if not selected_players:
        return fig.update_layout(title="No players selected") or fig

    if constants.ALL_PLAYERS_NAME in selected_players:
        selected_players = [p.username for p in get_data_service().get_all_players()]

    games = get_filtered_games(selected_players, start_date, end_date)
    if not games:
        return fig.update_layout(title="No games in this period") or fig

    for username in selected_players:
        player = get_data_service().get_player_by_username(username)
        traj = score_trajectory(player, [g for g in games if username in g.participants], min_samples=2)
        if not traj:
            continue
        fig.add_trace(go.Scatter(
            x=list(traj.keys()),
            y=list(traj.values()),
            mode="lines+markers",
            name=username,
            line=dict(width=2.5),
            marker=dict(size=5),
        ))

    fig.update_layout(
        title={"text": "Avg Score Trajectory per Round", "x": 0, "xanchor": "left"},
        xaxis_title="Round",
        yaxis_title="Avg Score",
        legend=dict(orientation="h", yanchor="top", y=-0.22, xanchor="center", x=0.5),
        margin=dict(l=0, r=0, t=36, b=80),
    )
    fig.update_yaxes(rangemode="tozero", automargin=True)
    fig.update_xaxes(dtick=1, title_standoff=14, automargin=True)
    return fig


@callback(
    Output("monthly-activity-chart", "figure"),
    Input("players-selection", "value"),
    Input("date-selection", "start_date"),
    Input("date-selection", "end_date"),
)
def update_monthly(selected_players, start_date, end_date):
    games = get_filtered_games(selected_players, start_date, end_date) if selected_players else []

    start_dt = datetime.fromisoformat(start_date)
    end_dt   = datetime.fromisoformat(end_date)
    months = []
    y, m = start_dt.year, start_dt.month
    while (y, m) <= (end_dt.year, end_dt.month):
        months.append(f"{y}-{m:02d}")
        m += 1
        if m > 12:
            m, y = 1, y + 1

    counts = {mo: 0 for mo in months}
    for game in games:
        key = game.date.strftime("%Y-%m")
        if key in counts:
            counts[key] += 1

    labels = [datetime.strptime(k, "%Y-%m").strftime("%b '%y") for k in months]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=labels,
        y=[counts[k] for k in months],
        marker_color=_CLR_BAR,
        marker_line_width=0,
        showlegend=False,
    ))
    fig.update_layout(
        title={"text": "Games per Month", "x": 0, "xanchor": "left"},
        margin=dict(l=48, r=8, t=40, b=52),
        bargap=0.3,
    )
    fig.update_xaxes(
        title="Month",
        showgrid=False,
        showline=True,
        linecolor="rgba(148,163,184,0.3)",
        ticks="outside",
        tickcolor="rgba(148,163,184,0.3)",
        tickfont=dict(size=11, color="#94A3B8"),
        title_font=dict(size=12, color="#94A3B8"),
    )
    fig.update_yaxes(
        title="Games",
        showgrid=True,
        gridcolor="rgba(148,163,184,0.12)",
        showline=True,
        linecolor="rgba(148,163,184,0.3)",
        rangemode="tozero",
        tickmode="auto",
        nticks=6,
        ticks="outside",
        tickcolor="rgba(148,163,184,0.3)",
        tickfont=dict(size=11, color="#94A3B8"),
        title_font=dict(size=12, color="#94A3B8"),
    )
    return fig
