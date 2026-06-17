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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-700 via-pitch-600 to-emerald-500 p-8 text-white shadow-lg sm:p-12">
        <Logo className="pointer-events-none absolute right-4 top-1/2 hidden h-40 w-40 -translate-y-1/2 opacity-95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] sm:block sm:h-48 sm:w-48" />
        <Logo className="pointer-events-none absolute -right-3 -top-3 h-28 w-28 opacity-90 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] sm:hidden" />
        <div className="absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-amber-300 opacity-20 blur-3xl" />
        <div className="relative animate-fade-in">
          <p className="max-w-[13rem] text-sm font-semibold uppercase tracking-widest text-pitch-100 sm:max-w-none">
            {t("appTagline")}
          </p>
          <h1 className="mt-2 hidden max-w-2xl font-display text-3xl font-extrabold leading-tight sm:block sm:text-5xl">
            {t("home.heroTitle")}
          </h1>
          {t("home.heroSubtitle") && (
            <p className="mt-3 max-w-xl text-pitch-50/90">{t("home.heroSubtitle")}</p>
          )}
          <Link
            to="/leaderboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-pitch-700 shadow transition hover:bg-pitch-50"
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
