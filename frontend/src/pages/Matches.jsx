import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort, formatDate } from "../lib/format";
import { Loading, ErrorState, PageHeader, PlayerCell, FormPills } from "../components/ui";

function MatchCard({ match }) {
  const { t, lang } = useApp();
  return (
    <Link
      to={`/match/${match.date}`}
      className="card group block overflow-hidden transition hover:border-pitch-400 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {formatDate(match.date, lang)}
          </p>
          <p className="font-display text-2xl font-extrabold group-hover:text-pitch-600">
            {match.score}
          </p>
        </div>
        <div className="text-right">
          {match.mixed && (
            <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {t("matches.mixedDay")}
            </span>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {match.player_count} {t("matches.present")}
          </p>
        </div>
      </div>
      {match.top_scorers.length > 0 && (
        <div className="px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("matches.topScorers")}
          </p>
          <div className="space-y-2">
            {match.top_scorers.map((p) => (
              <div key={p.player} className="flex items-center justify-between gap-2">
                <PlayerCell name={p.name} player={p.player} />
                <div className="flex items-center gap-3 text-sm">
                  {p.goals > 0 && <span className="tabular-nums">⚽ {p.goals}</span>}
                  {p.assists > 0 && (
                    <span className="tabular-nums text-slate-400">🅰️ {p.assists}</span>
                  )}
                  <FormPills form={[p.result]} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

function MatchTable({ matches }) {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const { sorted, sortKey, sortDir, toggle } = useSort(matches, "date", "desc");

  const cols = [
    { key: "date", label: t("common.date"), align: "left", render: (m) => formatDate(m.date, lang) },
    { key: "score", label: t("common.score"), align: "left" },
    { key: "player_count", label: t("common.players"), align: "right" },
    { key: "total_player_goals", label: t("common.goals"), align: "right" },
    { key: "total_player_assists", label: t("common.assists"), align: "right" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={`select-none px-4 py-3 ${c.align === "left" ? "text-left" : "text-right"}`}
                >
                  <button
                    onClick={() => toggle(c.key)}
                    className={`inline-flex items-center gap-1 transition hover:text-pitch-600 ${
                      sortKey === c.key ? "text-pitch-600 dark:text-pitch-400" : ""
                    }`}
                  >
                    {c.label}
                    <span className="text-[10px] opacity-70">
                      {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr
                key={m.date}
                onClick={() => navigate(`/match/${m.date}`)}
                className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 ${c.align === "left" ? "text-left" : "text-right tabular-nums"} ${
                      c.key === "score" ? "font-bold" : ""
                    }`}
                  >
                    {c.render ? c.render(m) : m[c.key]}
                    {c.key === "score" && m.mixed && (
                      <span className="ml-2 pill bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {t("matches.mixedDay")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Matches() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.matches);
  const [view, setView] = useState("cards");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={t("matches.title")} subtitle={t("matches.subtitle")}>
        <div className="inline-flex rounded-xl border border-slate-200 p-1 text-sm dark:border-slate-700">
          {["cards", "table"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                view === v
                  ? "bg-pitch-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t(`common.${v}`)}
            </button>
          ))}
        </div>
      </PageHeader>

      {view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <MatchCard key={m.date} match={m} />
          ))}
        </div>
      ) : (
        <MatchTable matches={data} />
      )}
    </div>
  );
}
