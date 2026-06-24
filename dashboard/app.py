import json
import os
from datetime import datetime
from pathlib import Path

import plotly.io as pio
from dotenv import load_dotenv
from flask import request, jsonify
from flask_cors import CORS
from dash import Dash, html, dcc, page_container, page_registry, callback, clientside_callback, Input, Output
import dash_bootstrap_components as dbc
import dash_mantine_components as dmc

import constants
from models.game import Game
from services.data_service import get_data_service

load_dotenv(os.path.join(constants.BASE_DIR, '.env'))

# ─────────────────────────────────────────────────────
# Custom Plotly template — transparent backgrounds,
# neutral grid, consistent with both light & dark modes
# ─────────────────────────────────────────────────────
pio.templates["twentyab"] = {
    "layout": {
        "paper_bgcolor": "rgba(0,0,0,0)",
        "plot_bgcolor":  "rgba(0,0,0,0)",
        "font": {
            "family": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "color":  "#94A3B8",
            "size":   12,
        },
        "colorway": [
            "#10B981", "#3B82F6", "#F59E0B",
            "#EC4899", "#8B5CF6", "#06B6D4", "#F97316", "#14B8A6",
        ],
        "xaxis": {
            "gridcolor":     "rgba(148,163,184,0.08)",
            "linecolor":     "rgba(148,163,184,0.12)",
            "zerolinecolor": "rgba(148,163,184,0.12)",
            "tickfont":      {"color": "#94A3B8", "size": 11},
            "title":         {"font": {"color": "#94A3B8"}},
        },
        "yaxis": {
            "gridcolor":     "rgba(148,163,184,0.08)",
            "linecolor":     "rgba(148,163,184,0.12)",
            "zerolinecolor": "rgba(148,163,184,0.12)",
            "tickfont":      {"color": "#94A3B8", "size": 11},
            "title":         {"font": {"color": "#94A3B8"}},
        },
        "title": {
            "font": {"color": "#94A3B8", "size": 13},
            "pad":  {"t": 0, "b": 0},
        },
        "legend": {
            "font":        {"color": "#94A3B8", "size": 11},
            "bgcolor":     "rgba(0,0,0,0)",
            "bordercolor": "rgba(0,0,0,0)",
        },
        "margin": {"l": 8, "r": 8, "t": 36, "b": 8, "pad": 0},
    }
}
pio.templates.default = "twentyab"

# ─────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────
LIGHT_THEME = dbc.themes.FLATLY
DARK_THEME  = dbc.themes.DARKLY

app = Dash(
    __name__,
    use_pages=True,
    suppress_callback_exceptions=True,
    external_stylesheets=[
        dbc.icons.BOOTSTRAP,
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    ],
)
app.title = "20 ab Dashboard"
server = app.server
CORS(server, resources={r"/post-game": {"origins": "*"}})


# ─────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────
@server.route("/post-game", methods=["POST"])
def post_game():
    admin_pw = os.environ.get("ADMIN_PW")
    if not admin_pw:
        return jsonify({"error": "Server misconfigured: ADMIN_PW not set"}), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    # Auth check
    password = data.get("password")
    if password != admin_pw:
        return jsonify({"error": "Unauthorized"}), 401

    # Accept single game or multiple games
    game_list = data.get("games")  # array of games
    game_single = data.get("game")  # single game
    if game_list and isinstance(game_list, list):
        games_data = game_list
    elif game_single:
        games_data = [game_single]
    else:
        return jsonify({"error": "Missing 'game' or 'games' field"}), 400

    # Validate all games first
    validated = []
    for i, gd in enumerate(games_data):
        try:
            validated.append((gd, Game.model_validate(gd)))
        except Exception as e:
            return jsonify({"error": f"Invalid game data at index {i}: {e}"}), 400

    # Check for duplicates against existing game files
    games_dir = Path(constants.DATA_PATH) / "games"
    existing_games_raw = []
    for path in games_dir.glob("game*.json"):
        with path.open("r", encoding="utf-8") as f:
            existing_games_raw.append(json.load(f))

    def games_match(a: dict, b: dict) -> bool:
        """Two games match if date, finisher, loser, and all rounds are identical."""
        return (
            a.get("date") == b.get("date")
            and a.get("finisher") == b.get("finisher")
            and a.get("loser") == b.get("loser")
            and a.get("rounds") == b.get("rounds")
        )

    duplicates = []
    new_games = []
    for i, (gd, game) in enumerate(validated):
        if any(games_match(gd, eg) for eg in existing_games_raw):
            duplicates.append(i)
        else:
            new_games.append((gd, game))

    if not new_games:
        count = len(duplicates)
        return jsonify({
            "error": f"All {count} game{'s' if count != 1 else ''} already exist on the dashboard.",
            "duplicates": duplicates,
        }), 409

    # Add unknown players to players.json
    players_path = os.path.join(constants.DATA_PATH, "players.json")
    with open(players_path, "r", encoding="utf-8") as f:
        players_raw = json.load(f)

    known_usernames = {p["username"] for p in players_raw}
    new_players_added = False
    for _, game in new_games:
        for username in game.participants:
            if username not in known_usernames:
                players_raw.append({"username": username, "name": username})
                known_usernames.add(username)
                new_players_added = True

    if new_players_added:
        with open(players_path, "w", encoding="utf-8") as f:
            json.dump(players_raw, f, indent=2, ensure_ascii=False)

    # Save each new game file
    existing_nums = [int(p.stem.replace("game", "")) for p in games_dir.glob("game*.json")]
    next_num = max(existing_nums, default=0) + 1
    saved_numbers = []

    for game_data, _ in new_games:
        game_path = games_dir / f"game{next_num}.json"
        with open(game_path, "w", encoding="utf-8") as f:
            json.dump(game_data, f, indent=2, ensure_ascii=False)
        saved_numbers.append(next_num)
        next_num += 1

    # Reload data service so dashboard picks up new data immediately
    get_data_service().reload()

    result = {"success": True, "game_numbers": saved_numbers}
    if duplicates:
        result["skipped_duplicates"] = len(duplicates)
        result["message"] = (
            f"Saved {len(saved_numbers)} game(s), "
            f"skipped {len(duplicates)} duplicate(s)."
        )

    return jsonify(result), 201


