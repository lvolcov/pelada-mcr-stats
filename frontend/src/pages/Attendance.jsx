import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, formatDateShort } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar } from "../components/ui";

export default function Attendance() {
  const { t, lang } = useApp();
  const { data, error, loading, reload } = useApi(api.attendance);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={t("attendance.title")} subtitle={t("attendance.subtitle")} />
      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900">
                {t("common.player")}
              </th>
              {data.session_dates.map((d) => (
                <th
                  key={d}
                  className="px-1 py-3 text-center text-[10px] font-medium text-slate-400"
                >
                  {formatDateShort(d, lang)}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs uppercase tracking-wide text-slate-400">
                {t("attendance.attended")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((p) => (
              <tr
                key={p.player}
                className="border-t border-slate-100 dark:border-slate-800/60"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.name} size="sm" to={`/player/${p.player}`} />
                    <span className="whitespace-nowrap font-medium">{p.name}</span>
                  </div>
                </td>
                {p.sessions.map((present, i) => (
                  <td key={i} className="px-1 py-2 text-center">
                    <span
                      className={`inline-block h-5 w-5 rounded ${
                        present
                          ? "bg-pitch-500"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                      title={present ? "✓" : "—"}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <span className="font-bold tabular-nums">{p.attended}</span>
                  <span className="text-xs text-slate-400">
                    {" "}
                    ({p.attendance_pct}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
