import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar } from "../components/ui";
import RankTable from "../components/RankTable";

function Podium({ top }) {
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
          <p className="text-xs text-slate-400">{p.win_pct}%</p>
          <div
            className={`mt-2 flex w-full ${heights[p.rank]} items-start justify-center rounded-t-xl bg-gradient-to-b from-pitch-400 to-pitch-600 pt-2 text-2xl`}
          >
            {medals[p.rank]}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WinRate() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.winrate);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const columns = {
    playerLabel: t("common.player"),
    cols: [
      { key: "games", label: t("common.games"), align: "right", hideOnMobile: true },
      { key: "wins", label: t("common.wins"), align: "right" },
      { key: "losses", label: t("common.losses"), align: "right", hideOnMobile: true },
      { key: "draws", label: t("common.draws"), align: "right", hideOnMobile: true },
      {
        key: "win_pct",
        label: t("common.winPct"),
        align: "right",
        highlight: true,
        render: (r) => `${r.win_pct}%`,
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title={t("winrate.title")}
        subtitle={t("winrate.subtitle", {
          pct: data.eligibility_pct,
          min: data.min_games,
          total: data.total_sessions,
        })}
      />
      {data.ranking.length >= 3 && <Podium top={data.ranking.slice(0, 3)} />}
      <RankTable rows={data.ranking} columns={columns} />
    </div>
  );
}
