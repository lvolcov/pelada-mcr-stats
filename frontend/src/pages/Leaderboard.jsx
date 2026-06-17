import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
import { Loading, ErrorState, PageHeader } from "../components/ui";
import RankTable from "../components/RankTable";

export default function Leaderboard() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.leaderboard);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const columns = {
    playerLabel: t("common.player"),
    cols: [
      { key: "games", label: t("common.games"), align: "right", hideOnMobile: true },
      { key: "goals", label: t("common.goals"), align: "right", highlight: true },
      { key: "assists", label: t("common.assists"), align: "right" },
      { key: "ga", label: t("common.ga"), align: "right", hideOnMobile: true },
      { key: "wins", label: t("common.wins"), align: "right", hideOnMobile: true },
      {
        key: "win_pct",
        label: t("common.winPct"),
        align: "right",
        render: (r) => `${r.win_pct}%`,
      },
    ],
  };

  return (
    <div>
      <PageHeader title={t("leaderboard.title")} subtitle={t("leaderboard.subtitle")} />
      <RankTable rows={data} columns={columns} defaultSort="goals" />
    </div>
  );
}
