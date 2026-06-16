// Generic responsive ranking table with sortable columns.
// Columns can be hidden on mobile. Clicking a header sorts by that column;
// clicking again flips direction. The "#" column re-numbers as you sort.

import { RankBadge, PlayerCell } from "./ui";
import { useSort } from "../lib/format";

function SortHeader({ label, active, dir, align, onClick, className = "" }) {
  return (
    <th
      className={`select-none px-3 py-3 ${align === "left" ? "text-left" : "text-right"} ${className}`}
    >
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 whitespace-nowrap transition hover:text-pitch-600 dark:hover:text-pitch-400 ${
          active ? "text-pitch-600 dark:text-pitch-400" : ""
        }`}
      >
        {align === "right" && <Caret active={active} dir={dir} />}
        {label}
        {align !== "right" && <Caret active={active} dir={dir} />}
      </button>
    </th>
  );
}

function Caret({ active, dir }) {
  return (
    <span className="text-[10px] leading-none opacity-70">
      {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );
}

/**
 * @param {object[]} rows  data rows (must include `rank`, `name`, `player`)
 * @param {object}   columns  { playerLabel, cols: [{ key, label, render?, align?, hideOnMobile?, highlight? }] }
 * @param {string}   defaultSort  initial sort key (defaults to existing `rank`)
 */
export default function RankTable({ rows, columns, defaultSort = "rank", defaultDir = "asc" }) {
  const { sorted, sortKey, sortDir, toggle } = useSort(rows, defaultSort, defaultDir);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <SortHeader
                label="#"
                align="left"
                className="w-14 !text-center"
                active={sortKey === "rank"}
                dir={sortDir}
                onClick={() => toggle("rank")}
              />
              <SortHeader
                label={columns.playerLabel}
                align="left"
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggle("name")}
              />
              {columns.cols.map((c) => (
                <SortHeader
                  key={c.key}
                  label={c.label}
                  align={c.align || "right"}
                  className={c.hideOnMobile ? "hidden sm:table-cell" : ""}
                  active={sortKey === c.key}
                  dir={sortDir}
                  onClick={() => toggle(c.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.player}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 text-center">
                  {sortKey === "rank" || !sortKey ? (
                    <RankBadge rank={row.rank} />
                  ) : (
                    <span className="tabular-nums text-slate-400">{i + 1}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PlayerCell name={row.name} player={row.player} />
                </td>
                {columns.cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-3 tabular-nums ${
                      c.align === "left" ? "text-left" : "text-right"
                    } ${c.hideOnMobile ? "hidden sm:table-cell" : ""} ${
                      c.highlight
                        ? "font-bold text-pitch-600 dark:text-pitch-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
