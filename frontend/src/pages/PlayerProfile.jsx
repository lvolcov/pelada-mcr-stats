import { useEffect, useState } from "react";
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
import { PlayerShareCard, ShareOverlay } from "../components/ShareCard";

export default function PlayerProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { t, lang, theme } = useApp();
  const { data, error, loading, reload } = useApi(() => api.player(name), [name]);
  const [share, setShare] = useState(false);

  // Close the share card on Escape and lock body scroll while it's open.
  useEffect(() => {
    if (!share) return;
    const onKey = (e) => e.key === "Escape" && setShare(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [share]);

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
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/players"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-pitch-600"
        >
          ← {t("common.backToPlayers")}
        </Link>
        <button
          type="button"
          onClick={() => setShare(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-pitch-400 hover:text-pitch-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pitch-400 dark:border-slate-700 dark:text-slate-300"
          aria-label={t("profile.share")}
          title={t("profile.share")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="hidden sm:inline">{t("profile.share")}</span>
        </button>
      </div>

      {share && (
        <ShareOverlay
          onClose={() => setShare(false)}
          label={t("share.close")}
          filename={`pelada-${data.player}`}
          shareTitle={`Pelada MCR · ${data.name}`}
          saveLabel={t("share.save")}
          busyLabel={t("share.busy")}
        >
          <PlayerShareCard data={data} lang={lang} t={t} />
        </ShareOverlay>
      )}

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
              {t("profile.attended")} {data.games}/{data.total_sessions}{" "}
              {t("common.sessions").toLowerCase()} ({data.attendance_pct}%)
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

      {/* Stat cards. On mobile, win% becomes a full-width bar on top so the
          remaining four cards fill a 2×2 with no gap. Desktop is a 5-up row. */}
      <div>
        <div className="card mb-4 flex items-center justify-between p-4 lg:hidden">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            📈 {t("common.winPct")}
          </span>
          <span className="font-display text-2xl font-extrabold text-pitch-600 dark:text-pitch-400">
            {data.win_pct}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label={t("common.goals")} value={data.goals} icon="⚽" accent />
          <StatCard label={t("common.assists")} value={data.assists} icon="🅰️" />
          <StatCard
            className="hidden lg:block"
            label={t("common.winPct")}
            value={`${data.win_pct}%`}
            icon="📈"
          />
          <StatCard
            label={`${t("common.goals")}/${t("common.games").toLowerCase()}`}
            value={data.goals_per_game}
            icon="🎯"
          />
          <StatCard
            label={t("profile.attendance")}
            value={`${data.games}/${data.total_sessions}`}
            sub={`${data.attendance_pct}%`}
            icon="📅"
          />
        </div>
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
