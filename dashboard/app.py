import os
from datetime import datetime

import plotly.io as pio
from dash import Dash, html, dcc, page_container, page_registry, callback, clientside_callback, Input, Output
import dash_bootstrap_components as dbc
import dash_mantine_components as dmc

import constants
from services.data_service import DataService

# ─────────────────────────────────────────────────────
# Custom Plotly template — transparent backgrounds,
# neutral grid, consistent with both light & dark modes
# ─────────────────────────────────────────────────────
pio.templates["twentyab"] = {
    "layout": {
        "paper_bgcolor": "rgba(0,0,0,0)",
        "plot_bgcolor":  "rgba(0,0,0,0)",
        "font": {
            "family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "color":  "#8A8FA8",
            "size":   12,
        },
        "colorway": [
            "#6366F1", "#22C55E", "#F59E0B",
            "#06B6D4", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
        ],
        "xaxis": {
            "gridcolor":     "rgba(148,163,184,0.10)",
            "linecolor":     "rgba(148,163,184,0.15)",
            "zerolinecolor": "rgba(148,163,184,0.15)",
            "tickfont":      {"color": "#8A8FA8", "size": 11},
            "title":         {"font": {"color": "#8A8FA8"}},
        },
        "yaxis": {
            "gridcolor":     "rgba(148,163,184,0.10)",
            "linecolor":     "rgba(148,163,184,0.15)",
            "zerolinecolor": "rgba(148,163,184,0.15)",
            "tickfont":      {"color": "#8A8FA8", "size": 11},
            "title":         {"font": {"color": "#8A8FA8"}},
        },
        "title": {
            "font": {"color": "#8A8FA8", "size": 13},
            "pad":  {"t": 0, "b": 0},
        },
        "legend": {
            "font":        {"color": "#8A8FA8", "size": 11},
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
LIGHT_THEME = dbc.themes.LUX
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

data_service = DataService(constants.DATA_PATH)
players = data_service.get_all_players()

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
