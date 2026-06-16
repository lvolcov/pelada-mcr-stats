# Pelada MCR Stats Website — Project Brief

## Goal

Build a React web app (Dockerised) that reads the Monday football group's Excel tracking file and presents it as a set of interactive dashboards. The file is the single source of truth; replacing it after each game should refresh all data automatically.

---

## Excel File Analysis

**File:** `Football_Player_Match_and_Totals.xlsx`

### Sheets

| Sheet | Purpose |
|---|---|
| `Jogadores` | Master player registry — 33 players (lowercase names, used as dropdown validation) |
| `Player Match Stats` | Raw event log — one row per player per game day |
| `Geral` | Pivot: per-player season aggregates |
| `GA` | Goals + Assists ranking table (composite score = goals×1000 + assists for tiebreaking) |
| `% Vitórias` | Win-rate analysis with an eligibility filter (≥60% of total games played) |

### Raw Data (`Player Match Stats`)

| Column | Type | Notes |
|---|---|---|
| Date | datetime | Weekly Monday session date |
| Score | string | e.g. `"4 x 2"` — overall match score |
| Player | string | Lowercase player name |
| Goals | int | Goals scored in this game |
| Assists | int | Assists in this game |
| Vitoria | 0/1 | Player's team won |
| Derrota | 0/1 | Player's team lost |
| Empate | 0/1 | Draw |
| Time misto | 0/1 | Flag for when teams were mixed (treated separately in rankings) |

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
├── backend/          # Python (FastAPI) — parses Excel, exposes REST API
│   └── ...
├── frontend/         # React — dashboards and UI
│   └── ...
└── data/             # Mounted volume — drop new .xlsx here to refresh
    └── Football_Player_Match_and_Totals.xlsx
```

- The `data/` folder is a Docker volume mount. Replacing the file triggers a re-read on next API call.
- The backend parses the Excel on request (no database needed for this scale).
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
├── backend/          # Python FastAPI — parses Excel, exposes REST API
│   ├── main.py
│   ├── parser.py     # openpyxl → structured dicts/dataframes
│   └── requirements.txt
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── pages/    # Home, Leaderboard, PlayerProfile, MatchHistory, ...
│       └── components/
└── data/             # Docker volume mount — replace .xlsx here to refresh
    └── Football_Player_Match_and_Totals.xlsx
```
