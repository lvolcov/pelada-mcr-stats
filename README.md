# ⚽ Pelada MCR · Stats

A dockerised web app that turns the Monday football group's Excel tracker into a set
of friendly, interactive dashboards. Drop a new workbook in after each game and the
site refreshes automatically.

**Stack:** FastAPI (Python) backend · React + Vite + Tailwind frontend · nginx · Docker Compose

![status](https://img.shields.io/badge/status-live-039855) ![tests](https://img.shields.io/badge/tests-passing-039855)

---

## Features

- **10 dashboards** — leaderboard, win-rate ranking, goals/game, G+A/game, recent form,
  season trend, match history, match MVP, attendance, and per-player profiles.
- **Auto-refresh** — the backend re-reads the workbook whenever its modification time
  changes. Replace the file, reload the page — no restart.
- **Bilingual** — Brazilian Portuguese by default with an English toggle.
- **Dark / light theme** — persisted, dark by default.
- **Mobile-first** — responsive sidebar on desktop, slide-over drawer on mobile.

---

## Quick start

```bash
# from the project root
docker compose up --build
```

Then open **http://localhost:8095**.

To change the host port, edit the `ports` mapping for the `frontend` service in
`docker-compose.yml` (`"8095:80"`).

---

## Updating the data after a game

The workbook lives in `./data/Football_Player_Match_and_Totals.xlsx` and is mounted
into the backend read-only. To refresh the site:

1. Replace `data/Football_Player_Match_and_Totals.xlsx` with the new file (same name).
2. Reload the page — stats are recomputed on the next request.

Keep the sheet/column layout intact (see **Data model** below).

---

## Architecture

```
Pelada_MCR_Stats_Website/
├── docker-compose.yml         # orchestrates both services + data volume
├── data/                      # the Excel workbook (mounted read-only)
├── backend/                   # FastAPI — parses Excel, exposes /api/*
│   ├── app/
│   │   ├── parser.py          # mtime-cached workbook loader
│   │   ├── stats.py           # all dashboard computations
│   │   └── main.py            # FastAPI endpoints
│   └── tests/                 # pytest (stats + endpoints)
└── frontend/                  # React + Vite + Tailwind
    ├── src/
    │   ├── pages/             # one component per dashboard
    │   ├── components/        # Layout, RankTable, UI primitives
    │   ├── context/           # theme + language
    │   └── lib/               # api client, i18n, formatters
    ├── nginx.conf             # serves the SPA, proxies /api to backend
    └── tests/e2e/             # Playwright (desktop + mobile UX)
```

The frontend talks to the backend only through same-origin `/api/*` calls; nginx
proxies those to the `backend` service, so there is no CORS or port juggling in
production.

---

## Data model

All figures are derived **only** from the raw `Player Match Stats` sheet (one row per
player per session) — the workbook's own pivot sheets are ignored to avoid stale data.

| Column      | Meaning                                            |
| ----------- | -------------------------------------------------- |
| Date        | Session date (one score per date)                  |
| Score       | Overall match score, e.g. `5 x 3` (or `3 times`)   |
| Player      | Lowercase player name                              |
| Goals       | Goals scored that session                          |
| Assists     | Assists that session                               |
| Vitoria     | 1 if the player's team won                          |
| Derrota     | 1 if lost                                          |
| Empate      | 1 if drew                                          |
| Time misto  | 1 if teams were reshuffled (mixed-team day)        |

The `Jogadores` sheet provides the registered-player list.

---

## API

Base path `/api`. All endpoints are `GET` and return JSON.

| Endpoint              | Description                                  |
| --------------------- | -------------------------------------------- |
| `/health`             | Service + workbook status                    |
| `/overview`           | Season headline numbers + highlights         |
| `/leaderboard`        | All players ranked by goals                  |
| `/winrate`            | Win % ranking (≥60% attendance eligibility)  |
| `/scoring-rate`       | Goals per game (min 5 games)                 |
| `/ga-rate`            | (Goals + assists) per game (min 5 games)     |
| `/form`               | Last-5 form + current streak                 |
| `/season-trend`       | Goals/assists per session                    |
| `/matches`            | Match history (newest first)                 |
| `/mvp`                | Per-session MVP + season MVP ranking         |
| `/attendance`         | Attendance grid + percentages                |
| `/players`            | Lightweight player index                     |
| `/players/{name}`     | Full player profile                          |

Interactive docs are available at `http://localhost:8095/api/docs` when running.

---

## Development (without Docker)

**Backend**

```bash
cd backend
pip install -r requirements.txt
WORKBOOK_PATH=../data/Football_Player_Match_and_Totals.xlsx \
  uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api to :8000
```

---

## Tests

**Backend (pytest):**

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

**Frontend UX (Playwright, desktop + mobile):**

```bash
# with the stack running (docker compose up)
cd frontend
npx playwright install chromium   # first time only
npm run test:e2e
```

The Playwright suite runs every test in both a desktop (1280×800) and a mobile
(Pixel 5) viewport, covering responsive navigation, theme/language toggles, and the
core dashboard flows.

---

## Configuration

| Variable        | Where            | Default                                          |
| --------------- | ---------------- | ------------------------------------------------ |
| `WORKBOOK_PATH` | backend env      | `/data/Football_Player_Match_and_Totals.xlsx`    |
| host port       | docker-compose   | `8095`                                           |
| `BASE_URL`      | Playwright env   | `http://localhost:8095`                          |

---

⚽ Pelada MCR · 2026