players = get_data_service().get_all_players()

# ─────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────
app.layout = dmc.MantineProvider(
    id="mantine-provider",
    forceColorScheme="dark",
    children=[
        html.Div([

            # ── Splash screen ────────────────────────
            html.Div(
                id="splash-screen",
                children=[
                    html.Img(
                        src="assets/images/logo_transparent.png",
                        className="splash-logo",
                    ),
                    html.Div("20 ab",       className="splash-title"),
                    html.Div("Dashboard",   className="splash-sub"),
                ],
            ),

            # ── Theme stylesheet (swapped by callback) ──
            html.Link(id="theme-link", rel="stylesheet", href=DARK_THEME),

            # ── Stores ───────────────────────────────
            dcc.Store(id="window-width", data=1200),
            dcc.Store(id="theme-store",  data="dark"),
            dcc.Interval(id="resize-listener", interval=3000, n_intervals=0),

            # ── Fixed buttons ─────────────────────────
            dbc.Button(
                html.I(className="fa-solid fa-bars"),
                id="burger-menu",
                color="light",
            ),
            dbc.Button(
                html.I(className="fa-solid fa-sun theme-icon"),
                id="theme-toggle",
                n_clicks=0,
                color="light",
                className="theme-toggle-btn",
            ),

            # ── Main layout ───────────────────────────
            html.Div(
                className="g-0 d-flex",
                children=[

                    # Sidebar
                    html.Div(
                        id="sidebar",
                        className="sidebar",
                        children=[
                            # Logo
                            html.Div(
                                html.Img(
                                    src="assets/images/logo_transparent.png",
                                    className="logo",
                                ),
                                className="sidebar-logo-zone",
                            ),

                            # Pages nav
                            html.Div([
                                html.Div("Pages", className="sidebar-label"),
                                dbc.Nav(
                                    [
                                        dbc.NavLink(
                                            page["name"],
                                            href=page["path"],
                                            active="exact",
                                        )
                                        for page in page_registry.values()
                                        if page["path"] != "/404"
                                    ],
                                    vertical=True,
                                    pills=True,
                                    className="flex-column",
                                ),
                            ], className="sidebar-nav-section"),

                            # Filters
                            html.Div([
                                html.Span("Players", className="filter-label"),
                                dcc.Dropdown(
                                    [constants.ALL_PLAYERS_NAME] + [p.username for p in players],
                                    id="players-selection",
                                    multi=True,
                                    value=constants.ALL_PLAYERS_NAME,
                                    className="mb-1",
                                ),
                                html.Span("Time Range", className="filter-label mt-3 d-block"),
                                dcc.DatePickerRange(
                                    id="date-selection",
                                    start_date="2025-11-01",
                                    end_date=str(datetime.today().date()),
                                    display_format="YYYY-MM-DD",
                                    with_portal=True,
                                    className="w-100",
                                ),
                            ], className="sidebar-filter-section"),
                        ],
                    ),

                    # Backdrop (mobile)
                    html.Div(id="sidebar-backdrop", className="sidebar-backdrop"),

                    # Page content
                    html.Div(
                        className="main-content",
                        children=page_container,
                    ),
                ],
            ),
        ])
    ],
)


# ─────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────

# Instantly set body[data-theme] via JS so CSS variables
# switch without waiting for the stylesheet swap
clientside_callback(
    """
    function(n) {
        const dark = !n || n % 2 === 0;
        document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
        return dark ? 'dark' : 'light';
    }
    """,
    Output("theme-store", "data"),
    Input("theme-toggle", "n_clicks"),
)


@app.callback(
    Output("theme-link",         "href"),
    Output("theme-toggle",       "children"),
    Output("mantine-provider",   "forceColorScheme"),
    Input("theme-toggle",        "n_clicks"),
)
def toggle_theme(n_clicks):
    if n_clicks is None or n_clicks % 2 == 0:
        # default: dark
        icon = html.I(className="fa-solid fa-sun theme-icon")
        return DARK_THEME, icon, "dark"
    # toggled: light
    icon = html.I(className="fa-solid fa-moon theme-icon")
    return LIGHT_THEME, icon, "light"


# Window-width tracker
clientside_callback(
    """
    function(n) {
        if (typeof window === 'undefined') return 1200;
        return window.innerWidth;
    }
    """,
    Output("window-width", "data"),
    Input("resize-listener", "n_intervals"),
)


@app.callback(
    Output("sidebar",           "className"),
    Output("sidebar-backdrop",  "className"),
    Output("burger-menu",       "children"),
    Input("burger-menu",        "n_clicks"),
    Input("window-width",       "data"),
)
def toggle_sidebar(n_clicks, width):
    if width is None:
        width = 1200

    bars = html.I(className="fa-solid fa-bars")
    xmark = html.I(className="fa-solid fa-xmark")

    if width >= 1000:
        return "sidebar", "sidebar-backdrop", bars

    open_sidebar = n_clicks and n_clicks % 2 != 0
    if open_sidebar:
        return "sidebar", "sidebar-backdrop active", xmark
    return "sidebar sidebar-hidden", "sidebar-backdrop", bars


if __name__ == "__main__":
    app.run(debug=True)
