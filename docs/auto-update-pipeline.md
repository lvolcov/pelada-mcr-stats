# Auto-update pipeline — design

**Status:** proposal (no code yet) · **Date:** 2026-06-17

How to add a new match (results + photo) with the least effort possible: send a
Telegram message, confirm a preview, and the site updates itself.

---

## 1. Goal & user experience

After a game, from your phone:

1. Send a **photo** to the Telegram bot with the **date** as the caption
   (`2026-06-22`), or just the photo right after the results message.
2. Send the **results as free text**, e.g.

   > 22/06 5x3
   > venceu: Lucas 2g 1a, Joao 1g, Marcus 1g 1a, Carto, Gesiel
   > perdeu: Diego 1g, Filemon 1g, Andrew, Danilo, Everton

3. Bot replies with a **parsed preview** (a clean table) and asks to confirm.
4. You reply **OK** → it commits & pushes → GitHub Actions rebuilds → live in
   under a minute. Reply **no** (or correct the text) → nothing is published.

No spreadsheets, no laptop.

---

## 2. Why this is simple now

The data lives in **plain CSV** (`data/matches.csv`) — one row per player per
session, columns `date,score,player,goals,assists,win,loss,draw,mixed`. The
roster is `data/players.csv`; fixed spots are `data/mensalistas.json`.
Everything on the site is recomputed from these by `backend/app/stats.py`.

> **History:** this used to be an Excel workbook. We migrated to CSV on
> 2026-06-17 precisely to make this pipeline trivial — appending a CSV row is a
> one-liner, whereas editing an `.xlsx` (with its tables/formulas/pivots) is
> fiddly and merge-unfriendly. The migration is done; this doc assumes CSV.

➡️ **"Adding a game" = appending one row per player to `data/matches.csv`**
(+ optionally a photo named `<date>.jpg`). That's the entire data write — a
plain text append that diffs cleanly in git.

---

## 3. Architecture

```
 Telegram  ──(text + photo)──►  Bot (home server, Docker)
                                    │  saves photo → photos_inbox/<date>.jpg
                                    ▼
                          Claude (headless, in repo clone)
                          parses free text → structured match JSON
                                    │   uses players.csv as the roster context
                                    ▼
                          add_match.py  (deterministic engine)
                          • map names → roster   • append rows
                          • run import_photos.py • validate
                                    │
                                    ▼
                          Bot → Telegram:  "Parsed ✅ <table>. OK to publish?"
                                    │ (on OK)
                                    ▼
                          git commit + push  ─►  GitHub Actions  ─►  site live
```

Built in **layers**, each usable on its own:

| Layer | What it is | Depends on |
|------|------------|-----------|
| A. `add_match.py` | Deterministic engine: structured JSON → CSV rows + photo + commit | repo only |
| B. Free-text → JSON | Claude interprets the message into the schema A expects | A + Claude |
| C. Telegram bot | Receives messages/photos, runs B, handles the confirm loop, pushes | A + B + server |

You can stop after A (run it locally), or A+B (paste text, Claude fills the
CSV), or go all the way to C.

---

## 4. Layer A — `add_match.py` (deterministic core)

The reliable foundation. No AI, fully testable.

**Input** (structured JSON — the contract Claude must produce):

```json
{
  "date": "2026-06-22",
  "score": "5 x 3",
  "mixed": false,
  "players": [
    {"name": "lucas volcov", "goals": 2, "assists": 1, "result": "W"},
    {"name": "diego",        "goals": 1, "assists": 0, "result": "L"}
  ]
}
```

**Behaviour:**
- Validate every `name` against `data/players.csv` (case-insensitive). Unknown
  names → **reject** with the list of unmatched names (don't silently invent
  players). Optionally support `--add-players` to append them to `players.csv`.
- Map `result` (`W`/`L`/`D`) → the `win/loss/draw` columns; `mixed` → the
  `mixed` column (on mixed days, result handling follows how the site already
  treats 3-team days).
- Refuse if `date` already has rows in `matches.csv` (avoid duplicates) unless
  `--replace`.
- Append one row per player to `data/matches.csv`, then run `import_photos.py`
  so a photo already dropped in `photos_inbox/` is processed.
- Optional `--commit` / `--push` flags; otherwise just write and print a diff.

