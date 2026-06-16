// API client. Works in two modes, chosen at build time:
//   - API mode (default, Docker): fetches the live FastAPI backend at /api/*.
//   - Static mode (GitHub Pages): fetches pre-generated JSON under <base>/data/*.json.
// Set VITE_STATIC=true at build time to use static mode.

const STATIC = import.meta.env.VITE_STATIC === "true";
const BASE = import.meta.env.BASE_URL; // "/" in dev/Docker, "/<repo>/" on Pages

function url(path) {
  if (STATIC) return `${BASE}data${path}.json`;
  return `/api${path}`;
}

async function get(path) {
  const res = await fetch(url(path));
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  overview: () => get("/overview"),
  leaderboard: () => get("/leaderboard"),
  winrate: () => get("/winrate"),
  scoringRate: () => get("/scoring-rate"),
  gaRate: () => get("/ga-rate"),
  form: () => get("/form"),
  seasonTrend: () => get("/season-trend"),
  matches: () => get("/matches"),
  mvp: () => get("/mvp"),
  attendance: () => get("/attendance"),
  players: () => get("/players"),
  player: (name) => get(`/players/${encodeURIComponent(name)}`),
};
