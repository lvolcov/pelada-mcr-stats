"""Endpoint-level tests using FastAPI's TestClient."""


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_all_list_endpoints_ok(client):
    for path in [
        "/api/overview",
        "/api/leaderboard",
        "/api/winrate",
        "/api/scoring-rate",
        "/api/ga-rate",
        "/api/form",
        "/api/season-trend",
        "/api/matches",
        "/api/mvp",
        "/api/attendance",
        "/api/players",
    ]:
        r = client.get(path)
        assert r.status_code == 200, path
        assert r.json() is not None


def test_player_endpoint(client):
    r = client.get("/api/players/junior")
    assert r.status_code == 200
    assert r.json()["name"] == "Junior"


def test_player_not_found(client):
    r = client.get("/api/players/nobody")
    assert r.status_code == 404


def test_matches_shape(client):
    matches = client.get("/api/matches").json()
    assert len(matches) == 19
    # Newest first.
    dates = [m["date"] for m in matches]
    assert dates == sorted(dates, reverse=True)
