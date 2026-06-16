import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort } from "../lib/format";
import { Loading, ErrorState, PageHeader, Avatar, MensalistaBadge } from "../components/ui";

export default function Players() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.players);
  const [q, setQ] = useState("");
  const [onlyMensalistas, setOnlyMensalistas] = useState(false);

  const base = data || [];
  const filtered = base
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => (onlyMensalistas ? p.is_mensalista : true));
  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, "name", "asc");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sortOptions = [
    { k: "name", label: t("common.name") },
    { k: "games", label: t("common.games") },
    { k: "goals", label: t("common.goals") },
    { k: "assists", label: t("common.assists") },
  ];

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
        <button
          onClick={() => setOnlyMensalistas((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-medium transition ${
            onlyMensalistas
              ? "border-pitch-500 bg-pitch-50 text-pitch-700 dark:bg-pitch-900/30 dark:text-pitch-300"
              : "border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          }`}
        >
          📅 {t("common.mensalistasOnly")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((p) => (
          <Link
            key={p.player}
            to={`/player/${encodeURIComponent(p.player)}`}
            className="card group flex flex-col items-center p-5 text-center transition hover:border-pitch-400 hover:shadow-md"
          >
            <Avatar name={p.name} size="lg" />
            <p className="mt-3 inline-flex items-center gap-1.5 font-semibold group-hover:text-pitch-600">
              {p.name}
              <MensalistaBadge player={p.player} className="text-xs" />
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {p.games} {t("common.games").toLowerCase()} · {p.goals} ⚽ · {p.assists} 🅰️
            </p>
          </Link>
        ))}
      </div>
      {sorted.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("common.noData")}</p>
      )}
    </div>
  );
}
