// Screenshot-ready "photo mode" share card for a match.
// A self-contained, mobile-viewport-sized card (no scroll) built to be
// screenshotted and shared. Rendered inside ShareOverlay. The layout is a
// fixed flex column so it always fits one screen; long player lists are
// split across two columns and stay compact.
//
// Designed to be reused for the player profile later: ShareOverlay + a card
// body following the same header / hero / body / highlight / footer rhythm.

import { useState } from "react";
import { Logo } from "./ui";
import { formatDate } from "../lib/format";

// Goals / assists as crisp typographic markers (no emoji icons).
function StatPair({ goals, assists }) {
  if (!goals && !assists) return null;
  return (
    <span className="shrink-0 space-x-1.5 font-display text-[0.8rem] font-bold tabular-nums">
      {goals > 0 && (
        <span className="text-white">
          {goals}
          <span className="ml-px text-[0.6rem] font-semibold text-white/60">G</span>
        </span>
      )}
      {assists > 0 && (
        <span className="text-amber-300">
          {assists}
          <span className="ml-px text-[0.6rem] font-semibold text-amber-300/60">A</span>
        </span>
      )}
    </span>
  );
}

function PlayerList({ players, accentClass }) {
  return (
    <ul className="space-y-[3px]">
      {players.map((p) => (
        <li key={p.player} className="flex items-baseline justify-between gap-2 leading-tight">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full ${accentClass}`} />
            <span className="truncate text-[0.82rem] font-medium text-white/90">{p.name}</span>
          </span>
          <StatPair goals={p.goals} assists={p.assists} />
        </li>
      ))}
    </ul>
  );
}

function StarIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l2.9 6.2 6.6.7-4.9 4.5 1.4 6.6L12 17.8 5.9 20l1.4-6.6L2.4 8.9l6.6-.7L12 2z" />
    </svg>
  );
}

export function MatchShareCard({ data, lang, t }) {
  const [photoOk, setPhotoOk] = useState(false);
  const photoSrc = `${import.meta.env.BASE_URL}photos/${data.date}.jpg`;
  const star = data.mixed ? data.highlight : data.mvp;

  // Split the roster: teams when known, otherwise two balanced columns.
  let left, right, leftLabel, rightLabel, leftAccent, rightAccent;
  if (data.teams_known) {
    left = data.winners;
    right = data.losers;
    leftLabel = t("match.winners");
    rightLabel = t("match.losers");
    leftAccent = "bg-pitch-300";
    rightAccent = "bg-rose-400";
  } else {
    const half = Math.ceil(data.players.length / 2);
    left = data.players.slice(0, half);
    right = data.players.slice(half);
    leftLabel = t("match.players");
    rightLabel = " ";
    leftAccent = rightAccent = "bg-white/40";
  }

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-pitch-800 via-pitch-700 to-emerald-700 text-white">
      {/* Brand + date (pr clears the overlay close button) */}
      <header className="flex shrink-0 items-center justify-between gap-3 py-5 pl-5 pr-14">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 drop-shadow" />
          <span className="font-display text-sm font-extrabold tracking-tight">
            Pelada MCR
          </span>
        </div>
        <span className="truncate text-xs font-semibold uppercase tracking-widest text-pitch-100">
          {formatDate(data.date, lang)}
        </span>
      </header>

      {/* Content vertically centred so short rosters stay balanced */}
      <main className="flex min-h-0 flex-1 flex-col justify-center gap-4 pb-1">
        {/* Hero: match photo, or a branded panel when there's none */}
        <div className="relative mx-5 shrink-0 overflow-hidden rounded-2xl bg-pitch-900/50 ring-1 ring-white/15">
          <div className="aspect-[16/10] w-full">
            <img
              src={photoSrc}
              alt=""
              onLoad={() => setPhotoOk(true)}
              onError={() => setPhotoOk(false)}
              className={`h-full w-full object-cover transition-opacity ${photoOk ? "opacity-100" : "opacity-0"}`}
            />
          </div>
          {!photoOk && (
            <Logo className="pointer-events-none absolute right-2 top-1/2 h-28 w-28 -translate-y-1/2 opacity-20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-pitch-900/95 via-pitch-900/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
            <div>
              {data.mixed && (
                <span className="mb-1 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-950">
                  {t("match.mixedTeams")}
                </span>
              )}
              <p className="font-display text-5xl font-extrabold leading-none drop-shadow-lg">
                {data.score}
              </p>
            </div>
            <div className="text-right text-[0.65rem] font-semibold uppercase tracking-wide text-white/80">
              <p>{data.player_count} {t("matches.present")}</p>
              <p className="tabular-nums">{data.total_player_goals} G · {data.total_player_assists} A</p>
            </div>
          </div>
        </div>

        {/* Rosters */}
        <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-1 px-5">
          <div className="min-w-0">
            <h3 className="mb-1.5 font-display text-[0.7rem] font-bold uppercase tracking-widest text-pitch-200">
              {leftLabel} · {left.length}
            </h3>
            <PlayerList players={left} accentClass={leftAccent} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-1.5 font-display text-[0.7rem] font-bold uppercase tracking-widest text-rose-200">
              {rightLabel}{right.length ? ` · ${right.length}` : ""}
            </h3>
            <PlayerList players={right} accentClass={rightAccent} />
          </div>
        </div>

        {/* MVP highlight */}
        {star && (
          <div className="mx-5 flex shrink-0 items-center gap-3 rounded-2xl bg-amber-400/15 px-4 py-3 ring-1 ring-amber-300/30">
            <StarIcon className="h-6 w-6 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-200/80">
                {data.mixed ? t("match.highlight") : t("match.mvp")}
              </p>
              <p className="truncate font-display text-lg font-extrabold leading-tight">{star.name}</p>
            </div>
            <div className="ml-auto shrink-0">
              <StatPair goals={star.goals} assists={star.assists} />
            </div>
          </div>
        )}
      </main>

      {/* Footer brand */}
      <footer className="shrink-0 border-t border-white/10 px-5 py-2.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-pitch-200/70">
        Pelada MCR · Manchester
      </footer>
    </div>
  );
}

// Full-viewport overlay that frames the card at phone proportions and dims the
// page behind it. Closeable via the X button, backdrop click, or Escape.
export function ShareOverlay({ onClose, label, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden shadow-2xl motion-safe:animate-fade-in sm:h-auto sm:aspect-[9/16] sm:max-h-[92vh] sm:rounded-[1.75rem] sm:ring-1 sm:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={label}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
