"""Pre-render every API response to static JSON for GitHub Pages hosting.

Runs the same stats engine the live API uses, but writes the results to a folder of
.json files that the frontend fetches directly when built in static mode. This is
what the GitHub Actions workflow calls before building the site.

Usage:
    python generate_static.py [--matches PATH] [--out DIR]

Created: 2026-06-16
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from app import stats
from app.parser import DataStore

ROOT = Path(__file__).resolve().parent


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate static JSON for the dashboards.")
    parser.add_argument(
        "--matches",
        default=str(ROOT.parent / "data" / "matches.csv"),
        help="Path to the matches CSV.",
    )
    parser.add_argument(
        "--out",
        default=str(ROOT.parent / "frontend" / "public" / "data"),
        help="Output directory for the JSON files.",
    )
    args = parser.parse_args()

    out = Path(args.out)
    ds = DataStore(args.matches).get()

    # Top-level endpoints -> <name>.json
    endpoints = {
        "overview": stats.overview(ds),
        "leaderboard": stats.leaderboard(ds),
        "winrate": stats.winrate(ds),
        "scoring-rate": stats.scoring_rate(ds),
        "ga-rate": stats.ga_rate(ds),
        "form": stats.recent_form(ds),
        "season-trend": stats.season_trend(ds),
        "matches": stats.matches(ds),
        "mvp": stats.mvp(ds),
        "attendance": stats.attendance(ds),
        "players": stats.players_index(ds),
        "mensalistas": stats.mensalistas_report(ds),
        "synergy": stats.synergy(ds),
    }
    for name, payload in endpoints.items():
        write_json(out / f"{name}.json", payload)

    # Per-player profiles -> players/<name>.json
    for p in stats.players_index(ds):
        profile = stats.player_profile(ds, p["player"])
        write_json(out / "players" / f"{p['player']}.json", profile)

    # Per-match details -> matches/<date>.json
    match_list = stats.matches(ds)
    for m in match_list:
        write_json(out / "matches" / f"{m['date']}.json", stats.match_detail(ds, m["date"]))

    print(
        f"Generated {len(endpoints)} endpoint files + "
        f"{len(endpoints['players'])} player profiles + "
        f"{len(match_list)} match details into {out}"
    )


if __name__ == "__main__":
    main()
