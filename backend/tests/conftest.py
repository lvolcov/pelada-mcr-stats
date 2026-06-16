"""Shared pytest fixtures. Points the app at the real workbook in ../data."""

import os
from pathlib import Path

import pytest

WORKBOOK = Path(__file__).resolve().parents[2] / "data" / "Football_Player_Match_and_Totals.xlsx"
os.environ["WORKBOOK_PATH"] = str(WORKBOOK)


@pytest.fixture(scope="session")
def dataset():
    from app.parser import WorkbookStore

    return WorkbookStore(WORKBOOK).get()


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
