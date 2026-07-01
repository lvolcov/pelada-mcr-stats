"""CSV data layer for the Pelada match tracker.

Reads the single source of truth — ``matches.csv`` (one row per player per
session) — plus the ``players.csv`` roster and the ``mensalistas.json`` registry,
returning clean Python structures. Results are cached and invalidated when any
source file's modification time changes, so replacing a CSV (or appending a row)
refreshes everything on the next request.

The data used to live in an Excel workbook; it now lives in plain CSV so it can
be appended to programmatically (e.g. by the Telegram update bot) and diffed in
git. See docs/auto-update-pipeline.md.

Created: 2026-06-16 · Migrated to CSV: 2026-06-17
"""

from __future__ import annotations

import csv
import json
import threading
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path

MATCHES_FILE = "matches.csv"
PLAYERS_FILE = "players.csv"
MENSALISTAS_FILE = "mensalistas.json"


@dataclass
class MatchRow:
    """One player's record in a single session."""

    date: date
    score: str
    player: str
    goals: int
    assists: int
    win: int
    loss: int
    draw: int
    mixed: int  # "Time misto" — teams were reshuffled (3-team day)
    team: str = ""      # "1"/"2" side label (optional; lets draws keep their teams)
    sub_for: str = ""   # name of the player this one came on for (a substitution)


@dataclass
class Dataset:
    """Everything parsed from one snapshot of the source files."""

    rows: list[MatchRow] = field(default_factory=list)
    registered_players: list[str] = field(default_factory=list)
    # player name (lowercase) -> ISO date they became a mensalista (fixed weekly spot)
    mensalistas: dict[str, str] = field(default_factory=dict)
    source_mtime: float = 0.0
    parsed_at: str = ""


def _to_int(value) -> int:
    """Coerce a cell to int, treating blanks/None as 0."""
    if value is None or value == "":
        return 0
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _norm_team(value) -> str:
    """Normalise a team label to '1'/'2', or '' when absent/unrecognised."""
    s = str(value).strip() if value is not None else ""
    return s if s in ("1", "2") else ""


def _to_date(value) -> date | None:
    """Parse an ISO ``YYYY-MM-DD`` date (also tolerates a full timestamp)."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not value:
        return None
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except ValueError:
        return None


def _norm_score(value) -> str:
    """Normalise score text, e.g. '5 X 3 ' -> '5 x 3'."""
    if value is None:
        return ""
    s = str(value).strip()
    return s.replace(" X ", " x ").replace("X", "x") if any(c.isdigit() for c in s) else s


class DataStore:
    """Thread-safe, mtime-cached loader for the CSV data files.

    ``path`` is the matches CSV; the roster and mensalistas files are looked up
    next to it by default but can be overridden.
    """

    def __init__(
        self,
        path: str | Path,
        players_path: str | Path | None = None,
        mensalistas_path: str | Path | None = None,
    ) -> None:
        self._path = Path(path)
        self._players_path = (
            Path(players_path) if players_path else self._path.parent / PLAYERS_FILE
        )
        self._mensalistas_path = (
            Path(mensalistas_path)
            if mensalistas_path
            else self._path.parent / MENSALISTAS_FILE
        )
        self._lock = threading.Lock()
        self._cache: Dataset | None = None

    @property
    def path(self) -> Path:
        return self._path

    def exists(self) -> bool:
        return self._path.exists()

    def get(self) -> Dataset:
        """Return the parsed dataset, re-parsing if any source file changed."""
        if not self._path.exists():
            raise FileNotFoundError(f"Matches file not found at {self._path}")

        # Cache key combines every source file's mtime so editing any refreshes.
        mtime = self._path.stat().st_mtime
        for extra in (self._players_path, self._mensalistas_path):
            if extra.exists():
                mtime += extra.stat().st_mtime
        with self._lock:
            if self._cache is None or self._cache.source_mtime != mtime:
                self._cache = self._parse(mtime)
            return self._cache

    def _load_mensalistas(self) -> dict[str, str]:
        if not self._mensalistas_path.exists():
            return {}
        try:
            raw = json.loads(self._mensalistas_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
        data = raw.get("mensalistas", raw) if isinstance(raw, dict) else {}
        # Normalise keys to lowercase; drop any metadata keys like "_note".
        return {
            str(k).strip().lower(): str(v)
            for k, v in data.items()
            if not str(k).startswith("_")
        }

    def _load_roster(self) -> list[str]:
        if not self._players_path.exists():
            return []
        with self._players_path.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return [
                str(r["player"]).strip().lower()
                for r in reader
                if r.get("player") and str(r["player"]).strip()
            ]

    def _parse(self, mtime: float) -> Dataset:
        rows: list[MatchRow] = []
        with self._path.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                d = _to_date(r.get("date"))
                player = r.get("player")
                if d is None or not player or not str(player).strip():
                    continue
                rows.append(
                    MatchRow(
                        date=d,
                        score=_norm_score(r.get("score")),
                        player=str(player).strip().lower(),
                        goals=_to_int(r.get("goals")),
                        assists=_to_int(r.get("assists")),
                        win=_to_int(r.get("win")),
                        loss=_to_int(r.get("loss")),
                        draw=_to_int(r.get("draw")),
                        mixed=_to_int(r.get("mixed")),
                        team=_norm_team(r.get("team")),
                        sub_for=str(r.get("sub_for") or "").strip().lower(),
                    )
                )

        return Dataset(
            rows=rows,
            registered_players=self._load_roster(),
            mensalistas=self._load_mensalistas(),
            source_mtime=mtime,
            parsed_at=datetime.now().isoformat(timespec="seconds"),
        )
