import os

from dash import Dash, html, dcc, page_container, page_registry, callback, Input, Output
import dash_bootstrap_components as dbc
import plotly.io as pio

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

LIGHT_THEME = dbc.themes.LUX
DARK_THEME = dbc.themes.DARKLY

data_service = DataService(constants.DATA_PATH)
players = data_service.get_all_players()

app.layout = html.Div(
    [
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
            color="secondary",
            className="theme-toggle-btn",
        ),

        dbc.Row(
            className="g-0",
            style={"minHeight": "100vh"},
            children=[
                # Sidebar
                dbc.Col(
                    width=2,
                    children=[
                        html.Div(
                            html.Img(
                                src="/assets/images/logo_transparent.png",
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
                                html.Label("Select Players:", className="text-center w-100 mb-1"),
                                dcc.Dropdown(
                                    [p.username for p in players],
                                    id="players-selection",
                                    multi=True,
                                    value=[p.username for p in players]
                                ),
                            ],
                            className="mb-2 "
                        ),
                    ],
                    className="sidebar"
                ),

                # Main content
                dbc.Col(
                    width=10,
                    style={"padding": "1rem"},
                    children=page_container,
                ),
            ],
        ),
    ]
)


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


if __name__ == "__main__":
    app.run(debug=True)
