// Reusable presentational primitives shared across dashboards.

import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { avatarColor, initials, medal } from "../lib/format";

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}

export function Loading() {
  const { t } = useApp();
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-pitch-600" />
      {t("common.loading")}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useApp();
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <p className="mt-3 font-semibold">{t("common.error")}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-pitch-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pitch-700"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function Avatar({ name, size = "md", to }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };
  const inner = (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white/20 ${avatarColor(
        name
      )} ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function RankBadge({ rank }) {
  const m = medal(rank);
  if (m) return <span className="text-lg leading-none">{m}</span>;
  return <span className="tabular-nums text-slate-400">{rank}</span>;
}

const RESULT_STYLE = {
  W: "bg-pitch-600 text-white",
  L: "bg-rose-500 text-white",
  D: "bg-slate-400 text-white dark:bg-slate-600",
  "-": "bg-slate-200 text-slate-400 dark:bg-slate-800",
};

export function FormPills({ form }) {
  const { strings } = useApp();
  if (!form || form.length === 0)
    return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
            RESULT_STYLE[r] || RESULT_STYLE["-"]
          }`}
          title={r}
        >
          {strings.results[r] || r}
        </span>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card animate-fade-in p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p
        className={`mt-2 font-display text-3xl font-extrabold tracking-tight ${
          accent ? "text-pitch-600 dark:text-pitch-400" : ""
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function PlayerCell({ name, player, size = "sm" }) {
  return (
    <Link
      to={`/player/${encodeURIComponent(player)}`}
      className="group inline-flex items-center gap-3"
    >
      <Avatar name={name} size={size} />
      <span className="font-medium group-hover:text-pitch-600 group-hover:underline">
        {name}
      </span>
    </Link>
  );
}

export function Section({ title, children, className = "" }) {
  return (
    <section className={`card p-5 ${className}`}>
      {title && <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}
