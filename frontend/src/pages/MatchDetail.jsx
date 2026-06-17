import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDate } from "../lib/format";
import {
  Loading,
  ErrorState,
  Section,
  PlayerCell,
  Avatar,
} from "../components/ui";

// End-of-match photo: tries <base>/photos/<date>.jpg, falls back gracefully.
function MatchPhoto({ date }) {
  const { t } = useApp();
  const [status, setStatus] = useState("loading");
  const src = `${import.meta.env.BASE_URL}photos/${date}.jpg`;

  if (status === "error") {
    return (
      <div className="card flex h-40 items-center justify-center border-dashed text-sm text-slate-400">
        📷 {t("match.noPhoto")}
      </div>
    );
  }
  return (
    <figure className="card overflow-hidden">
      <img
        src={src}
        alt={t("match.photo")}
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("error")}
        className={`w-full object-cover ${status === "ok" ? "" : "hidden"}`}
      />
      {status === "loading" && <div className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />}
    </figure>
  );
}

function PlayerRow({ p }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <PlayerCell name={p.name} player={p.player} />
      <div className="flex items-center gap-3 text-sm tabular-nums text-slate-500">
        {p.goals > 0 && <span>⚽ {p.goals}</span>}
        {p.assists > 0 && <span>🅰️ {p.assists}</span>}
      </div>
    </li>
  );
}

function TeamColumn({ title, accent, players }) {
  return (
    <div>
      <h3 className={`mb-2 font-display text-sm font-bold uppercase tracking-wide ${accent}`}>
        {title} · {players.length}
      </h3>
      <ul className="space-y-1">
        {players.map((p) => (
          <PlayerRow key={p.player} p={p} />
        ))}
      </ul>
    </div>
  );
}

// Bottom nav between matches. List is ordered most-recent-first, so the
// "next" (newer) match sits at the lower index and "previous" (older) at the
// higher one. Ends are disabled: newest has no next, oldest no previous.
function MatchNav({ list, date }) {
  const { t, lang } = useApp();
  const i = list.findIndex((m) => m.date === date);
  if (i === -1) return null;
  const newer = i > 0 ? list[i - 1] : null;
  const older = i < list.length - 1 ? list[i + 1] : null;

  const linkClass =
    "flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-pitch-400 hover:text-pitch-600 dark:border-slate-800";
  const disabledClass =
    "flex flex-1 items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-300 dark:border-slate-800 dark:text-slate-700";

  return (
    <nav className="flex gap-3">
      {newer ? (
        <Link to={`/match/${newer.date}`} className={linkClass} rel="next">
          <span aria-hidden>←</span>
          <span className="truncate">
            <span className="block text-xs uppercase tracking-wide text-slate-400">
              {t("match.next")}
            </span>
            {formatDate(newer.date, lang)}
          </span>
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <span aria-hidden>←</span>
          <span className="text-xs uppercase tracking-wide">{t("match.next")}</span>
        </span>
      )}
      {older ? (
        <Link
          to={`/match/${older.date}`}
          className={`${linkClass} justify-end text-right`}
          rel="prev"
        >
          <span className="truncate">
            <span className="block text-xs uppercase tracking-wide text-slate-400">
              {t("match.prev")}
            </span>
            {formatDate(older.date, lang)}
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className={`${disabledClass} justify-end text-right`} aria-disabled="true">
          <span className="text-xs uppercase tracking-wide">{t("match.prev")}</span>
          <span aria-hidden>→</span>
        </span>
      )}
    </nav>
  );
}

export default function MatchDetail() {
  const { date } = useParams();
  const { t, lang } = useApp();
  const { data, error, loading, reload } = useApi(() => api.match(date), [date]);
  const { data: matchList } = useApi(() => api.matches(), []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const star = data.mixed ? data.highlight : data.mvp;

  return (
    <div className="space-y-6">
      <Link
        to="/matches"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-pitch-600"
      >
        ← {t("match.back")}
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-700 via-pitch-600 to-emerald-500 p-8 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 text-[120px] opacity-10">⚽</div>
        <p className="text-sm font-semibold uppercase tracking-widest text-pitch-100">
          {formatDate(data.date, lang)}
        </p>
        <p className="mt-1 font-display text-5xl font-extrabold">{data.score}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.mixed && (
            <span className="pill bg-amber-400 text-amber-950">{t("match.mixedTeams")}</span>
          )}
          <span className="pill bg-white/20">
            {data.player_count} {t("matches.present")}
          </span>
          <span className="pill bg-white/20">
            ⚽ {data.total_player_goals} · 🅰️ {data.total_player_assists}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teams */}
        <Section
          title={data.mixed ? t("match.mixedTeams") : t("match.goalsAssists")}
          className="lg:col-span-2"
        >
          {data.teams_known ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <TeamColumn
                title={t("match.winners")}
                accent="text-pitch-600 dark:text-pitch-400"
                players={data.winners}
              />
              <TeamColumn
                title={t("match.losers")}
                accent="text-rose-500"
                players={data.losers}
              />
            </div>
          ) : (
            <div>
              {!data.mixed && (
                <p className="mb-3 text-xs text-slate-400">
                  {data.is_draw ? t("match.draw") : t("match.teamsUnknown")}
                </p>
              )}
              <ul className="grid gap-1 sm:grid-cols-2">
                {data.players.map((p) => (
                  <PlayerRow key={p.player} p={p} />
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Sidebar: MVP + photo */}
        <div className="space-y-6">
          {star && (
            <Section title={data.mixed ? t("match.highlight") : t("match.mvp")}>
              <Link
                to={`/player/${star.player}`}
                className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Avatar name={star.name} size="lg" />
                <div>
                  <p className="font-display text-lg font-bold">{star.name}</p>
                  <p className="text-sm text-slate-500">
                    ⚽ {star.goals} · 🅰️ {star.assists}
                  </p>
                </div>
              </Link>
            </Section>
          )}
          <MatchPhoto date={data.date} />
        </div>
      </div>

      {matchList && <MatchNav list={matchList} date={data.date} />}
    </div>
  );
}