**Validation/warnings (non-fatal, surfaced in the preview):**
- Sum of player goals vs the score (e.g. score `5 x 3` ⇒ 8 goals; flag if the
  player goals don't add up — own goals/keeper goals are normal exceptions).
- Player count looks off (e.g. < 8 or odd split when teams are known).
- Duplicate player in the same match.

**Why deterministic first:** it's the part that must never corrupt data, so it
gets unit tests (extending `backend/tests/`) and is independent of any LLM.

---

## 5. Layer B — free-text → structured JSON (Claude)

Claude turns your natural message into the JSON Layer A expects. Two ways to run
it on the server:

- **Claude Code headless:** `claude -p "<prompt>" --output-format json` run in
  the repo clone, with tools limited to reading the roster and calling
  `add_match.py`. Simplest to wire to a shell.
- **Claude Agent SDK (Python):** more control/streaming inside the bot process.

**Prompt design (sketch):** system instructions + the current roster (from
`data/players.csv`) + the rules:
- Map first names / nicknames to the exact roster slug; if ambiguous or unknown,
  **ask** rather than guess.
- Infer `result` from which side ("venceu/perdeu/empate") each player is on and
  the score; a draw ⇒ all `D`.
- Detect mixed/3-team days ("time misto").
- Output **only** the JSON schema above.

Because the next step is a **human confirmation**, occasional misreads are caught
before publishing.

---

## 6. Layer C — Telegram bot

- **Library:** `python-telegram-bot` (async), Dockerised.
- **Access control:** allowlist of chat IDs (only you / trusted admins).
- **Message handling:**
  - Photo (with date caption, or paired with the last results msg) → save to
    `photos_inbox/<date>.jpg`.
  - Text → run Layer B → Layer A in *preview mode* (no commit) → reply with the
    parsed table + any warnings.
- **Confirmation state:** keep the pending parsed match per chat; `OK` publishes
  (commit + push), `cancel` discards, a new text re-parses.
- **Commands:** `/status` (matches/photos missing), `/undo` (revert last commit),
  `/help`.

**Example dialogue:**

```
You:  [photo]  caption: 2026-06-22
Bot:  📸 Photo saved for 2026-06-22.
You:  5x3 venceu Lucas 2g1a Joao 1g Marcus 1g1a Carto Gesiel;
      perdeu Diego 1g Filemon 1g Andrew Danilo Everton
Bot:  Parsed 2026-06-22 — 5 x 3
      ✅ Winners: Lucas (2G 1A), Joao (1G), Marcus (1G 1A), Carto, Gesiel
      ❌ Losers:  Diego (1G), Filemon (1G), Andrew, Danilo, Everton
      ⚠️ Player goals = 5+2 = 7, score says 8. Publish anyway?
You:  OK
Bot:  Pushed ✅  Deploy running — live in ~1 min.
```

---

## 7. Infrastructure (home server)

`docker-compose.yml` service (separate from the public web stack, or a new
file):

- **Container:** Python + `python-telegram-bot` + the repo's tooling (`Pillow`
  for photo import; CSV append needs only the stdlib) + Claude (CLI or SDK) +
  `git`.
- **Volume:** a clone of the repo with push access.
- **Secrets (env / Docker secrets, never committed):**
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_IDS`
  - Git push credential — a **GitHub deploy key** (SSH, write-scoped to this repo)
    or a fine-grained PAT.
  - Claude credentials/API key for headless runs.
- **Flow:** bot writes files → commits on a branch or `main` → pushes →
  existing **Deploy to GitHub Pages** Action rebuilds. No new hosting needed.

Security notes: restrict the bot to your chat IDs; the push credential should be
scoped to **only this repo**; consider requiring the confirm step before any
push (default on).

---

## 8. Edge cases to handle

- **New players** not in the roster → bot asks "add Fulano as a new player?"
  before writing.
- **Draws** → all players `D`, `is_draw` handled as today.
- **Mixed / 3-team days** → `mixed = 1`; the site already treats these
  specially (highlight instead of MVP, excluded from win/loss).
- **Teams unknown** → allow a results list without explicit W/L (site supports
  `teams_known = false`).
- **Corrections** → re-send text before confirming; `/undo` reverts the last
  commit if something slipped through.
- **Photo before data** (or vice-versa) → bot pairs by date; photo works even if
  the match data lands later (the page just shows the photo once both exist).

---

## 9. Suggested build order

1. **Layer A** `add_match.py` + unit tests (append rows, name-matching,
   validation, photo import, optional commit). *Highest value, lowest risk.*
2. **Layer B** Claude free-text → JSON, callable from the CLI; dry-run preview.
3. **Layer C** Telegram bot + confirm loop, Dockerised, on the home server.
4. Polish: `/status`, `/undo`, new-player flow, mismatch warnings.

Each step is independently useful — you could stop at 1 or 2 and still have a
much faster workflow than editing Excel.

---

## 10. Open decisions

- ~~Keep `.xlsx` or migrate to CSV?~~ **Done** — migrated to `data/matches.csv`
  on 2026-06-17.
- Push straight to `main`, or open a PR the Action previews first?
  (Recommendation: commit to `main` after the Telegram confirm — the confirm is
  the review.)
- Run Claude via the CLI (headless `claude -p`) or the Agent SDK? (Either; CLI is
  faster to wire, SDK gives finer control inside the bot.)
