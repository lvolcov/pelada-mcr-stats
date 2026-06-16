import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDate } from "../lib/format";
import { Loading, ErrorState, StatCard, Avatar } from "../components/ui";

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

export default function Home() {
  const { t, lang } = useApp();
  const { data, error, loading, reload } = useApi(api.overview);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-700 via-pitch-600 to-emerald-500 p-8 text-white shadow-lg sm:p-12">
        <div className="absolute -right-10 -top-10 text-[180px] opacity-10">⚽</div>
        <div className="relative animate-fade-in">
          <p className="text-sm font-semibold uppercase tracking-widest text-pitch-100">
            {t("appTagline")}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-pitch-50/90">{t("home.heroSubtitle")}</p>
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
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch-100 text-2xl dark:bg-pitch-900/40">
              🔥
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t("home.busiest")}
              </p>
              <p className="font-display text-lg font-bold">{data.busiest_session.score}</p>
              <p className="text-sm text-slate-500">
                {formatDate(data.busiest_session.date, lang)} · {data.busiest_session.goals}{" "}
                {t("common.goals").toLowerCase()}
              </p>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        {t("common.updated")}: {data.parsed_at?.replace("T", " ")}
      </p>
    </div>
  );
}
