"""Shared pytest fixtures.

Tests run against a frozen sample dataset (tests/data/) — a snapshot of the
19-match season — so adding real matches to data/matches.csv never breaks the
suite. The asserted totals below correspond to this fixed sample.
"""

import os
from pathlib import Path

import pytest

MATCHES = Path(__file__).resolve().parent / "data" / "sample_matches.csv"
os.environ["MATCHES_PATH"] = str(MATCHES)


@pytest.fixture(scope="session")
def dataset():
    from app.parser import DataStore

    return DataStore(str(MATCHES)).get()


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
