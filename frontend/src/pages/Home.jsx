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
import { Loading, ErrorState, Section, Avatar, Logo } from "../components/ui";

/* --- inline line icons (24x24, currentColor) ------------------------------ */
const PATHS = {
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.6l3.2 2.3-1.2 3.7h-4l-1.2-3.7z" />
      <path d="M12 7.6V4M15.2 9.9l2.9-1.1M14 13.6l1.9 2.7M10 13.6l-1.9 2.7M8.8 9.9L5.9 8.8" />
    </>
  ),
  assist: <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />,
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
    </>
  ),
  trend: (
    <>
      <path d="M3 16l5-5 4 4 8-8" />
      <path d="M16 7h5v5" />
    </>
  ),
  flame: <path d="M12 2.5s4 3.4 4 7.8a4 4 0 0 1-8 0c0-1.4.5-2.5 1.1-3.6C10 9 12 7.6 12 2.5z" />,
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 18.5h6M10 14.8V18.5M14 14.8V18.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

const ACCENT = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

function StatTile({ icon, label, value, accent = "emerald" }) {
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT[accent]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-3xl font-extrabold tabular-nums leading-none sm:text-4xl">
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

/* Big "player of the season" spotlight card. */
function Spotlight({ to, eyebrow, name, value, unit, icon, gradient, chip }) {
  if (!name) return null;
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-white shadow-sm transition hover:shadow-md ${gradient}`}
    >
      <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <Avatar name={name} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-white/80">
          <Icon name={icon} className="h-3.5 w-3.5" /> {eyebrow}
        </p>
        <p className="truncate font-display text-xl font-extrabold leading-tight">{name}</p>
      </div>
      <div className={`shrink-0 rounded-xl px-3 py-1.5 text-center ${chip}`}>
        <p className="font-display text-2xl font-extrabold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/80">{unit}</p>
      </div>
    </Link>
  );
}

const tooltipStyle = (theme) => ({
  borderRadius: 12,
  border: "none",
  background: theme === "dark" ? "#0f172a" : "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
  const season = data.parsed_at?.slice(0, 4) || "";

  const topScorers = (lb.data || [])
    .slice()
    .sort((a, b) => b.ga - a.ga)
    .slice(0, 8)
    .map((p) => ({ name: p.name.split(" ")[0], goals: p.goals, assists: p.assists }));

  const trend = (tr.data || []).map((s) => ({
    date: formatDateShort(s.date, lang),
    goals: s.player_goals,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-800 via-pitch-600 to-emerald-500 p-6 text-white shadow-lg sm:p-12">
        {/* glows */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        {/* bee */}
        <Logo className="pointer-events-none absolute right-4 top-1/2 hidden h-44 w-44 -translate-y-1/2 opacity-95 drop-shadow-[0_6px_20px_rgba(0,0,0,0.4)] sm:block" />
        <Logo className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 opacity-90 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] sm:hidden" />

        <div className="relative animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-white ring-1 ring-white/20 backdrop-blur">
            {t("common.season")} {season}
          </span>
          <h1 className="mt-3 max-w-[15rem] font-display text-2xl font-extrabold leading-tight drop-shadow-sm sm:max-w-xl sm:text-5xl">
            {t("appTagline")}
          </h1>
          <p className="mt-2 text-sm font-medium text-pitch-50/90 sm:text-base">
            <span className="font-bold tabular-nums">{data.sessions}</span>{" "}
            {t("home.sessions").toLowerCase()} ·{" "}
            <span className="font-bold tabular-nums">{data.total_goals}</span>{" "}
            {t("common.goals").toLowerCase()}
          </p>
          <Link
            to="/leaderboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-pitch-700 shadow-lg shadow-emerald-900/20 transition hover:bg-pitch-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("home.explore")} <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Season numbers */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon="ball" accent="emerald" label={t("home.totalGoals")} value={data.total_goals} />
        <StatTile icon="assist" accent="amber" label={t("home.totalAssists")} value={data.total_assists} />
        <StatTile icon="calendar" accent="sky" label={t("home.sessions")} value={data.sessions} />
        <StatTile icon="trend" accent="violet" label={t("home.avgGoals")} value={data.avg_goals_per_session} />
      </section>

      {/* Spotlights */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Spotlight
          to={`/player/${data.top_scorer?.player}`}
          eyebrow={t("home.topScorer")}
          name={data.top_scorer?.name}
          value={data.top_scorer?.goals}
          unit={t("common.goals").toLowerCase()}
          icon="trophy"
          gradient="bg-gradient-to-br from-pitch-700 to-emerald-500"
          chip="bg-white/20"
        />
        <Spotlight
          to={`/player/${data.top_assister?.player}`}
          eyebrow={t("home.topAssister")}
          name={data.top_assister?.name}
          value={data.top_assister?.assists}
          unit={t("common.assists").toLowerCase()}
          icon="assist"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          chip="bg-black/15"
        />
        {data.busiest_session && (
          <Link
            to={`/match/${data.busiest_session.date}`}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-5 text-white shadow-sm transition hover:shadow-md"
          >
            <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-rose-500/20 blur-2xl" />
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <Icon name="flame" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-white/70">
                {t("home.busiest")}
              </p>
              <p className="font-display text-xl font-extrabold leading-tight">
                {data.busiest_session.score}
              </p>
              <p className="text-sm text-white/75">
                {formatDate(data.busiest_session.date, lang)} · {data.busiest_session.goals}{" "}
                {t("common.goals").toLowerCase()}
              </p>
            </div>
          </Link>
        )}
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Section title={t("home.topScorersChart")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topScorers} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={28} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} contentStyle={tooltipStyle(theme)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="goals" name={t("common.goals")} stackId="a" fill="#039855" />
              <Bar dataKey="assists" name={t("common.assists")} stackId="a" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title={t("home.trendChart")}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12b76a" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#12b76a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Area
                type="monotone"
                dataKey="goals"
                name={t("common.goals")}
                stroke="#12b76a"
                strokeWidth={3}
                fill="url(#hg)"
                dot={{ r: 2.5, fill: "#12b76a" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </section>

      <p className="text-center text-xs text-slate-400">
        {t("common.updated")}: {data.parsed_at?.replace("T", " ")}
      </p>
    </div>
  );
}
