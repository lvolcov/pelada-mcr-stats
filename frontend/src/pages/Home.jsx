import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDate, formatDateShort } from "../lib/format";
import { Loading, ErrorState, StatCard, Avatar, Section, Logo } from "../components/ui";

function HighlightCard({ label, person, metric, to }) {
  if (!person) return null;
  return (
    <Link to={to} className="card group flex items-center gap-4 p-5 transition hover:border-pitch-400">
      <Avatar name={person.name} size="lg" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate font-display text-lg font-bold group-hover:text-pitch-600">
          {person.name}
        </p>
        <p className="text-sm text-slate-500">{metric}</p>
      </div>
    </Link>
  );
}

const tooltipStyle = (theme) => ({
  borderRadius: 12,
  border: "none",
  background: theme === "dark" ? "#0f172a" : "#fff",
  fontSize: 13,
});

export default function Home() {
  const { t, lang, theme } = useApp();
  const ov = useApi(api.overview);
  const lb = useApi(api.leaderboard);
  const tr = useApi(api.seasonTrend);

  if (ov.loading || lb.loading || tr.loading) return <Loading />;
  if (ov.error) return <ErrorState message={ov.error} onRetry={ov.reload} />;

  const data = ov.data;
  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";

  const topScorers = (lb.data || [])
    .slice()
    .sort((a, b) => b.ga - a.ga)
    .slice(0, 8)
    .map((p) => ({ name: p.name.split(" ")[0], goals: p.goals, assists: p.assists }));

  const trend = (tr.data || []).map((s) => ({
    date: formatDateShort(s.date, lang),
    goals: s.player_goals,
    assists: s.assists,
  }));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-700 via-pitch-600 to-emerald-500 px-6 py-9 text-center text-white shadow-xl sm:py-12">
        {/* soft depth glows */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-40 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 -z-10 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 -z-10 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative mx-auto flex max-w-md flex-col items-center animate-fade-in">
          {/* mascot */}
          <div className="relative mb-4">
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-white/25 blur-2xl" />
            <Logo className="h-20 w-20 drop-shadow-[0_8px_22px_rgba(0,0,0,0.4)] sm:h-24 sm:w-24" />
          </div>
          <h1 className="font-display text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-4xl">
            {t("appName")}
          </h1>
          <p className="mt-2 max-w-xs text-sm font-medium text-pitch-50/95 sm:max-w-sm sm:text-base">
            {t("appTagline")}
          </p>
          <Link
            to="/leaderboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-pitch-700 shadow-lg shadow-emerald-950/30 transition hover:bg-pitch-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("home.explore")} →
          </Link>
        </div>
      </section>

      {/* Key numbers */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("home.totalGoals")} value={data.total_goals} icon="⚽" accent />
        <StatCard label={t("home.totalAssists")} value={data.total_assists} icon="🅰️" />
        <StatCard label={t("home.sessions")} value={data.sessions} icon="📅" />
        <StatCard label={t("home.avgGoals")} value={data.avg_goals_per_session} icon="📊" />
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Section title={t("home.topScorersChart")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topScorers} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} contentStyle={tooltipStyle(theme)} />
              <Legend />
              <Bar dataKey="goals" name={t("common.goals")} stackId="a" fill="#039855" />
              <Bar dataKey="assists" name={t("common.assists")} stackId="a" fill="#6ce9a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title={t("home.trendChart")}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#039855" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#039855" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Area
                type="monotone"
                dataKey="goals"
                name={t("common.goals")}
                stroke="#039855"
                strokeWidth={3}
                fill="url(#hg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </section>

      {/* Highlights */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HighlightCard
          label={t("home.topScorer")}
          person={data.top_scorer}
          metric={`${data.top_scorer?.goals} ${t("common.goals").toLowerCase()}`}
          to={`/player/${data.top_scorer?.player}`}
        />
        <HighlightCard
          label={t("home.topAssister")}
          person={data.top_assister}
          metric={`${data.top_assister?.assists} ${t("common.assists").toLowerCase()}`}
          to={`/player/${data.top_assister?.player}`}
        />
        {data.busiest_session && (
          <Link
            to={`/match/${data.busiest_session.date}`}
            className="card group flex items-center gap-4 p-5 transition hover:border-pitch-400"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch-100 text-2xl dark:bg-pitch-900/40">
              🔥
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t("home.busiest")}
              </p>
              <p className="font-display text-lg font-bold group-hover:text-pitch-600">
                {data.busiest_session.score}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(data.busiest_session.date, lang)} · {data.busiest_session.goals}{" "}
                {t("common.goals").toLowerCase()}
              </p>
            </div>
          </Link>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        {t("common.updated")}: {data.parsed_at?.replace("T", " ")}
      </p>
    </div>
  );
}
