// Generic responsive ranking table. Columns can be hidden on mobile.

import { RankBadge, PlayerCell } from "./ui";

/**
 * @param {object[]} rows         data rows (must include `rank`, `name`, `player`)
 * @param {object[]} columns      [{ key, label, render?, align?, hideOnMobile?, highlight? }]
 */
export default function RankTable({ rows, columns }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="w-12 px-4 py-3 text-center">#</th>
              <th className="px-4 py-3">{columns.playerLabel}</th>
              {columns.cols.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-3 ${c.align === "left" ? "text-left" : "text-right"} ${
                    c.hideOnMobile ? "hidden sm:table-cell" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.player}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 text-center">
                  <RankBadge rank={row.rank} />
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
