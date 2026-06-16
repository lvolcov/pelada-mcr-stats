import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDateShort } from "../lib/format";
import { Loading, ErrorState, PageHeader, Section } from "../components/ui";

export default function SeasonTrend() {
  const { t, lang, theme } = useApp();
  const { data, error, loading, reload } = useApi(api.seasonTrend);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";
  const chartData = data.map((s) => ({
    date: formatDateShort(s.date, lang),
    goals: s.player_goals,
    assists: s.assists,
  }));

  return (
    <div>
      <PageHeader title={t("trend.title")} subtitle={t("trend.subtitle")} />
      <Section>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                background: theme === "dark" ? "#0f172a" : "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="goals"
              name={t("common.goals")}
              stroke="#039855"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="assists"
              name={t("common.assists")}
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}
