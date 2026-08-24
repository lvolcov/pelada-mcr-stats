import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar } from "../components/ui";
import RankTable from "../components/RankTable";

function Podium({ top, statKey, accent }) {
  // Order for visual podium: 2nd, 1st, 3rd
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div className="card mb-6 flex items-end justify-center gap-3 p-6 sm:gap-6">
      {order.map((p) => (
        <div key={p.player} className="flex w-24 flex-col items-center sm:w-32">
          <Avatar name={p.name} size="lg" to={`/player/${p.player}`} />
          <p className="mt-2 truncate text-center text-sm font-semibold">{p.name}</p>
          <p className="text-xs text-slate-400">{p[statKey]}%</p>
          <div
            className={`mt-2 flex w-full ${heights[p.rank]} items-start justify-center rounded-t-xl bg-gradient-to-b ${accent} pt-2 text-2xl`}
          >
            {medals[p.rank]}
          </div>
        </div>
      ))}
    </div>
  );
}

function Toggle({ mode, setMode, t }) {
  const opts = [
    { key: "wins", label: t("winrate.toggleWins") },
    { key: "losses", label: t("winrate.toggleLosses") },
  ];
  return (
    <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => setMode(o.key)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            mode === o.key
              ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function WinRate() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.winrate);
  const [mode, setMode] = useState("wins");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isLosses = mode === "losses";

  // The API ranks by win_pct; for the losses view we re-sort the same eligible
  // players by loss_pct (most defeats first) and re-number for the podium.
  const ranking = isLosses
    ? [...data.ranking]
        .sort(
          (a, b) => b.loss_pct - a.loss_pct || b.losses - a.losses || a.wins - b.wins
        )
        .map((p, i) => ({ ...p, rank: i + 1 }))
    : data.ranking;

  const pctCol = isLosses
    ? { key: "loss_pct", label: t("common.lossPct"), render: (r) => `${r.loss_pct}%` }
    : { key: "win_pct", label: t("common.winPct"), render: (r) => `${r.win_pct}%` };

  const columns = {
    playerLabel: t("common.player"),
    cols: [
      { key: "games", label: t("common.games"), align: "right", hideOnMobile: true },
      { key: "wins", label: t("common.wins"), align: "right", hideOnMobile: isLosses },
      { key: "losses", label: t("common.losses"), align: "right", hideOnMobile: !isLosses },
      { key: "draws", label: t("common.draws"), align: "right", hideOnMobile: true },
      { ...pctCol, align: "right", highlight: true },
    ],
  };

  return (
    <div>
      <PageHeader
        title={isLosses ? t("winrate.titleLosses") : t("winrate.title")}
        subtitle={t("winrate.subtitle", {
          pct: data.eligibility_pct,
          min: data.min_games,
          total: data.total_sessions,
        })}
      />
      <Toggle mode={mode} setMode={setMode} t={t} />
      {ranking.length >= 3 && (
        <Podium
          top={ranking.slice(0, 3)}
          statKey={isLosses ? "loss_pct" : "win_pct"}
          accent={isLosses ? "from-rose-400 to-rose-600" : "from-pitch-400 to-pitch-600"}
        />
      )}
      <RankTable
        key={mode}
        rows={ranking}
        columns={columns}
        defaultSort={isLosses ? "loss_pct" : "win_pct"}
      />
    </div>
  );
}
