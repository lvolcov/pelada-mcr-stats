import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort, formatDate, formatDateShort } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar, MensalistaBadge, RankBadge } from "../components/ui";

export default function Attendance() {
  const { t, lang, isMensalista } = useApp();
  const { data, error, loading, reload } = useApi(api.attendance);
  const [onlyMensalistas, setOnlyMensalistas] = useState(false);

  const rows = (data?.players || []).filter((p) =>
    onlyMensalistas ? isMensalista(p.player) : true
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(rows, "attended", "desc");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const SortTh = ({ k, label, className }) => (
    <th className={className}>
      <button
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1 transition hover:text-pitch-600 ${
          sortKey === k ? "text-pitch-600 dark:text-pitch-400" : ""
        }`}
      >
        {label}
        <span className="text-[10px] opacity-70">
          {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader title={t("attendance.title")} subtitle={t("attendance.subtitle")}>
        <button
          onClick={() => setOnlyMensalistas((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            onlyMensalistas
              ? "border-pitch-500 bg-pitch-50 text-pitch-700 dark:bg-pitch-900/30 dark:text-pitch-300"
              : "border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          }`}
        >
          📅 {t("common.mensalistasOnly")}
        </button>
      </PageHeader>
      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="sticky left-0 z-10 w-10 bg-white px-2 py-3 text-center dark:bg-slate-900">
                #
              </th>
              <SortTh
                k="name"
                label={t("common.player")}
                className="sticky left-10 z-10 bg-white px-4 py-3 text-left dark:bg-slate-900"
              />
              {data.session_dates.map((d) => (
                <th key={d} className="px-1 py-3 text-center text-[10px] font-medium text-slate-400">
                  {formatDateShort(d, lang)}
                </th>
              ))}
              <SortTh k="attended" label={t("attendance.attended")} className="px-3 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.player} className="border-t border-slate-100 dark:border-slate-800/60">
                <td className="sticky left-0 z-10 w-10 bg-white px-2 py-2 text-center dark:bg-slate-900">
                  <RankBadge rank={i + 1} />
                </td>
                <td className="sticky left-10 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.name} size="sm" to={`/player/${p.player}`} />
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium">
                      {p.name}
                      <MensalistaBadge player={p.player} className="text-xs" />
                    </span>
                  </div>
                </td>
                {p.sessions.map((present, i) => {
                  const info = data.session_info?.[i] || { date: data.session_dates[i] };
                  const tip = `${p.name} · ${formatDate(info.date, lang)}${
                    info.score ? ` · ${info.score}` : ""
                  } — ${present ? "✓" : "—"}`;
                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      {present ? (
                        <Link
                          to={`/match/${info.date}`}
                          title={tip}
                          className="inline-block h-5 w-5 rounded bg-pitch-500 transition hover:ring-2 hover:ring-pitch-300"
                        />
                      ) : (
                        <span
                          className="inline-block h-5 w-5 rounded bg-slate-100 dark:bg-slate-800"
                          title={tip}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <span className="font-bold tabular-nums">{p.attended}</span>
                  <span className="text-xs text-slate-400"> ({p.attendance_pct}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
