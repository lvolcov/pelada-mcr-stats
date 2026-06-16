"""Unit tests for the statistics engine, validated against known workbook totals."""

from app import stats


def test_dataset_loads(dataset):
    assert len(dataset.rows) == 270
    assert len(dataset.registered_players) == 33


def test_overview_totals(dataset):
    ov = stats.overview(dataset)
    assert ov["sessions"] == 19
    assert ov["total_goals"] == 219
    assert ov["total_assists"] == 156
    assert ov["top_scorer"]["player"] == "junior"
    assert ov["top_scorer"]["goals"] == 30


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
    assert wr["min_games"] == 12  # ceil(19 * 0.6)
    assert all(p["games"] >= wr["min_games"] for p in wr["ranking"])
    pcts = [p["win_pct"] for p in wr["ranking"]]
    assert pcts == sorted(pcts, reverse=True)


def test_scoring_rate_threshold(dataset):
    sr = stats.scoring_rate(dataset)
    assert all(p["games"] >= sr["min_games"] for p in sr["ranking"])
    assert sr["ranking"][0]["player"] == "junior"  # 30 goals / 10 games = 3.0


def test_recent_form_window(dataset):
    form = stats.recent_form(dataset)
    assert all(len(p["form"]) <= 5 for p in form)
    assert all(c in {"W", "L", "D", "-"} for p in form for c in p["form"])


def test_attendance_consistency(dataset):
    att = stats.attendance(dataset)
    assert att["total_sessions"] == 19
    for p in att["players"]:
        assert len(p["sessions"]) == 19
        assert sum(p["sessions"]) == p["attended"]


def test_player_profile(dataset):
    prof = stats.player_profile(dataset, "lucas volcov")
    assert prof is not None
    assert prof["games"] == 15
    assert len(prof["timeline"]) == prof["games"]
    # Cumulative goals are monotonically non-decreasing.
    cum = [t["cum_goals"] for t in prof["timeline"]]
    assert cum == sorted(cum)


def test_player_profile_unknown(dataset):
    assert stats.player_profile(dataset, "not-a-real-player") is None


def test_mvp_tally_matches_sessions(dataset):
    mv = stats.mvp(dataset)
    assert len(mv["per_session"]) == 19
    total_mvps = sum(p["mvp_count"] for p in mv["season"])
    sessions_with_mvp = sum(1 for s in mv["per_session"] if s["mvp"])
    assert total_mvps == sessions_with_mvp
