import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDate } from "../lib/format";
import { Loading, ErrorState, PageHeader, PlayerCell, FormPills } from "../components/ui";

function MatchCard({ match }) {
  const { t, lang } = useApp();
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {formatDate(match.date, lang)}
          </p>
          <p className="font-display text-2xl font-extrabold">{match.score}</p>
        </div>
        <div className="text-right">
          {match.mixed && (
            <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {t("matches.mixedDay")}
            </span>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {match.player_count} {t("matches.present")}
          </p>
        </div>
      </div>
      {match.top_scorers.length > 0 && (
        <div className="px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("matches.topScorers")}
          </p>
          <div className="space-y-2">
            {match.top_scorers.map((p) => (
              <div key={p.player} className="flex items-center justify-between gap-2">
                <PlayerCell name={p.name} player={p.player} />
                <div className="flex items-center gap-3 text-sm">
                  {p.goals > 0 && (
                    <span className="tabular-nums">⚽ {p.goals}</span>
                  )}
                  {p.assists > 0 && (
                    <span className="tabular-nums text-slate-400">🅰️ {p.assists}</span>
                  )}
                  <FormPills form={[p.result]} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.matches);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={t("matches.title")} subtitle={t("matches.subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((m) => (
          <MatchCard key={m.date} match={m} />
        ))}
      </div>
    </div>
  );
}
