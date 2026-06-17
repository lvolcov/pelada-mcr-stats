# Pelada MCR Stats Website — Project Brief

> **Note:** This is the original scoping document. For the **current, living
> documentation** of the built system (architecture, hosting, data model, the
> mixed-match rule, mensalistas, match pages, photos, API and how to update data),
> see **[README.md](README.md)**.

## Goal

Build a React web app (Dockerised) that reads the Monday football group's Excel tracking file and presents it as a set of interactive dashboards. The file is the single source of truth; replacing it after each game should refresh all data automatically.

---

## Data Model

> Originally an Excel workbook; **migrated to plain CSV on 2026-06-17** so it can be
> appended programmatically (e.g. by the Telegram update bot) and diffed in git. The
> site only ever used the raw event log + roster — the workbook's pivot sheets
> (`Geral`, `GA`, `% Vitórias`) were derived views and are gone.

**Files** (in `data/`):

| File | Purpose |
|---|---|
| `matches.csv` | Source of truth — one row per player per game day |
| `players.csv` | Master player registry — 33 players (lowercase names) |
| `mensalistas.json` | Fixed-spot (mensalista) registry |

### `matches.csv`

| Column | Type | Notes |
|---|---|---|
| `date` | `YYYY-MM-DD` | Weekly Monday session date |
| `score` | string | e.g. `"4 x 2"` — overall match score |
| `player` | string | Lowercase player name (must exist in `players.csv`) |
| `goals` | int | Goals scored in this game |
| `assists` | int | Assists in this game |
| `win` | 0/1 | Player's team won |
| `loss` | 0/1 | Player's team lost |
| `draw` | 0/1 | Draw |
| `mixed` | 0/1 | Teams were mixed that day (treated separately in rankings) |

### Key Numbers (as of 2026-06-16)

- **19 match days** — 19 Jan 2026 to 08 Jun 2026 (roughly every Monday)
- **33 registered players**, ~14 per session on average
- **270 player-match rows** total
- **219 goals, 156 assists** scored season-to-date
- Win/Loss/Draw record (aggregate): **105 / 105 / 40** (perfectly balanced wins and losses — as expected from head-to-head)

### Current Rankings Logic

- **Goals ranking:** raw sum of goals, descending
- **G+A ranking:** composite `goals × 1000 + assists` for tiebreaking
- **Win-rate ranking:** only players with **≥60% of total sessions** (currently ≥12 of 19 games) are eligible
- **"Time misto"** sessions are flagged but still counted; the Excel currently tracks them as a separate column rather than excluding them

### Notable Stats

| # | Player | Goals | Assists | Games | Win % |
|---|---|---|---|---|---|
| 1 | junior | 30 | 11 | 10 | — |
| 2 | guilherme | 18 | 21 | 17 | 56.3% 🥇 |
| 3 | miguel miranda | 18 | 7 | 15 | — |
| 4 | douglas b | 17 | 24 | 18 | — |
| — | lucas volcov | 4 | 7 | 15 | 50.0% |

---

## Proposed Architecture (Docker)

```
pelada-stats/
├── docker-compose.yml
├── backend/          # Python (FastAPI) — parses the CSV, exposes REST API
│   └── ...
├── frontend/         # React — dashboards and UI
│   └── ...
└── data/             # Mounted volume — edit matches.csv here to refresh
    ├── matches.csv
    ├── players.csv
    └── mensalistas.json
```

- The `data/` folder is a Docker volume mount. Editing a file triggers a re-read on next API call.
- The backend parses the CSV on request (no database needed for this scale).
- The frontend calls the backend API and renders charts/tables.

---

## Scoping Decisions

| Topic | Decision |
|---|---|
| Audience | Group link, no auth. Individual player pages accessible via `/player/<name>` |
| Language | Brazilian Portuguese default with EN toggle |
| Data refresh | Auto on every page load (backend reads file fresh on each API call) |
| Dashboards | See below |

---

## Dashboards — v1 Scope

### Must-haves
1. **Placar Geral (Overall Leaderboard)** — sortable table: games played, goals, assists, wins, losses, draws, win%
2. **Perfil do Jogador (Player Profile)** — individual page per player: career summary cards, game-by-game log, goals over time chart, win/loss/draw doughnut
3. **Histórico de Partidas (Match History)** — list of all game days: score, scorers, who played, goals by team
4. **Ranking de Vitórias (Win% Ranking)** — ≥60% attendance filter, podium display (as per Excel logic)

### Additional dashboards (proposed)
5. **Artilharia por Jogo (Scoring Rate)** — goals ÷ games played, min. games threshold; rewards efficiency over volume
6. **Forma Recente (Recent Form)** — last 5 games per player shown as W/L/D pill strip; sortable by current streak
7. **Evolução da Temporada (Season Trend)** — line chart: total goals and assists scored per game day across the season
8. **MVP por Rodada (Match MVP board)** — for each game day, highlight the top scorer/assist player; season MVP leaderboard
9. **G+A por Jogo (Combined Rate)** — (Goals + Assists) ÷ games played; different from raw totals, rewards all-round contributors
10. **Presença (Attendance Tracker)** — calendar/heatmap showing which sessions each player attended; highlights the regulars

---

## Architecture

```
pelada-stats/
├── docker-compose.yml
├── backend/          # Python FastAPI — parses the CSV, exposes REST API
│   ├── main.py
│   ├── parser.py     # csv → structured dicts/dataframes
│   └── requirements.txt
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── pages/    # Home, Leaderboard, PlayerProfile, MatchHistory, ...
│       └── components/
└── data/             # Docker volume mount — edit matches.csv here to refresh
    ├── matches.csv
    ├── players.csv
    └── mensalistas.json
```
