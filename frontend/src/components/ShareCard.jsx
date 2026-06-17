// Screenshot-ready "photo mode" share card for a match.
// A self-contained, mobile-viewport-sized card (no scroll) built to be
// screenshotted and shared. Rendered inside ShareOverlay. The layout is a
// fixed flex column so it always fits one screen; long player lists are
// split across two columns and stay compact.
//
// Designed to be reused for the player profile later: ShareOverlay + a card
// body following the same header / hero / body / highlight / footer rhythm.

import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { Logo, Avatar } from "./ui";
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

// --- Player profile share card -----------------------------------------

function StatBox({ value, label, accent = "" }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2.5 text-center ring-1 ring-white/10">
      <p className={`font-display text-2xl font-extrabold leading-none tabular-nums ${accent}`}>
        {value}
      </p>
      <p className="mt-1 text-[0.58rem] font-semibold uppercase tracking-wide text-pitch-200/80">
        {label}
      </p>
    </div>
  );
}

function FormDots({ form, t }) {
  const tone = {
    W: "bg-pitch-400 text-pitch-950",
    L: "bg-rose-400 text-rose-950",
    D: "bg-slate-300 text-slate-800",
  };
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-md font-display text-xs font-bold ${tone[r] || "bg-white/20"}`}
        >
          {t(`results.${r}`)}
        </span>
      ))}
    </div>
  );
}

export function PlayerShareCard({ data, lang, t }) {
  const total = data.wins + data.draws + data.losses || 1;
  const seg = (n, cls) =>
    n > 0 ? <div className={cls} style={{ width: `${(n / total) * 100}%` }} /> : null;

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-pitch-800 via-pitch-700 to-emerald-700 text-white">
      {/* Brand + ranks */}
      <header className="flex shrink-0 items-center justify-between gap-3 py-5 pl-5 pr-14">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 drop-shadow" />
          <span className="font-display text-sm font-extrabold tracking-tight">Pelada MCR</span>
        </div>
        {data.goals_rank && (
          <span className="text-xs font-semibold uppercase tracking-widest text-pitch-100">
            #{data.goals_rank} {t("common.goals")}
          </span>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-5 pb-1">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <Avatar name={data.name} size="xl" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold leading-tight">
              <span className="truncate">{data.name}</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-pitch-100">
              {data.games} {t("common.games").toLowerCase()}
              {data.attendance_pct != null && <> · {data.attendance_pct}% {t("profile.attendance").toLowerCase()}</>}
              {data.is_mensalista && <> · {t("common.season")}</>}
            </p>
          </div>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox value={data.goals} label={t("common.goals")} />
          <StatBox value={data.assists} label={t("common.assists")} accent="text-amber-300" />
          <StatBox value={data.ga} label={t("common.ga")} />
          <StatBox value={`${Math.round(data.win_pct)}%`} label={t("common.winPct")} accent="text-pitch-300" />
          <StatBox value={data.goals_per_game.toFixed(1)} label={`${t("common.goals")}/${t("common.games").slice(0, 4).toLowerCase()}`} />
          <StatBox value={data.ga_per_game.toFixed(1)} label={`${t("common.ga")}/${t("common.games").slice(0, 4).toLowerCase()}`} />
        </div>

        {/* W / L / D */}
        <div>
          <div className="mb-1.5 flex justify-between text-[0.65rem] font-bold uppercase tracking-widest">
            <span className="text-pitch-200">{data.wins} {t("common.wins")}</span>
            <span className="text-slate-200">{data.draws} {t("common.draws")}</span>
            <span className="text-rose-200">{data.losses} {t("common.losses")}</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
            {seg(data.wins, "bg-pitch-400")}
            {seg(data.draws, "bg-slate-300")}
            {seg(data.losses, "bg-rose-400")}
          </div>
        </div>

        {/* Recent form */}
        {data.form?.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.7rem] font-bold uppercase tracking-widest text-pitch-200">
              {t("form.title") || "Form"}
            </span>
            <FormDots form={data.form} t={t} />
          </div>
        )}

        {/* Best game */}
        {data.best_game && (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-400/15 px-4 py-3 ring-1 ring-amber-300/30">
            <StarIcon className="h-6 w-6 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-200/80">
                {t("profile.bestGame")}
              </p>
              <p className="truncate font-display text-base font-extrabold leading-tight">
                {formatDate(data.best_game.date, lang)}
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <StatPair goals={data.best_game.goals} assists={data.best_game.assists} />
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-white/10 px-5 py-2.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-pitch-200/70">
        Pelada MCR · Manchester
      </footer>
    </div>
  );
}

// Full-viewport overlay that frames the card at phone proportions and dims the
// page behind it. The card itself (cardRef) is captured to a PNG for sharing,
// so the close/save chrome lives outside it and never ends up in the image.
// Closeable via the X button, backdrop click, or Escape.
export function ShareOverlay({ onClose, label, filename, shareTitle, saveLabel, busyLabel, children }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function saveOrShare() {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      // Two passes: web fonts/images sometimes resolve only on the second run.
      await htmlToImage.toBlob(node, { pixelRatio: 2, cacheBust: true });
      const blob = await htmlToImage.toBlob(node, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error("empty image");
      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      // Native share sheet (mobile) → WhatsApp etc.; fall back to a download.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle });
          return;
        } catch (err) {
          if (err?.name === "AbortError") return; // user dismissed
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Share image failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="relative h-[100dvh] w-full max-w-[430px] motion-safe:animate-fade-in sm:h-auto sm:aspect-[9/16] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={cardRef}
          className="h-full w-full overflow-hidden bg-pitch-800 shadow-2xl sm:rounded-[1.75rem] sm:ring-1 sm:ring-white/10"
        >
          {children}
        </div>

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

        <button
          type="button"
          onClick={saveOrShare}
          disabled={busy}
          className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-pitch-800 shadow-lg transition hover:bg-pitch-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
        >
          {busy ? (
            <svg className="h-4 w-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.2-8.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v13m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
          {busy ? busyLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}
