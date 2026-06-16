// App shell: fixed sidebar on desktop, slide-over drawer + top bar on mobile.

import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

const NAV = [
  { to: "/", key: "home", icon: "🏠", end: true },
  { to: "/leaderboard", key: "leaderboard", icon: "🏆" },
  { to: "/winrate", key: "winrate", icon: "📈" },
  { to: "/scoring", key: "scoring", icon: "🎯" },
  { to: "/ga", key: "ga", icon: "🅖" },
  { to: "/form", key: "form", icon: "🔥" },
  { to: "/trend", key: "trend", icon: "📊" },
  { to: "/matches", key: "matches", icon: "📅" },
  { to: "/mvp", key: "mvp", icon: "⭐" },
  { to: "/attendance", key: "attendance", icon: "✅" },
  { to: "/players", key: "players", icon: "👥" },
];

// Manchester's worker bee — the city's emblem — in Brazilian amber/green tones.
function BeeLogo({ className = "" }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm ring-1 ring-amber-600/30 ${className}`}
    >
      <span className="text-lg leading-none">🐝</span>
    </span>
  );
}

function Brand() {
  const { t } = useApp();
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <BeeLogo className="h-9 w-9" />
      <div className="leading-tight">
        <p className="font-display text-base font-extrabold">{t("appName")}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-pitch-600 dark:text-pitch-400">
          🇧🇷 Manchester
        </p>
      </div>
    </Link>
  );
}

function Toggles() {
  const { theme, toggleTheme } = useApp();
  // Language is locked to Portuguese for now, so only the theme toggle is shown.
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        data-testid="theme-toggle"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

function NavItems({ onNavigate }) {
  const { t } = useApp();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
        >
          <span className="w-5 text-center text-base">{item.icon}</span>
          {t(`nav.${item.key}`)}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <p className="mt-4 px-3 text-[11px] text-slate-400">🐝 Pelada MCR · 2026</p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          data-testid="menu-button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Brand />
        <Toggles />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            data-testid="mobile-drawer"
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg dark:border-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop top toggles bar */}
        <div className="hidden items-center justify-end border-b border-slate-200 bg-white/60 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 lg:flex">
          <Toggles />
        </div>
        <main key={location.pathname} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
