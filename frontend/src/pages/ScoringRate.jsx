import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
import { Loading, ErrorState, PageHeader, Section } from "../components/ui";
import RankTable from "../components/RankTable";

export default function ScoringRate() {
  const { t, theme } = useApp();
  const { data, error, loading, reload } = useApi(api.scoringRate);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";
  const chartData = data.ranking.slice(0, 10).map((p) => ({
    name: p.name.split(" ")[0],
    rate: p.goals_per_game,
  }));

  const columns = {
    playerLabel: t("common.player"),
    cols: [
      { key: "games", label: t("common.games"), align: "right", hideOnMobile: true },
      { key: "goals", label: t("common.goals"), align: "right", hideOnMobile: true },
      {
        key: "goals_per_game",
        label: `${t("common.goals")}/${t("common.games").toLowerCase()}`,
        align: "right",
        highlight: true,
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title={t("scoring.title")}
        subtitle={t("scoring.subtitle", { min: data.min_games })}
      />
      <p className="-mt-3 mb-5 text-xs text-slate-400">ℹ️ {t("common.mixedExcluded")}</p>
      <Section className="mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.1)" }}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                background: theme === "dark" ? "#0f172a" : "#fff",
              }}
            />
            <Bar dataKey="rate" fill="#039855" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <RankTable rows={data.ranking} columns={columns} />
    </div>
  );
}
