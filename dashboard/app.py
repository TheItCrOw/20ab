import os
from datetime import datetime

from dash import Dash, html, dcc, page_container, page_registry, callback, Input, Output
import dash_bootstrap_components as dbc
import plotly.io as pio
import dash_mantine_components as dmc

import constants
from services.data_service import DataService

pio.templates.default = "ggplot2"
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

LIGHT_THEME = dbc.themes.LUX
DARK_THEME = dbc.themes.DARKLY

data_service = DataService(constants.DATA_PATH)
players = data_service.get_all_players()

app.clientside_callback(
    """
    function(n) {
        // Read the current window width every interval tick
        if (typeof window === 'undefined') {
            return 1200;  // server-side / initial default
        }
        return window.innerWidth;
    }
    """,
    Output("window-width", "data"),
    Input("resize-listener", "n_intervals")
)

app.layout = dmc.MantineProvider([html.Div(
    [
        # Store current window width
        dcc.Store(id="window-width", data=1200),

        # Simple periodic trigger to read window.innerWidth
        dcc.Interval(id="resize-listener", interval=500, n_intervals=0),

        # Burger menu top right when screen is small
        dbc.Button(
            html.I(className="fa-solid fa-bars"),
            id="burger-menu",
            color="primary",
        ),

        # Theme stylesheet we toggle
        html.Link(
            id="theme-link",
            rel="stylesheet",
            href=LIGHT_THEME,  # default theme
        ),

        # Top right: light/dark mode switch
        dbc.Button(
            html.I(className="fa-solid fa-moon theme-icon fade-in"),
            id="theme-toggle",
            n_clicks=0,
            color="primary",
            className="theme-toggle-btn",
        ),

        html.Div(
            className="g-0 d-flex",
            children=[
                # Sidebar
                html.Div(
                    # width=2,
                    children=[
                        html.Div(
                            html.Img(
                                src="assets/images/logo_transparent.png",
                                className="logo"
                            ),
                            className="text-center mb-4",
                        ),
                        html.H5("Pages", className="mt-2 text-center mb-3"),
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
                        html.Hr(),
                        html.Div(
                            [
                                html.Label("Select Players:", className="fw-bold text-center w-100 mb-1"),
                                dcc.Dropdown(
                                    [constants.ALL_PLAYERS_NAME] + [p.username for p in players],
                                    id="players-selection",
                                    multi=True,
                                    value=constants.ALL_PLAYERS_NAME
                                ),
                            ],
                            className="mb-2 "
                        ),
                        html.Div(
                            [
                                html.Label("Time Range:", className="fw-bold text-center w-100 mb-1"),
                                dcc.DatePickerRange(
                                    id="date-selection",
                                    start_date="2025-11-01",
                                    end_date=str(datetime.today().date()),
                                    display_format="YYYY-MM-DD",
                                    className="w-100",
                                ),
                            ],
                            className="mb-3 mt-4"
                        )
                    ],
                    className="sidebar",
                    id="sidebar"
                ),

                # Main content
                html.Div(
                    className="main-content",
                    children=page_container,
                ),
            ],
        ),
    ]
)])


@app.callback(
    Output("theme-link", "href"),
    Output("theme-toggle", "children"),
    Input("theme-toggle", "n_clicks"),
)
def toggle_theme(n_clicks):
    """Toggle between light and dark Bootswatch themes based on click count."""
    if n_clicks is None or n_clicks % 2 == 0:
        return LIGHT_THEME, html.I(className="fa-solid fa-moon theme-icon fade-in")
    else:
        return DARK_THEME, html.I(className="fa-solid fa-sun theme-icon fade-in")


@app.callback(
    Output("sidebar", "className"),
    Output("burger-menu", "children"),
    Input("burger-menu", "n_clicks"),
    Input("window-width", "data"),
)
def toggle_sidebar(n_clicks, width):
    """
    - On desktop (width >= 1000): always show sidebar, burger reset to bars.
    - On mobile  (width < 1000): sidebar is toggled by burger.
    """
    if width is None:
        width = 1200

    is_desktop = width >= 1000

    bars_icon = html.I(className="fa-solid fa-bars")
    close_icon = html.I(className="fa-solid fa-xmark")

    # DESKTOP: always visible, ignore burger state
    if is_desktop:
        return "sidebar", bars_icon

    # MOBILE:
    if not n_clicks or n_clicks % 2 == 0:
        return "sidebar sidebar-hidden", bars_icon

    return "sidebar", close_icon


if __name__ == "__main__":
    app.run(debug=True)
