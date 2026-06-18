import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { useApi, useSort } from "../lib/format";
import { Loading, ErrorState, PageHeader, Section, Avatar } from "../components/ui";
import { Link } from "react-router-dom";

// Stacked avatars + linked names for a duo/trio.
function Combo({ players }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2 shrink-0">
        {players.map((p) => (
          <Avatar key={p.player} name={p.name} size="sm" to={`/player/${encodeURIComponent(p.player)}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-sm font-medium leading-tight">
        {players.map((p, i) => (
          <span key={p.player}>
            <Link
              to={`/player/${encodeURIComponent(p.player)}`}
              className="hover:text-pitch-600 hover:underline"
            >
              {p.name}
            </Link>
            {i < players.length - 1 && <span className="text-slate-400"> +</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// Win% bar, green above 50% / rose below.
function SynergyBar({ pct }) {
  const above = pct >= 50;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 sm:w-24">
        <div
          className={`h-full rounded-full ${above ? "bg-pitch-500" : "bg-rose-500"}`}
          style={{ width: `${Math.round(pct)}%` }}
        />
      </div>
      <span
        className={`w-12 text-right text-sm font-bold tabular-nums ${
          above ? "text-pitch-600 dark:text-pitch-400" : "text-rose-500"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

function Th({ label, k, sort, align = "right", className = "" }) {
  const active = sort.sortKey === k;
  return (
    <th
      onClick={() => sort.toggle(k)}
      className={`cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {label}
      {active && <span className="ml-0.5">{sort.sortDir === "desc" ? " ▾" : " ▴"}</span>}
    </th>
  );
}

function ComboTable({ rows, t }) {
  const sort = useSort(rows, "adj_pct", "desc");
  if (rows.length === 0) {
    return <p className="px-3 py-10 text-center text-sm text-slate-400">{t("datalab.empty")}</p>;
  }
  return (
    <div className="-mx-2 overflow-x-auto sm:mx-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t("common.players")}
            </th>
            <Th label={t("datalab.together")} k="games" sort={sort} className="hidden sm:table-cell" />
            <Th label={t("common.wins")} k="wins" sort={sort} className="hidden sm:table-cell" />
            <Th label={t("datalab.raw")} k="win_pct" sort={sort} className="hidden sm:table-cell" />
            <Th label={t("datalab.adjusted")} k="adj_pct" sort={sort} align="right" />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((r) => (
            <tr
              key={r.label}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
            >
              <td className="px-3 py-2.5">
                <Combo players={r.players} />
                {/* Mobile-only compact stats under the names */}
                <div className="mt-1 flex gap-3 text-xs text-slate-400 sm:hidden">
                  <span>{r.games} {t("common.games").toLowerCase()}</span>
                  <span>{r.wins} {t("common.wins").toLowerCase()}</span>
                  <span>{t("datalab.raw")}: {r.win_pct}%</span>
                </div>
              </td>
              <td className="hidden px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400 sm:table-cell">
                {r.games}
              </td>
              <td className="hidden px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400 sm:table-cell">
                {r.wins}
              </td>
              <td className="hidden px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400 sm:table-cell">
                {r.win_pct}%
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end">
                  <SynergyBar pct={r.adj_pct} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Highlight({ label, combo, accent }) {
  if (!combo) return null;
  return (
    <div className="card flex flex-col gap-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <Combo players={combo.players} />
      <p
        className={`font-display text-2xl font-extrabold tabular-nums ${
          accent === "good" ? "text-pitch-600 dark:text-pitch-400" : "text-rose-500"
        }`}
      >
        {combo.adj_pct}%
        <span className="ml-2 text-xs font-medium text-slate-400">
          {combo.win_pct}% · {combo.games}j
        </span>
      </p>
    </div>
  );
}

export default function DataLab() {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(api.synergy);
  const [tab, setTab] = useState("pairs");
  const [minGames, setMinGames] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const min = minGames ?? data.min_games;
  const maxMin = Math.max(1, data.max_together);
  const all = tab === "pairs" ? data.pairs : data.trios;
  const rows = all.filter((r) => r.games >= min);
  const eligible = all.filter((r) => r.games >= data.min_games);
  const best = eligible[0]; // already sorted by adj_pct desc on the backend
  const worst = eligible[eligible.length - 1];

  const tabs = [
    ["pairs", t("datalab.duos")],
    ["trios", t("datalab.trios")],
  ];

  return (
    <div>
      <PageHeader title={t("datalab.title")} subtitle={t("datalab.subtitle")} />

      <p className="-mt-3 mb-5 text-sm text-slate-500 dark:text-slate-400">
        🧪 {data.decided_days} {t("datalab.decided")} ({t("datalab.of")} {data.total_days}) ·{" "}
        {t("datalab.sortedBy")}
      </p>

      {/* Best / worst synergy highlights */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Highlight label={`${t("datalab.best")} · ${tabs.find((x) => x[0] === tab)[1]}`} combo={best} accent="good" />
        <Highlight label={`${t("datalab.worst")} · ${tabs.find((x) => x[0] === tab)[1]}`} combo={worst} accent="bad" />
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === key
                ? "bg-pitch-600 text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Min-games filter */}
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <label htmlFor="min" className="shrink-0">
          {t("datalab.minTogether")}: <b className="text-slate-700 dark:text-slate-200">{min}</b>
        </label>
        <input
          id="min"
          type="range"
          min="1"
          max={maxMin}
          value={min}
          onChange={(e) => setMinGames(Number(e.target.value))}
          className="w-40 accent-pitch-600"
        />
      </div>

      <Section className="!p-2 sm:!p-3">
        <ComboTable rows={rows} t={t} />
      </Section>

      {/* Methodology / fun disclaimer */}
      <div className="mt-6 space-y-2 text-xs leading-relaxed text-slate-400">
        <p className="font-semibold text-slate-500 dark:text-slate-300">
          ℹ️ {t("datalab.methodTitle")}
        </p>
        <p>{t("datalab.method1")}</p>
        <p>{t("datalab.method2", { half: data.k / 2, k: data.k })}</p>
        <p>{t("datalab.sampleNote")}</p>
      </div>
    </div>
  );
}
