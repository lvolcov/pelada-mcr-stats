import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort } from "../lib/format";
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
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.form);
  const { sorted, sortKey, sortDir, toggle } = useSort(data || [], "form_points", "desc");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sortOptions = [
    { k: "form_points", label: t("form.title") },
    { k: "streak_len", label: t("form.streak") },
    { k: "games", label: t("common.games") },
    { k: "name", label: t("common.name") },
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
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => (
          <div
            key={p.player}
            className="card flex items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <PlayerCell name={p.name} player={p.player} />
              <div className="mt-2">
                <StreakBadge type={p.streak_type} len={p.streak_len} />
              </div>
            </div>
            <FormPills form={p.form} />
          </div>
        ))}
      </div>
    </div>
  );
}
