"""Statistics engine for the Pelada dashboards.

Every figure is derived from the raw ``MatchRow`` list (never the workbook's own
pivot sheets, which may be stale). Each function returns plain dicts/lists ready to
be serialised to JSON.

Created: 2026-06-16
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import date

from .parser import Dataset, MatchRow

# Minimum games a player must have to appear in rate-based rankings.
RATE_MIN_GAMES = 5
# Attendance threshold (fraction of total sessions) for win-rate eligibility.
WINRATE_ELIGIBILITY = 0.60
# Window size for the "recent form" strip.
FORM_WINDOW = 5


def display_name(name: str) -> str:
    """Lowercase registry name -> friendly display name."""
    return " ".join(part.capitalize() for part in name.split())


def _sessions(ds: Dataset) -> list[date]:
    return sorted({r.date for r in ds.rows})


def _rows_by_player(ds: Dataset) -> dict[str, list[MatchRow]]:
    out: dict[str, list[MatchRow]] = defaultdict(list)
    for r in ds.rows:
        out[r.player].append(r)
    return out


def _rows_by_date(ds: Dataset) -> dict[date, list[MatchRow]]:
    out: dict[date, list[MatchRow]] = defaultdict(list)
    for r in ds.rows:
        out[r.date].append(r)
    return out


def _pct(part: int, whole: int) -> float:
    return round(100 * part / whole, 1) if whole else 0.0


def _score_goals(score: str) -> int | None:
    """Total goals implied by a 'a x b' score string, else None."""
    if "x" not in score:
        return None
    try:
        a, b = score.split("x")
        return int(a.strip()) + int(b.strip())
    except (ValueError, IndexError):
        return None


# --------------------------------------------------------------------------- #
# Core per-player aggregate (used by several dashboards)
# --------------------------------------------------------------------------- #

def _player_totals(ds: Dataset) -> list[dict]:
    by_player = _rows_by_player(ds)
    result = []
    for name, rows in by_player.items():
        games = len(rows)
        goals = sum(r.goals for r in rows)
        assists = sum(r.assists for r in rows)
        wins = sum(r.win for r in rows)
        losses = sum(r.loss for r in rows)
        draws = sum(r.draw for r in rows)
        mixed = sum(r.mixed for r in rows)
        decided = wins + losses + draws
        result.append(
            {
                "player": name,
                "name": display_name(name),
                "games": games,
                "goals": goals,
                "assists": assists,
                "ga": goals + assists,
                "wins": wins,
                "losses": losses,
                "draws": draws,
                "mixed": mixed,
                "win_pct": _pct(wins, decided),
                "loss_pct": _pct(losses, decided),
                "draw_pct": _pct(draws, decided),
                "goals_per_game": round(goals / games, 2) if games else 0.0,
                "ga_per_game": round((goals + assists) / games, 2) if games else 0.0,
            }
        )
    return result


# --------------------------------------------------------------------------- #
# Dashboard builders
# --------------------------------------------------------------------------- #

def overview(ds: Dataset) -> dict:
    sessions = _sessions(ds)
    by_date = _rows_by_date(ds)
    total_goals = sum(r.goals for r in ds.rows)
    total_assists = sum(r.assists for r in ds.rows)
    totals = _player_totals(ds)

    top_scorer = max(totals, key=lambda p: (p["goals"], p["assists"]), default=None)
    top_assister = max(totals, key=lambda p: (p["assists"], p["goals"]), default=None)

    # Highest-scoring session by total goals in the score line.
    busiest = None
    for d in sessions:
        rows = by_date[d]
        sg = _score_goals(rows[0].score)
        goals_in_session = sg if sg is not None else sum(r.goals for r in rows)
        if busiest is None or goals_in_session > busiest["goals"]:
            busiest = {"date": d.isoformat(), "score": rows[0].score, "goals": goals_in_session}

    return {
        "sessions": len(sessions),
        "players": len({r.player for r in ds.rows}),
        "registered_players": len(ds.registered_players),
        "total_goals": total_goals,
        "total_assists": total_assists,
        "avg_goals_per_session": round(total_goals / len(sessions), 1) if sessions else 0,
        "avg_players_per_session": round(len(ds.rows) / len(sessions), 1) if sessions else 0,
        "first_session": sessions[0].isoformat() if sessions else None,
        "last_session": sessions[-1].isoformat() if sessions else None,
        "top_scorer": top_scorer,
        "top_assister": top_assister,
        "busiest_session": busiest,
        "parsed_at": ds.parsed_at,
    }


def leaderboard(ds: Dataset) -> list[dict]:
    totals = _player_totals(ds)
    totals.sort(key=lambda p: (p["goals"], p["assists"], p["games"]), reverse=True)
    for i, p in enumerate(totals, 1):
        p["rank"] = i
    return totals


def winrate(ds: Dataset) -> dict:
    sessions = _sessions(ds)
    min_games = math.ceil(len(sessions) * WINRATE_ELIGIBILITY)
    eligible = [p for p in _player_totals(ds) if p["games"] >= min_games]
    eligible.sort(key=lambda p: (p["win_pct"], p["wins"], -p["losses"]), reverse=True)
    for i, p in enumerate(eligible, 1):
        p["rank"] = i
    return {
        "total_sessions": len(sessions),
        "min_games": min_games,
        "eligibility_pct": int(WINRATE_ELIGIBILITY * 100),
        "ranking": eligible,
    }


def scoring_rate(ds: Dataset) -> dict:
    qualified = [p for p in _player_totals(ds) if p["games"] >= RATE_MIN_GAMES]
    qualified.sort(key=lambda p: (p["goals_per_game"], p["goals"]), reverse=True)
    for i, p in enumerate(qualified, 1):
        p["rank"] = i
    return {"min_games": RATE_MIN_GAMES, "ranking": qualified}


def ga_rate(ds: Dataset) -> dict:
    qualified = [p for p in _player_totals(ds) if p["games"] >= RATE_MIN_GAMES]
    qualified.sort(key=lambda p: (p["ga_per_game"], p["ga"]), reverse=True)
    for i, p in enumerate(qualified, 1):
        p["rank"] = i
    return {"min_games": RATE_MIN_GAMES, "ranking": qualified}


def _result_letter(r: MatchRow) -> str:
    if r.win:
        return "W"
    if r.loss:
        return "L"
    if r.draw:
        return "D"
    return "-"


def recent_form(ds: Dataset) -> list[dict]:
    by_player = _rows_by_player(ds)
    out = []
    for name, rows in by_player.items():
        rows_sorted = sorted(rows, key=lambda r: r.date)
        letters = [_result_letter(r) for r in rows_sorted]
        window = letters[-FORM_WINDOW:]
        # Current streak from the most recent decided result.
        streak_type, streak_len = None, 0
        for letter in reversed(letters):
            if letter == "-":
                continue
            if streak_type is None:
                streak_type, streak_len = letter, 1
            elif letter == streak_type:
                streak_len += 1
            else:
                break
        recent = rows_sorted[-FORM_WINDOW:]
        points = sum(3 if x == "W" else 1 if x == "D" else 0 for x in window)
        out.append(
            {
                "player": name,
                "name": display_name(name),
                "games": len(rows),
                "form": window,
                "form_dates": [r.date.isoformat() for r in recent],
                "streak_type": streak_type,
                "streak_len": streak_len,
                "form_points": points,
            }
        )
    out.sort(key=lambda p: (p["form_points"], p["games"]), reverse=True)
    return out


def season_trend(ds: Dataset) -> list[dict]:
    by_date = _rows_by_date(ds)
    out = []
    for d in _sessions(ds):
        rows = by_date[d]
        sg = _score_goals(rows[0].score)
        out.append(
            {
                "date": d.isoformat(),
                "score": rows[0].score,
                "player_goals": sum(r.goals for r in rows),
                "assists": sum(r.assists for r in rows),
                "match_goals": sg,
                "players": len(rows),
            }
        )
    return out


def matches(ds: Dataset) -> list[dict]:
    by_date = _rows_by_date(ds)
    out = []
    for d in sorted(_sessions(ds), reverse=True):
        rows = by_date[d]
        players = sorted(
            (
                {
                    "player": r.player,
                    "name": display_name(r.player),
                    "goals": r.goals,
                    "assists": r.assists,
                    "result": _result_letter(r),
                }
                for r in rows
            ),
            key=lambda p: (p["goals"], p["assists"]),
            reverse=True,
        )
        scorers = [p for p in players if p["goals"] > 0]
        out.append(
            {
                "date": d.isoformat(),
                "score": rows[0].score,
                "mixed": bool(rows[0].mixed) or "x" not in rows[0].score,
                "player_count": len(rows),
                "total_player_goals": sum(r.goals for r in rows),
                "match_goals": _score_goals(rows[0].score),
                "players": players,
                "top_scorers": scorers[:3],
            }
        )
    return out


def mvp(ds: Dataset) -> dict:
    by_date = _rows_by_date(ds)
    per_session = []
    season_tally: dict[str, int] = defaultdict(int)
    for d in sorted(_sessions(ds), reverse=True):
        rows = by_date[d]
        ranked = sorted(rows, key=lambda r: (r.goals, r.assists), reverse=True)
        best = ranked[0]
        if best.goals == 0 and best.assists == 0:
            top = None
        else:
            top = {
                "player": best.player,
                "name": display_name(best.player),
                "goals": best.goals,
                "assists": best.assists,
            }
            season_tally[best.player] += 1
        per_session.append({"date": d.isoformat(), "score": rows[0].score, "mvp": top})

    season = [
        {"player": p, "name": display_name(p), "mvp_count": c}
        for p, c in season_tally.items()
    ]
    season.sort(key=lambda x: x["mvp_count"], reverse=True)
    for i, p in enumerate(season, 1):
        p["rank"] = i
    return {"per_session": per_session, "season": season}


def attendance(ds: Dataset) -> dict:
    sessions = _sessions(ds)
    by_player = _rows_by_player(ds)
    present = {name: {r.date for r in rows} for name, rows in by_player.items()}
    players = sorted(
        present.keys(), key=lambda n: (len(present[n]), n), reverse=True
    )
    grid = []
    for name in players:
        attended = present[name]
        grid.append(
            {
                "player": name,
                "name": display_name(name),
                "attended": len(attended),
                "attendance_pct": _pct(len(attended), len(sessions)),
                "sessions": [d in attended for d in sessions],
            }
        )
    return {
        "session_dates": [d.isoformat() for d in sessions],
        "total_sessions": len(sessions),
        "players": grid,
    }


def player_profile(ds: Dataset, name: str) -> dict | None:
    name = name.strip().lower()
    by_player = _rows_by_player(ds)
    if name not in by_player:
        return None

    rows = sorted(by_player[name], key=lambda r: r.date)
    totals = next(p for p in _player_totals(ds) if p["player"] == name)

    # Cumulative goals/assists across the season + per-game log.
    cum_g = cum_a = 0
    timeline = []
    game_log = []
    for r in rows:
        cum_g += r.goals
        cum_a += r.assists
        timeline.append(
            {"date": r.date.isoformat(), "cum_goals": cum_g, "cum_assists": cum_a}
        )
        game_log.append(
            {
                "date": r.date.isoformat(),
                "score": r.score,
                "goals": r.goals,
                "assists": r.assists,
                "result": _result_letter(r),
            }
        )

    # Ranks across the various boards.
    lb = leaderboard(ds)
    goals_rank = next((p["rank"] for p in lb if p["player"] == name), None)
    sr = scoring_rate(ds)["ranking"]
    rate_rank = next((p["rank"] for p in sr if p["player"] == name), None)

    best_goals_game = max(rows, key=lambda r: r.goals)
    return {
        **totals,
        "goals_rank": goals_rank,
        "scoring_rate_rank": rate_rank,
        "timeline": timeline,
        "game_log": list(reversed(game_log)),
        "best_game": {
            "date": best_goals_game.date.isoformat(),
            "goals": best_goals_game.goals,
            "assists": best_goals_game.assists,
        },
        "form": recent_form_for(rows),
    }


def recent_form_for(rows: list[MatchRow]) -> list[str]:
    rows_sorted = sorted(rows, key=lambda r: r.date)
    return [_result_letter(r) for r in rows_sorted][-FORM_WINDOW:]


def players_index(ds: Dataset) -> list[dict]:
    """Lightweight list for the player picker."""
    totals = _player_totals(ds)
    totals.sort(key=lambda p: p["name"])
    return [
        {
            "player": p["player"],
            "name": p["name"],
            "games": p["games"],
            "goals": p["goals"],
            "assists": p["assists"],
        }
        for p in totals
    ]
