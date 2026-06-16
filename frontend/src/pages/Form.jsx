import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
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

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={t("form.title")} subtitle={t("form.subtitle")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((p) => (
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
