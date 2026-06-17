# ⚽ Pelada MCR · Stats

A dockerised web app that turns the Monday football group's match log into a set
of friendly, interactive dashboards. Add a row per player to a CSV after each game
and the site refreshes automatically.

**Stack:** FastAPI (Python) backend · React + Vite + Tailwind frontend · nginx · Docker Compose

**🌐 Live:** https://lvolcov.github.io/pelada-mcr-stats/

![status](https://img.shields.io/badge/status-live-039855) ![tests](https://img.shields.io/badge/tests-passing-039855)

## Hosting

The site runs in two ways from the same codebase:

- **GitHub Pages (no server)** — a GitHub Actions workflow pre-renders the stats to
  static JSON and deploys the built site on every push to `main`. This is the public
  link above. No hosting cost, no backend to run.
- **Docker (local / self-hosted)** — the live FastAPI backend parses the CSV on
  each request. Useful for local development or a private LAN deploy.

### Updating the data after a game (Pages)

The source of truth is **`data/matches.csv`** — one row per player per game with
columns `date,score,player,goals,assists,win,loss,draw,mixed`
(`date` as `YYYY-MM-DD`; `win/loss/draw/mixed` are `0`/`1`).

1. Append the new game's rows to `data/matches.csv` — commit & push, **or** edit it
   in the GitHub web UI (repo → `data/matches.csv` → *Edit* → *Commit*).
2. (Optional) add the match photo to `frontend/public/photos/<date>.jpg`.
3. (Optional) register any new player in `data/players.csv`, or edit
   `data/mensalistas.json` if the fixed-spot list changed.
4. The deploy workflow runs automatically and the site updates in ~1–2 minutes.

> A Telegram bot to do this from your phone (send results + photo → auto-commit) is
> designed in [`docs/auto-update-pipeline.md`](docs/auto-update-pipeline.md).

---

## Features

- **10 dashboards** — leaderboard, win-rate ranking, goals/game, G+A/game, recent form,
  season trend, match history, match MVP, attendance, and per-player profiles.
- **Per-match pages** (`/match/<date>`) — winners vs losers line-up, goals/assists,
  the match MVP, the end-of-match photo when one is available, and next/previous
  arrows to step between match days.
- **Shareable cards ("Modo foto")** — match and player pages have a one-tap photo
  mode that renders a screenshot-ready card (score/stats + photo, or a player's
  season summary) and exports it as an image via the native share sheet (WhatsApp,
  etc.) with a deep link back to the page, or a download on desktop.
- **Mixed-team days** ("time misto", e.g. the 3-team session on 2026-02-23) count
  **only** towards goals and assists; they're excluded from games played, win/loss
  records, win-rate, rates, form, MVP and attendance. The match still shows in the
  history, flagged.
- **Mensalistas** — players with a fixed weekly spot are marked with a 📅 icon
  everywhere, making it easy to spot a season member who has stopped showing up.
  Driven by an editable `data/mensalistas.json`.
- **Sortable everywhere** — every table sorts on any column (the active column is
  highlighted and ranks renumber); card/list pages (players, form, MVP) have sort
  controls plus a **"Padrão" reset** chip to restore the original order; match
  history has a cards/table toggle.
- **Clickable match references** — anywhere a match is referenced (attendance
  squares, form pills, MVP-per-round, player game logs, homepage highlights) it's a
  tooltipped link straight to that match's page.
- **Recent form** is computed over the last 5 *actual* sessions, with one pill per
  session: V/E/D for the result and a dashed ✕ for sessions the player missed (so
  absences are visible, not hidden). Players inactive in the window sort to the bottom.
- **Player profiles** show goals, assists, win %, goals/game and **attendance (x/y +
  %)**, plus goal/assist progression and a W/L/D breakdown.
- **Homepage charts** — top scorers (goals + assists) and a goals-per-session trend.
- **Installable (PWA)** — a web manifest and a bee-with-football app icon, so the site
  can be added to a phone's home screen with a proper logo.
- **Auto-refresh** — the backend re-reads the CSV data (and `mensalistas.json`)
  whenever any of them changes. Edit a file, reload the page — no restart.
- **Brazilian-Manchester branding** — Manchester worker-bee logo, locked to
  Brazilian Portuguese (English strings retained internally).
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

This section applies to the **Docker** deployment. The data lives in
`./data/matches.csv` (mounted into the backend read-only). To refresh the site:

1. Append the new game's rows to `data/matches.csv` (one per player).
2. Reload the page — stats are recomputed on the next request.

Keep the column layout intact (see **Data model** below).
(For the GitHub Pages flow, see **Hosting** near the top.)

---

## Architecture

```
Pelada_MCR_Stats_Website/
├── docker-compose.yml         # orchestrates both services + data volume
├── data/
│   ├── matches.csv            # source of truth: one row per player per game
│   ├── players.csv            # roster of valid player names
│   └── mensalistas.json       # editable fixed-spot registry
├── backend/                   # FastAPI — parses the CSV, exposes /api/*
│   ├── app/
│   │   ├── parser.py          # mtime-cached CSV + mensalistas loader
│   │   ├── stats.py           # all dashboard computations + match detail
│   │   └── main.py            # FastAPI endpoints
│   ├── generate_static.py     # pre-renders every endpoint to JSON for Pages
│   └── tests/                 # pytest (stats + endpoints)
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/             # dashboards + MatchDetail + PlayerProfile
│   │   ├── components/        # Layout, RankTable (sortable), UI primitives
│   │   ├── context/           # theme + language + mensalistas
│   │   └── lib/               # api client, i18n, formatters, useSort
│   ├── public/
│   │   ├── photos/            # end-of-match photos (<date>.jpg)
│   │   ├── manifest.webmanifest  # PWA manifest
│   │   ├── icon-192.png / icon-512.png / apple-touch-icon.png
│   │   └── 404.html           # SPA deep-link fallback for GitHub Pages
│   ├── scripts/make_icons.py  # regenerates the app icons (Pillow)
│   ├── nginx.conf             # serves the SPA, proxies /api to backend
│   └── tests/e2e/             # Playwright (desktop + mobile UX)
└── .github/workflows/deploy.yml  # build + deploy to GitHub Pages
```

The frontend talks to the backend only through same-origin `/api/*` calls; nginx
proxies those to the `backend` service, so there is no CORS or port juggling in
production.

---

## Data model

All figures are derived from **`data/matches.csv`** — one row per player per
session.

| Column    | Meaning                                            |
| --------- | -------------------------------------------------- |
| `date`    | Session date `YYYY-MM-DD` (one score per date)     |
| `score`   | Overall match score, e.g. `5 x 3` (or `3 times`)   |
| `player`  | Lowercase player name (must exist in `players.csv`)|
| `goals`   | Goals scored that session                          |
| `assists` | Assists that session                               |
| `win`     | 1 if the player's team won                         |
| `loss`    | 1 if lost                                          |
| `draw`    | 1 if drew                                          |
| `mixed`   | 1 if teams were reshuffled (mixed-team day)        |

`data/players.csv` provides the registered-player list (column `player`).

### Mixed-team rule

Rows with `Time misto = 1` (currently only 2026-02-23, a 3-team day) are treated
specially: their **goals and assists count** towards season totals, but the day is
**not** counted as a game and is excluded from win/loss/draw, win-rate eligibility,
per-game rates, recent form, MVP, attendance and the season trend. Because mixed-day
goals are in the totals but the day isn't in `games`, per-game rate dashboards use
regular-only goals (a note on those pages explains this).

### Mensalistas (`data/mensalistas.json`)

A **mensalista** has a fixed weekly spot; a **diarista** only plays when a spot opens.
This file is the editable source of truth:

```json
{
  "mensalistas": { "douglas b": "2026-01-19", "bruno": "2026-02-23" }
}
```

- Keys are the exact lowercase player name as in the sheet; the value is the ISO date
  the player became a mensalista.
- Mensalistas show a 📅 icon next to their name across the site, and can be filtered
  on the Players and Attendance pages — handy for spotting a member who has gone quiet.
- Edit and commit/push (or upload via the GitHub web UI); the site updates on deploy.
- ⚠️ `bruno`'s `since` is a placeholder (`2026-02-23`, his first appearance) — update
  it once the real date is known.

---

## API

Base path `/api`. All endpoints are `GET` and return JSON.

| Endpoint              | Description                                  |
| --------------------- | -------------------------------------------- |
| `/health`             | Service + data status                        |
| `/overview`           | Season headline numbers + highlights         |
| `/leaderboard`        | All players ranked by goals                  |
| `/winrate`            | Win % ranking (≥60% attendance eligibility)  |
| `/scoring-rate`       | Goals per game (min 5 games)                 |
| `/ga-rate`            | (Goals + assists) per game (min 5 games)     |
| `/form`               | Last-5 form + current streak                 |
| `/season-trend`       | Goals/assists per session                    |
| `/matches`            | Match history (newest first)                 |
| `/matches/{date}`     | One match: teams, stats, MVP (date `YYYY-MM-DD`) |
| `/mvp`                | Per-session MVP + season MVP ranking         |
| `/attendance`         | Attendance grid + percentages                |
| `/mensalistas`        | Mensalistas + attendance context             |
| `/players`            | Lightweight player index                     |
| `/players/{name}`     | Full player profile                          |

Interactive docs are available at `http://localhost:8095/api/docs` when running.

In static (GitHub Pages) mode the same data is served as JSON files under
`<base>/data/` (e.g. `data/overview.json`, `data/matches/2026-06-08.json`,
`data/mensalistas.json`), generated by `backend/generate_static.py`.

### Match photos

End-of-match photos live in `frontend/public/photos/<date>.jpg` (date = match date,
e.g. `2026-06-08.jpg`). They appear automatically on the match page; if a date has no
file, the page shows a "no photo" placeholder. See `frontend/public/photos/README.md`.

---

## Development (without Docker)

**Backend**

```bash
cd backend
pip install -r requirements.txt
MATCHES_PATH=../data/matches.csv \
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
(Pixel 5) viewport, covering responsive navigation, the theme toggle, sorting and
sort-reset, clickable match references, the installable manifest, and the core
dashboard flows.

---

## Configuration

| Variable        | Where            | Default                                          |
| --------------- | ---------------- | ------------------------------------------------ |
| `MATCHES_PATH`  | backend env      | `/data/matches.csv`                              |
| host port       | docker-compose   | `8095`                                           |
| `BASE_URL`      | Playwright env   | `http://localhost:8095`                          |

---

⚽ Pelada MCR · 2026
