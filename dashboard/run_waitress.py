# run_waitress.py
from waitress import serve
from app import server  # import the Flask server from app.py

if __name__ == "__main__":
    serve(
        server,
        host="127.0.0.1",
        port=8050,
        threads=8,
        channel_timeout=120,
    )