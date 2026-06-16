import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort, formatDate } from "../lib/format";
import {
  Loading,
  ErrorState,
  PageHeader,
  Section,
  PlayerCell,
  Avatar,
  RankBadge,
} from "../components/ui";

export default function Mvp() {
  const { t, lang } = useApp();
  const { data, error, loading, reload } = useApi(api.mvp);
  const [newestFirst, setNewestFirst] = useState(true);
  // Hooks must run unconditionally — keep useSort above the early returns.
  const { sorted, sortKey, sortDir, toggle } = useSort(
    data?.season || [],
    "mvp_count",
    "desc"
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const perSession = newestFirst ? data.per_session : [...data.per_session].reverse();

  const SortBtn = ({ k, children }) => (
    <button
      onClick={() => toggle(k)}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
        sortKey === k ? "text-pitch-600 dark:text-pitch-400" : "text-slate-500"
      }`}
    >
      {children}
      <span className="text-[10px] opacity-70">
        {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );

  return (
    <div>
      <PageHeader title={t("mvp.title")} subtitle={t("mvp.subtitle")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("mvp.seasonRanking")}>
          <div className="mb-2 flex items-center gap-1 text-xs text-slate-400">
            <span>{t("common.sortBy")}:</span>
            <SortBtn k="mvp_count">{t("mvp.count")}</SortBtn>
            <SortBtn k="name">{t("common.name")}</SortBtn>
          </div>
          <ul className="space-y-2">
            {sorted.map((p, i) => (
              <li
                key={p.player}
                className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center">
                    <RankBadge rank={sortKey === "mvp_count" && sortDir === "desc" ? p.rank : i + 1} />
                  </span>
                  <PlayerCell name={p.name} player={p.player} />
                </div>
                <span className="pill bg-pitch-100 text-pitch-700 dark:bg-pitch-900/40 dark:text-pitch-300">
                  {p.mvp_count}× {p.mvp_count === 1 ? t("mvp.time") : t("mvp.times")}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("mvp.perSession")}>
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setNewestFirst((v) => !v)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t("common.date")} {newestFirst ? "▼" : "▲"}
            </button>
          </div>
          <ul className="space-y-2">
            {perSession.map((s) => (
              <li
                key={s.date}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <div className="text-xs text-slate-400">
                  <p>{formatDate(s.date, lang)}</p>
                  <p className="font-bold text-slate-600 dark:text-slate-300">{s.score}</p>
                </div>
                {s.mvp ? (
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-slate-400">
                      ⚽ {s.mvp.goals} · 🅰️ {s.mvp.assists}
                    </div>
                    <Avatar name={s.mvp.name} size="sm" to={`/player/${s.mvp.player}`} />
                    <span className="text-sm font-semibold">{s.mvp.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t("common.noData")}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
