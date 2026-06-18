"""FastAPI application exposing the Pelada statistics.

The CSV data is re-read automatically whenever a source file's modification time
changes, so editing data/matches.csv in the mounted data folder refreshes every
endpoint on the next request — no restart required.

Created: 2026-06-16
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import stats
from .parser import DataStore

DATA_PATH = os.environ.get("MATCHES_PATH", "/data/matches.csv")

app = FastAPI(
    title="Pelada MCR Stats API",
    description="Statistics API for the Monday football group.",
    version="1.0.0",
)

# The frontend is served same-origin via nginx in production, but CORS is opened
# so the API also works when the React dev server runs separately.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

store = DataStore(DATA_PATH)


def _ds():
    try:
        return store.get()
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail=f"Matches file not found. Expected at {DATA_PATH}.",
        )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "data_present": store.exists(),
        "data_path": str(store.path),
    }


@app.get("/api/overview")
def get_overview():
    return stats.overview(_ds())


@app.get("/api/leaderboard")
def get_leaderboard():
    return stats.leaderboard(_ds())


@app.get("/api/winrate")
def get_winrate():
    return stats.winrate(_ds())


@app.get("/api/scoring-rate")
def get_scoring_rate():
    return stats.scoring_rate(_ds())


@app.get("/api/ga-rate")
def get_ga_rate():
    return stats.ga_rate(_ds())


@app.get("/api/form")
def get_form():
    return stats.recent_form(_ds())


@app.get("/api/season-trend")
def get_season_trend():
    return stats.season_trend(_ds())


@app.get("/api/matches")
def get_matches():
    return stats.matches(_ds())


@app.get("/api/matches/{date}")
def get_match(date: str):
    detail = stats.match_detail(_ds(), date)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No match on {date}.")
    return detail


@app.get("/api/mensalistas")
def get_mensalistas():
    return stats.mensalistas_report(_ds())


@app.get("/api/mvp")
def get_mvp():
    return stats.mvp(_ds())


@app.get("/api/attendance")
def get_attendance():
    return stats.attendance(_ds())


@app.get("/api/synergy")
def get_synergy():
    return stats.synergy(_ds())


@app.get("/api/players")
def get_players():
    return stats.players_index(_ds())


@app.get("/api/players/{name}")
def get_player(name: str):
    profile = stats.player_profile(_ds(), name)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Player '{name}' not found.")
    return profile
