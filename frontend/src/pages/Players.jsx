import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar } from "../components/ui";

export default function Players() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.players);
  const [q, setQ] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const filtered = data.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title={t("nav.players")}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.search")}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 dark:border-slate-700 dark:bg-slate-900 sm:w-64"
        />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <Link
            key={p.player}
            to={`/player/${encodeURIComponent(p.player)}`}
            className="card group flex flex-col items-center p-5 text-center transition hover:border-pitch-400 hover:shadow-md"
          >
            <Avatar name={p.name} size="lg" />
            <p className="mt-3 font-semibold group-hover:text-pitch-600">{p.name}</p>
            <p className="mt-1 text-xs text-slate-400">
              {p.games} {t("common.games").toLowerCase()} · {p.goals} ⚽ · {p.assists} 🅰️
            </p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("common.noData")}</p>
      )}
    </div>
  );
}
