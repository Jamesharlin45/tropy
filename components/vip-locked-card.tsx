"use client"

import { Lock, Sparkles } from "lucide-react"
import { useApp } from "./app-provider"
import type { MatchTip } from "@/lib/types"

const PARTICLES = [
  { top: "20%", left: "15%", delay: "0s" },
  { top: "65%", left: "75%", delay: "0.5s" },
  { top: "45%", left: "50%", delay: "0.9s" },
]

export function VipLockedCard({
  item,
  onUnlock,
}: {
  item: MatchTip
  onUnlock: () => void
}) {
  const { t } = useApp()
  const { match, tip, stats } = item

  return (
    <article
      className="tp-fade-up relative overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-2.5 shadow-md backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/60 hover:shadow-lg"
    >
      {/* Competition row */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.competitionLogo ? (
            <img src={match.competitionLogo} alt="" className="size-3 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : null}
          <span className="truncate text-[9px] font-semibold tracking-wider text-[var(--tp-muted)] uppercase">
            {match.competition || "VIP Match"}
          </span>
        </div>
        <span className="shrink-0 rounded bg-[var(--tp-accent)]/20 px-1.5 py-0.5 text-[8px] font-black text-[var(--tp-accent)] uppercase tracking-wider">
          VIP
        </span>
      </div>

      {/* Teams row — always visible */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {match.homeLogo ? (
              <img src={match.homeLogo} alt="" className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : <div className="size-1.5 rounded-full bg-[var(--tp-accent)]/40 shrink-0" />}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.homeName}
              {stats?.scoredAvgHome && stats.scoredAvgHome > 2.0 && <span className="ml-0.5 text-[10px]">🔥</span>}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {match.awayLogo ? (
              <img src={match.awayLogo} alt="" className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : <div className="size-1.5 rounded-full bg-[var(--tp-border)] shrink-0" />}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.awayName}
              {stats?.scoredAvgAway && stats.scoredAvgAway > 2.0 && <span className="ml-0.5 text-[10px]">🔥</span>}
            </span>
          </div>
        </div>
        {/* Kickoff time */}
        <div className="shrink-0 border-l border-[var(--tp-border)]/50 pl-2.5 text-right">
          <div className="text-[10px] font-mono text-[var(--tp-muted)]">{match.kickoffLabel || "--:--"}</div>
          {/* Tip preview — blurred */}
          {tip && (
            <div className="mt-0.5 blur-[5px] select-none pointer-events-none">
              <span className="text-[9px] font-bold text-[var(--tp-muted)] uppercase">{tip.market}</span>
              <div className="rounded bg-[var(--tp-accent)]/15 px-1.5 py-0.5 font-mono text-xs font-black text-[var(--tp-accent)]">
                @{tip.odds.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lock CTA */}
      <div
        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--tp-accent)]/20 bg-[var(--tp-accent)]/5 px-2.5 py-1.5"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Lock className="size-3 shrink-0 text-[var(--tp-accent)]" aria-hidden="true" />
          <p className="text-[10px] text-[var(--tp-muted)] truncate">{t("vip.locked.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          className="tp-focus shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--tp-accent)", color: "var(--tp-on-accent)" }}
        >
          <Sparkles className="size-2.5" aria-hidden="true" />
          {t("vip.unlock")}
        </button>
      </div>

      {/* Animated particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span key={i} className="tp-particle absolute size-1 rounded-full"
            style={{ top: p.top, left: p.left, animationDelay: p.delay, backgroundColor: "var(--tp-accent)", opacity: 0.3 }}
          />
        ))}
      </div>
    </article>
  )
}


