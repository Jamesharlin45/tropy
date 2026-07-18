"use client"

import { Bookmark, Clock, Calendar } from "lucide-react"
import { useApp } from "./app-provider"
import { StatusChip } from "./status-chip"
import { RawData } from "./raw-data"
import type { MatchTip } from "@/lib/types"

export function TipCard({ item }: { item: MatchTip }) {
  const { t, isTracked, toggleTrack } = useApp()
  const { match, tip, status, stats } = item
  const tracked = isTracked(match.id)

  return (
    <article className="tp-fade-up relative overflow-hidden rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-3 shadow-lg backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/50">
      
      {/* Top row: Comp & Date / Status */}
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-[var(--tp-border)]/50 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.competitionLogo ? (
            <img src={match.competitionLogo} alt="" className="size-3 object-contain shrink-0" />
          ) : (
            <Calendar className="size-3 text-[var(--tp-muted)] shrink-0" aria-hidden="true" />
          )}
          <span className="truncate text-[10px] font-semibold tracking-wider text-[var(--tp-muted)] uppercase">
            {match.competition || "Competition"} • {match.dateStr}
          </span>
        </div>
        <StatusChip status={status} />
      </div>

      {/* Main content: Horizontal Layout */}
      <div className="flex items-center justify-between gap-3">
        {/* Teams (Left) */}
        <div className="flex flex-1 flex-col justify-center min-w-0 pr-2">
           <div className="flex items-center gap-2 mb-1.5">
             {match.homeLogo ? (
                <img src={match.homeLogo} alt="" className="size-4 object-contain shrink-0" />
             ) : (
                <div className="size-1.5 rounded-full bg-[var(--tp-text)]/30 shrink-0" />
             )}
             <span className="truncate text-sm font-bold text-[var(--tp-text)]">
               {match.homeName}
               {stats?.scoredAvgHome && stats.scoredAvgHome > 2.0 ? <span className="ml-1" title="High scoring team">🔥</span> : null}
               {stats?.concededAvgHome !== null && stats.concededAvgHome < 0.8 ? <span className="ml-1" title="Solid defense">🛡️</span> : null}
             </span>
           </div>
           <div className="flex items-center gap-2">
             {match.awayLogo ? (
                <img src={match.awayLogo} alt="" className="size-4 object-contain shrink-0" />
             ) : (
                <div className="size-1.5 rounded-full bg-[var(--tp-text)]/30 shrink-0" />
             )}
             <span className="truncate text-sm font-bold text-[var(--tp-text)]">
               {match.awayName}
               {stats?.scoredAvgAway && stats.scoredAvgAway > 2.0 ? <span className="ml-1" title="High scoring team">🔥</span> : null}
               {stats?.concededAvgAway !== null && stats.concededAvgAway < 0.8 ? <span className="ml-1" title="Solid defense">🛡️</span> : null}
             </span>
           </div>
        </div>

        {/* Tip & Time/Score (Right) */}
        <div className="flex shrink-0 flex-col items-end gap-1.5 border-l border-[var(--tp-border)]/50 pl-3">
          {status !== "pending" && stats?.homeGoals !== null && stats?.awayGoals !== null ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--tp-bg-2)] border border-[var(--tp-border)]">
              <span className="text-[14px] font-black tracking-widest text-[var(--tp-text)]">
                {stats.homeGoals} - {stats.awayGoals}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-[var(--tp-muted)]">
               <Clock className="size-3" aria-hidden="true" />
               {match.kickoffLabel || "--:--"}
            </div>
          )}
          {tip ? (
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-[var(--tp-muted)] uppercase tracking-wider">{tip.market}</span>
               <span className="rounded bg-[var(--tp-accent)]/10 px-2 py-0.5 font-mono text-sm font-black text-[var(--tp-accent)]">
                 @{tip.odds.toFixed(2)}
               </span>
             </div>
          ) : (
            <span className="text-[10px] text-[var(--tp-muted)]">{t("card.noStats")}</span>
          )}
        </div>
      </div>

      {/* Footer: Track + Details */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-[var(--tp-border)]/30">
        <button
          type="button"
          onClick={() => toggleTrack(match.id)}
          aria-pressed={tracked}
          aria-label={tracked ? t("card.tracked") : t("card.track")}
          className="tp-focus flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors"
          style={{
            color: tracked ? "var(--tp-on-accent)" : "var(--tp-muted)",
            backgroundColor: tracked ? "var(--tp-accent)" : "transparent",
          }}
        >
          <Bookmark
            className="size-3.5"
            aria-hidden="true"
            fill={tracked ? "currentColor" : "none"}
          />
        </button>
        {tip ? (
          <div className="truncate text-[10px] text-[var(--tp-muted)]">
             {tip.confidence}% • {tip.basedOn.join(", ")}
          </div>
        ) : null}
      </div>

      {stats?.raw || match.raw ? (
        <details className="mt-2 group">
          <summary className="cursor-pointer text-[10px] font-bold text-[var(--tp-accent)] uppercase tracking-wider select-none hover:opacity-80 transition-opacity">
            Deep Analysis ▾
          </summary>
          <div className="mt-2 pt-2 border-t border-[var(--tp-border)]/30">
            <RawData data={stats?.raw ?? match.raw} />
          </div>
        </details>
      ) : null}
    </article>
  )
}
