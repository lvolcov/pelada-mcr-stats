"""Unit tests for the statistics engine, validated against known workbook totals."""

from app import stats


def test_dataset_loads(dataset):
    assert len(dataset.rows) == 270
    assert len(dataset.registered_players) == 33


def test_overview_totals(dataset):
    ov = stats.overview(dataset)
    # 19 dates total, but the mixed-team day (2026-02-23) is not a regular session.
    assert ov["sessions"] == 18
    # Goals/assists totals still include the mixed day.
    assert ov["total_goals"] == 219
    assert ov["total_assists"] == 156
    assert ov["top_scorer"]["player"] == "junior"
    assert ov["top_scorer"]["goals"] == 30
    assert ov["mensalistas"] == 16


def test_mixed_match_excluded_from_games(dataset):
    """Mixed-day goals count, but the day is not counted as a game."""
    lb = {p["player"]: p for p in stats.leaderboard(dataset)}
    # bruno played 2026-02-23 (mixed), 03-09, 03-23 -> only 2 regular games.
    assert lb["bruno"]["games"] == 2
    assert lb["bruno"]["mixed_games"] == 1


def test_leaderboard_sorted_and_ranked(dataset):
    lb = stats.leaderboard(dataset)
    assert lb[0]["player"] == "junior"
    assert lb[0]["rank"] == 1
    # Goals must be non-increasing.
    goals = [p["goals"] for p in lb]
    assert goals == sorted(goals, reverse=True)


def test_win_loss_draw_balance(dataset):
    """Aggregate wins must equal aggregate losses (head-to-head)."""
    totals = stats._player_totals(dataset)
    assert sum(p["wins"] for p in totals) == sum(p["losses"] for p in totals)


def test_winrate_eligibility(dataset):
    wr = stats.winrate(dataset)
    assert wr["total_sessions"] == 18  # mixed day excluded
    assert wr["min_games"] == 11  # ceil(18 * 0.6)
    assert all(p["games"] >= wr["min_games"] for p in wr["ranking"])
    pcts = [p["win_pct"] for p in wr["ranking"]]
    assert pcts == sorted(pcts, reverse=True)


def test_scoring_rate_threshold(dataset):
    sr = stats.scoring_rate(dataset)
    assert all(p["games"] >= sr["min_games"] for p in sr["ranking"])
    assert sr["ranking"][0]["player"] == "junior"  # 30 goals / 10 games = 3.0


def test_recent_form_window(dataset):
    form = stats.recent_form(dataset)
    # One pill per session in the window (5), including absences ("A").
    assert all(len(p["form"]) == 5 for p in form)
    assert all(c in {"W", "L", "D", "M", "A"} for p in form for c in p["form"])
    # recent_games counts only attended sessions in the window.
    assert all(p["recent_games"] == sum(1 for x in p["form"] if x != "A") for p in form)
    assert form[0]["recent_games"] >= 1
    # Absences are shown, not collapsed: lucas volcov missed 05-04 and 06-01.
    lucas = next(p for p in form if p["player"] == "lucas volcov")
    assert lucas["form"] == ["A", "W", "W", "A", "W"]
    # A player inactive across the whole window is all-absent and sorts low.
    bruno = next(p for p in form if p["player"] == "bruno")
    assert bruno["recent_games"] == 0
    assert bruno["form"] == ["A", "A", "A", "A", "A"]
    assert form.index(bruno) > 0


def test_attendance_consistency(dataset):
    att = stats.attendance(dataset)
    assert att["total_sessions"] == 18  # mixed day excluded
    for p in att["players"]:
        assert len(p["sessions"]) == 18
        assert sum(p["sessions"]) == p["attended"]


def test_match_detail_decided(dataset):
    md = stats.match_detail(dataset, "2026-06-08")
    assert md is not None
    assert md["teams_known"] is True
    assert len(md["winners"]) == 7 and len(md["losers"]) == 7
    assert md["mvp"] is not None


def test_match_detail_mixed_has_no_mvp(dataset):
    md = stats.match_detail(dataset, "2026-02-23")
    assert md["mixed"] is True
    assert md["mvp"] is None  # mixed days have no MVP
    assert md["highlight"] is not None  # but a top performer is still surfaced


def test_match_detail_missing(dataset):
    assert stats.match_detail(dataset, "2099-01-01") is None


def test_mensalistas_report(dataset):
    rep = stats.mensalistas_report(dataset)
    assert len(rep["players"]) == 16
    assert set(rep["map"]) == {p["player"] for p in rep["players"]}
    # bruno hasn't played since 2026-03-23 and should flag as missing the last session.
    bruno = next(p for p in rep["players"] if p["player"] == "bruno")
    assert bruno["last_seen"] == "2026-03-23"
    assert bruno["missed_last"] is True


def test_mvp_excludes_mixed(dataset):
    mv = stats.mvp(dataset)
    # 18 regular sessions get an MVP slot (mixed day excluded).
    assert len(mv["per_session"]) == 18


def test_player_profile(dataset):
    prof = stats.player_profile(dataset, "lucas volcov")
    assert prof is not None
    # Played 14 regular games + 1 mixed day; games excludes the mixed day.
    assert prof["games"] == 14
    assert prof["mixed_games"] == 1
    # Timeline/game log include every appearance (regular + mixed).
    assert len(prof["timeline"]) == prof["games"] + prof["mixed_games"]
    assert prof["is_mensalista"] is False
    # Attendance: played 14 of 18 regular sessions.
    assert prof["total_sessions"] == 18
    assert prof["attendance_pct"] == round(100 * 14 / 18, 1)
    # Cumulative goals are monotonically non-decreasing.
    cum = [t["cum_goals"] for t in prof["timeline"]]
    assert cum == sorted(cum)


def test_player_profile_unknown(dataset):
    assert stats.player_profile(dataset, "not-a-real-player") is None


def test_mvp_tally_matches_sessions(dataset):
    mv = stats.mvp(dataset)
    assert len(mv["per_session"]) == 18  # regular sessions only
    total_mvps = sum(p["mvp_count"] for p in mv["season"])
    sessions_with_mvp = sum(1 for s in mv["per_session"] if s["mvp"])
    assert total_mvps == sessions_with_mvp
