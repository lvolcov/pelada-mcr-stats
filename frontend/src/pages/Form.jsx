import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort, formatDate } from "../lib/format";
import { Loading, ErrorState, PageHeader, FormPills, PlayerCell } from "../components/ui";

function StreakBadge({ type, len }) {
  const { strings } = useApp();
  if (!type || !len) return <span className="text-xs text-slate-400">—</span>;
  const style =
    type === "W"
      ? "bg-pitch-100 text-pitch-700 dark:bg-pitch-900/40 dark:text-pitch-300"
      : type === "L"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`pill ${style}`}>
      {len}× {strings.results[type]}
    </span>
  );
}

export default function Form() {
  const { t, lang } = useApp();
  const { data, error, loading, reload } = useApi(api.form);
  // Default order comes from the backend (recent activity first); null = keep it.
  const { sorted, sortKey, sortDir, toggle } = useSort(data || [], null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sortOptions = [
    { k: "recent_games", label: t("form.recent") },
    { k: "form_points", label: t("form.title") },
    { k: "streak_len", label: t("form.streak") },
    { k: "last_seen", label: t("common.lastSeen") },
    { k: "name", label: t("common.name") },
  ];

  const legend = [
    { cls: "bg-pitch-600 text-white", sym: t("results.W"), label: t("common.wins") },
    { cls: "bg-slate-400 text-white dark:bg-slate-600", sym: t("results.D"), label: t("common.draws") },
    { cls: "bg-rose-500 text-white", sym: t("results.L"), label: t("common.losses") },
    {
      cls: "border border-dashed border-slate-300 text-slate-400 dark:border-slate-600",
      sym: "✕",
      label: t("form.absent"),
    },
  ];

  return (
    <div>
      <PageHeader title={t("form.title")} subtitle={t("form.subtitle")} />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{t("common.sortBy")}:</span>
        {sortOptions.map((o) => (
          <button
            key={o.k}
            onClick={() => toggle(o.k)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
              sortKey === o.k ? "text-pitch-600 dark:text-pitch-400" : ""
            }`}
          >
            {o.label}
            <span className="text-[10px] opacity-70">
              {sortKey === o.k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
            </span>
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="font-medium">{t("form.legend")}:</span>
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${l.cls}`}
            >
              {l.sym}
            </span>
            {l.label}
          </span>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => {
          const inactive = p.recent_games === 0;
          return (
            <div
              key={p.player}
              className={`card flex items-center justify-between gap-3 p-4 ${
                inactive ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <PlayerCell name={p.name} player={p.player} />
                <div className="mt-2 flex items-center gap-2">
                  <StreakBadge type={p.streak_type} len={p.streak_len} />
                  {inactive && (
                    <span className="text-[11px] text-slate-400">
                      {t("common.lastSeen")}: {formatDate(p.last_seen, lang)}
                    </span>
                  )}
                </div>
              </div>
              <FormPills form={p.form} dates={p.form_dates} scores={p.form_scores} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
