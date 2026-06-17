"""Statistics engine for the Pelada dashboards.

Every figure is derived from the raw ``MatchRow`` list (never the workbook's own
pivot sheets, which may be stale). Each function returns plain dicts/lists ready to
be serialised to JSON.

Mixed-team days ("time misto", e.g. the 3-team session on 2026-02-23) are special:
their goals and assists DO count towards season totals, but they are excluded from
everything else — games played, win/loss/draw records, win-rate eligibility,
per-game rates, recent form, MVP, attendance and the season trend. The match still
appears in the match history, clearly flagged.

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


def _regular(rows: list[MatchRow]) -> list[MatchRow]:
    """Rows from normal matches (excludes mixed-team days)."""
    return [r for r in rows if not r.mixed]


def _sessions(ds: Dataset) -> list[date]:
    """Regular (non-mixed) session dates."""
    return sorted({r.date for r in ds.rows if not r.mixed})


def _all_dates(ds: Dataset) -> list[date]:
    """Every session date, including mixed-team days."""
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


def _result_letter(r: MatchRow) -> str:
    if r.mixed:
        return "M"
    if r.win:
        return "W"
    if r.loss:
        return "L"
    if r.draw:
        return "D"
    return "-"


# --------------------------------------------------------------------------- #
# Core per-player aggregate (used by several dashboards)
# --------------------------------------------------------------------------- #

def _player_totals(ds: Dataset) -> list[dict]:
    by_player = _rows_by_player(ds)
    result = []
    for name, rows in by_player.items():
        reg = _regular(rows)
        games = len(reg)  # mixed days are not counted as games
        # Goals/assists totals DO include mixed days.
        goals = sum(r.goals for r in rows)
        assists = sum(r.assists for r in rows)
        # Per-game rates use regular-only goals so the rate stays meaningful.
        reg_goals = sum(r.goals for r in reg)
        reg_assists = sum(r.assists for r in reg)
        wins = sum(r.win for r in reg)
        losses = sum(r.loss for r in reg)
        draws = sum(r.draw for r in reg)
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
                "mixed_games": len(rows) - games,
                "win_pct": _pct(wins, decided),
                "loss_pct": _pct(losses, decided),
                "draw_pct": _pct(draws, decided),
                "goals_per_game": round(reg_goals / games, 2) if games else 0.0,
                "ga_per_game": round((reg_goals + reg_assists) / games, 2) if games else 0.0,
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
    reg_goals = sum(r.goals for r in ds.rows if not r.mixed)
    reg_rows = sum(1 for r in ds.rows if not r.mixed)
    totals = _player_totals(ds)

    top_scorer = max(totals, key=lambda p: (p["goals"], p["assists"]), default=None)
    top_assister = max(totals, key=lambda p: (p["assists"], p["goals"]), default=None)

    # Highest-scoring regular session by total goals in the score line.
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
        "mensalistas": len(ds.mensalistas),
        "total_goals": total_goals,
        "total_assists": total_assists,
        "avg_goals_per_session": round(reg_goals / len(sessions), 1) if sessions else 0,
        "avg_players_per_session": round(reg_rows / len(sessions), 1) if sessions else 0,
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


def recent_form(ds: Dataset) -> list[dict]:
    """Form over the last FORM_WINDOW *actual* sessions.

    The window is the most recent regular session dates (global), so players who
    haven't shown up lately drop down the list — the page is about who's hot *now*,
    not who once had a good run.
    """
    sessions = _sessions(ds)
    window = sessions[-FORM_WINDOW:]  # chronological list of the last N session dates
    by_date = _rows_by_date(ds)
    window_scores = {d: by_date[d][0].score for d in window}
    last_session = sessions[-1] if sessions else None
    by_player = _rows_by_player(ds)
    out = []
    for name, rows in by_player.items():
        reg = sorted(_regular(rows), key=lambda r: r.date)
        if not reg:
            continue
        played = {r.date: r for r in reg}
        # One entry per session in the window; "A" marks a session the player missed,
        # so absences are visible instead of silently collapsed.
        form = [_result_letter(played[d]) if d in played else "A" for d in window]
        recent_games = sum(1 for x in form if x != "A")
        points = sum(3 if x == "W" else 1 if x == "D" else 0 for x in form)
        last_seen = reg[-1].date
        # Current streak from the most recent decided results (over all regular games).
        streak_type, streak_len = None, 0
        for letter in (_result_letter(r) for r in reversed(reg)):
            if letter == "-":
                continue
            if streak_type is None:
                streak_type, streak_len = letter, 1
            elif letter == streak_type:
                streak_len += 1
            else:
                break
        out.append(
            {
                "player": name,
                "name": display_name(name),
                "games": len(reg),
                "recent_games": recent_games,
                "form": form,
                "form_dates": [d.isoformat() for d in window],
                "form_scores": [window_scores[d] for d in window],
                "streak_type": streak_type,
                "streak_len": streak_len,
                "form_points": points,
                "last_seen": last_seen.isoformat(),
                "missed_last": bool(last_session and last_seen != last_session),
            }
        )
    # Active players first: most recent games, then points, then who played latest.
    out.sort(
        key=lambda p: (p["recent_games"], p["form_points"], p["last_seen"]),
        reverse=True,
    )
    return out


def season_trend(ds: Dataset) -> list[dict]:
    by_date = _rows_by_date(ds)
    out = []
    for d in _sessions(ds):  # regular sessions only
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


def _match_players(rows: list[MatchRow]) -> list[dict]:
    players = [
        {
            "player": r.player,
            "name": display_name(r.player),
            "goals": r.goals,
            "assists": r.assists,
            "result": _result_letter(r),
        }
        for r in rows
    ]
    players.sort(key=lambda p: (p["goals"], p["assists"]), reverse=True)
    return players


def matches(ds: Dataset) -> list[dict]:
    by_date = _rows_by_date(ds)
    out = []
    for d in sorted(_all_dates(ds), reverse=True):
        rows = by_date[d]
        players = _match_players(rows)
        scorers = [p for p in players if p["goals"] > 0]
        mixed = bool(rows[0].mixed) or "x" not in rows[0].score
        out.append(
            {
                "date": d.isoformat(),
                "score": rows[0].score,
                "mixed": mixed,
                "player_count": len(rows),
                "total_player_goals": sum(r.goals for r in rows),
                "total_player_assists": sum(r.assists for r in rows),
                "match_goals": _score_goals(rows[0].score),
                "players": players,
                "top_scorers": scorers[:3],
            }
        )
    return out


def match_detail(ds: Dataset, date_iso: str) -> dict | None:
    """Full breakdown of one session: teams (when known), stats and MVP."""
    by_date = _rows_by_date(ds)
    target = next((d for d in by_date if d.isoformat() == date_iso), None)
    if target is None:
        return None
    rows = by_date[target]
    mixed = bool(rows[0].mixed) or "x" not in rows[0].score
    players = _match_players(rows)

    # Sides come straight from each player's win/loss flag (no team column exists,
    # so draws and mixed days can't be split into two teams).
    winners = _match_players([r for r in rows if r.win])
    losers = _match_players([r for r in rows if r.loss])
    is_draw = (not mixed) and all(r.draw for r in rows) and not winners and not losers
    teams_known = bool(winners) and bool(losers)

    scored = [p for p in players if p["goals"] > 0 or p["assists"] > 0]
    mvp = max(players, key=lambda p: (p["goals"], p["assists"]), default=None)
    if mvp and mvp["goals"] == 0 and mvp["assists"] == 0:
        mvp = None

    return {
        "date": target.isoformat(),
        "score": rows[0].score,
        "mixed": mixed,
        "is_draw": is_draw,
        "teams_known": teams_known,
        "player_count": len(rows),
        "total_player_goals": sum(r.goals for r in rows),
        "total_player_assists": sum(r.assists for r in rows),
        "match_goals": _score_goals(rows[0].score),
        "winners": winners,
        "losers": losers,
        "players": players,
        "scorers": scored,
        "mvp": None if mixed else mvp,  # mixed days have no MVP
        "highlight": mvp,  # top performer regardless (used for mixed days)
    }


def mvp(ds: Dataset) -> dict:
    by_date = _rows_by_date(ds)
    per_session = []
    season_tally: dict[str, int] = defaultdict(int)
    for d in sorted(_sessions(ds), reverse=True):  # regular sessions only
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
    sessions = _sessions(ds)  # regular sessions only
    by_date = _rows_by_date(ds)
    by_player = _rows_by_player(ds)
    present = {
        name: {r.date for r in rows if not r.mixed} for name, rows in by_player.items()
    }
    players = sorted(present.keys(), key=lambda n: (len(present[n]), n), reverse=True)
    grid = []
    for name in players:
        attended = present[name]
        if not attended:
            continue
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
        "session_info": [
            {"date": d.isoformat(), "score": by_date[d][0].score} for d in sessions
        ],
        "total_sessions": len(sessions),
        "players": grid,
    }


def mensalistas_report(ds: Dataset) -> dict:
    """Mensalistas with attendance context, to spot regulars who stop showing up."""
    sessions = _sessions(ds)
    by_player = _rows_by_player(ds)
    last_session = sessions[-1].isoformat() if sessions else None
    players = []
    for name, since in ds.mensalistas.items():
        reg = sorted({r.date for r in by_player.get(name, []) if not r.mixed})
        attended = len(reg)
        last_seen = reg[-1].isoformat() if reg else None
        # Sessions held since this player became a mensalista.
        eligible = [d for d in sessions if d.isoformat() >= since]
        players.append(
            {
                "player": name,
                "name": display_name(name),
                "since": since,
                "attended": attended,
                "attendance_pct": _pct(attended, len(sessions)),
                "attendance_since_pct": _pct(
                    sum(1 for d in reg if d.isoformat() >= since), len(eligible)
                ),
                "last_seen": last_seen,
                "missed_last": bool(last_session and last_seen != last_session),
            }
        )
    players.sort(key=lambda p: (p["attendance_pct"], p["name"]))
    return {
        "total_sessions": len(sessions),
        "last_session": last_session,
        "map": dict(ds.mensalistas),
        "players": players,
    }


def player_profile(ds: Dataset, name: str) -> dict | None:
    name = name.strip().lower()
    by_player = _rows_by_player(ds)
    if name not in by_player:
        return None

    rows = sorted(by_player[name], key=lambda r: r.date)
    totals = next(p for p in _player_totals(ds) if p["player"] == name)

    # Cumulative goals/assists across the season (includes mixed-day goals).
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
                "mixed": bool(r.mixed),
            }
        )

    lb = leaderboard(ds)
    goals_rank = next((p["rank"] for p in lb if p["player"] == name), None)
    sr = scoring_rate(ds)["ranking"]
    rate_rank = next((p["rank"] for p in sr if p["player"] == name), None)

    best_goals_game = max(rows, key=lambda r: r.goals)
    recent = sorted(_regular(rows), key=lambda r: r.date)[-FORM_WINDOW:]
    return {
        **totals,
        "is_mensalista": name in ds.mensalistas,
        "mensalista_since": ds.mensalistas.get(name),
        "goals_rank": goals_rank,
        "scoring_rate_rank": rate_rank,
        "timeline": timeline,
        "game_log": list(reversed(game_log)),
        "best_game": {
            "date": best_goals_game.date.isoformat(),
            "goals": best_goals_game.goals,
            "assists": best_goals_game.assists,
        },
        "form": [_result_letter(r) for r in recent],
        "form_dates": [r.date.isoformat() for r in recent],
        "form_scores": [r.score for r in recent],
    }


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
            "is_mensalista": p["player"] in ds.mensalistas,
        }
        for p in totals
    ]
