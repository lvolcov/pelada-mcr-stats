// Thin API client. All requests are same-origin /api/* (nginx proxies to backend
// in production; Vite proxies in dev).

const BASE = "/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
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
