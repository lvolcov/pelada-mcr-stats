import { useParams, Link, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDate, formatDateShort } from "../lib/format";
import {
  Loading,
  ErrorState,
  Avatar,
  StatCard,
  Section,
  FormPills,
} from "../components/ui";

export default function PlayerProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { t, lang, theme } = useApp();
  const { data, error, loading, reload } = useApi(() => api.player(name), [name]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";
  const timeline = data.timeline.map((p) => ({
    date: formatDateShort(p.date, lang),
    goals: p.cum_goals,
    assists: p.cum_assists,
  }));
  const wld = [
    { name: t("common.wins"), value: data.wins, color: "#039855" },
    { name: t("common.losses"), value: data.losses, color: "#f43f5e" },
    { name: t("common.draws"), value: data.draws, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <Link
        to="/players"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-pitch-600"
      >
        ← {t("common.backToPlayers")}
      </Link>

      {/* Header */}
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
        <Avatar name={data.name} size="xl" />
        <div className="text-center sm:text-left">
          <h1 className="inline-flex items-center gap-2 font-display text-3xl font-extrabold">
            {data.name}
            {data.is_mensalista && (
              <span
                className="text-base text-pitch-600 dark:text-pitch-400"
                title={
                  lang === "pt"
                    ? `Mensalista${data.mensalista_since ? ` desde ${data.mensalista_since}` : ""}`
                    : `Season member${data.mensalista_since ? ` since ${data.mensalista_since}` : ""}`
                }
              >
                📅
              </span>
            )}
          </h1>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-500 sm:justify-start">
            <span>
              {data.games} {t("profile.gamesPlayed").toLowerCase()}
            </span>
            {data.goals_rank && (
              <span>
                #{data.goals_rank} {t("profile.goalsRank")}
              </span>
            )}
            {data.scoring_rate_rank && (
              <span>
                #{data.scoring_rate_rank} {t("profile.rateRank")}
              </span>
            )}
          </div>
          <div className="mt-3 flex justify-center sm:justify-start">
            <FormPills form={data.form} dates={data.form_dates} scores={data.form_scores} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("common.goals")} value={data.goals} icon="⚽" accent />
        <StatCard label={t("common.assists")} value={data.assists} icon="🅰️" />
        <StatCard label={t("common.winPct")} value={`${data.win_pct}%`} icon="📈" />
        <StatCard
          label={`${t("common.goals")}/${t("common.games").toLowerCase()}`}
          value={data.goals_per_game}
          icon="🎯"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progression */}
        <Section title={t("profile.progression")} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#039855" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#039855" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="goals"
                name={t("common.goals")}
                stroke="#039855"
                strokeWidth={2}
                fill="url(#g)"
              />
              <Area
                type="monotone"
                dataKey="assists"
                name={t("common.assists")}
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#a)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        {/* W/L/D */}
        <Section title={t("profile.resultsBreakdown")}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={wld}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {wld.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: theme === "dark" ? "#0f172a" : "#fff",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Game log */}
      <Section title={t("profile.gameLog")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="px-3 py-2">{t("common.date")}</th>
                <th className="px-3 py-2">{t("common.score")}</th>
                <th className="px-3 py-2 text-right">{t("common.goals")}</th>
                <th className="px-3 py-2 text-right">{t("common.assists")}</th>
                <th className="px-3 py-2 text-center">{t("common.result")}</th>
              </tr>
            </thead>
            <tbody>
              {data.game_log.map((g, i) => (
                <tr
                  key={i}
                  onClick={() => navigate(`/match/${g.date}`)}
                  title={`${formatDate(g.date, lang)} · ${g.score} — ${t("match.open")}`}
                  className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(g.date, lang)}</td>
                  <td className="px-3 py-2 font-medium">{g.score}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.goals}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.assists}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <FormPills form={[g.result]} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
