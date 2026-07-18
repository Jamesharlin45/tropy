"use client"

import { Target, Clock, Calendar } from "lucide-react"
import { useApp } from "./app-provider"
import { StatusChip } from "./status-chip"
import type { MatchTip } from "@/lib/types"

export function BankerCard({ item, onUnlock }: { item: MatchTip; onUnlock?: () => void }) {
  const { t } = useApp()
  const { match, tip, status, stats } = item

  return (
    <article 
      onClick={onUnlock}
      className={`tp-fade-up relative overflow-hidden rounded-[20px] border-2 border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700]/10 to-[var(--tp-surface)] p-4 shadow-[0_0_30px_-5px_rgba(255,215,0,0.2)] backdrop-blur-md transition-all hover:border-[#FFD700] hover:shadow-[0_0_40px_-5px_rgba(255,215,0,0.3)] ${onUnlock ? 'cursor-pointer' : ''}`}
    >
      {/* Banker Badge */}
      <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-3 py-1 font-bold text-[10px] uppercase tracking-widest text-[#4A3500] shadow-sm">
        Banker of the Day 🎯
      </div>

      {/* Top row: Comp & Date / Status */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#FFD700]/20 pb-2 pt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.competitionLogo ? (
            <img src={match.competitionLogo} alt="" className="size-3.5 object-contain shrink-0" />
          ) : (
            <Calendar className="size-3.5 text-[#FFD700]/80 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate text-[11px] font-bold tracking-wider text-[#FFD700]/90 uppercase">
            {match.competition || "Competition"} • {match.dateStr}
          </span>
        </div>
        <StatusChip status={status} />
      </div>

      {/* Main content */}
      <div className={`flex items-center justify-between gap-3 ${onUnlock ? 'opacity-20 blur-[4px] select-none pointer-events-none' : ''}`}>
        {/* Teams (Left) */}
        <div className="flex flex-1 flex-col justify-center min-w-0 pr-2">
           <div className="flex items-center gap-2 mb-2">
             {match.homeLogo ? (
                <img src={match.homeLogo} alt="" className="size-5 object-contain shrink-0" />
             ) : (
                <div className="size-2 rounded-full bg-[var(--tp-text)]/30 shrink-0" />
             )}
             <span className="truncate text-base font-bold text-[var(--tp-text)]">
               {match.homeName}
               {stats?.scoredAvgHome && stats.scoredAvgHome > 2.0 ? <span className="ml-1" title="High scoring team">🔥</span> : null}
               {stats && stats.concededAvgHome !== null && stats.concededAvgHome < 0.8 ? <span className="ml-1" title="Solid defense">🛡️</span> : null}
             </span>
           </div>
           <div className="flex items-center gap-2">
             {match.awayLogo ? (
                <img src={match.awayLogo} alt="" className="size-5 object-contain shrink-0" />
             ) : (
                <div className="size-2 rounded-full bg-[var(--tp-text)]/30 shrink-0" />
             )}
             <span className="truncate text-base font-bold text-[var(--tp-text)]">
               {match.awayName}
               {stats?.scoredAvgAway && stats.scoredAvgAway > 2.0 ? <span className="ml-1" title="High scoring team">🔥</span> : null}
               {stats && stats.concededAvgAway !== null && stats.concededAvgAway < 0.8 ? <span className="ml-1" title="Solid defense">🛡️</span> : null}
             </span>
           </div>
        </div>

        {/* Tip & Time/Score (Right) */}
        <div className="flex shrink-0 flex-col items-end gap-1.5 border-l border-[#FFD700]/20 pl-4">
          {status !== "pending" && stats?.homeGoals !== null && stats?.awayGoals !== null ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--tp-bg-2)] border border-[var(--tp-border)]">
              <span className="text-base font-black tracking-widest text-[var(--tp-text)]">
                {stats.homeGoals} - {stats.awayGoals}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs font-mono font-medium text-[var(--tp-muted)]">
               <Clock className="size-3.5" aria-hidden="true" />
               {match.kickoffLabel || "--:--"}
            </div>
          )}
          {tip ? (
             <div className="flex flex-col items-end mt-1">
               <span className="text-[11px] font-black text-[#FFD700] uppercase tracking-wider">{tip.market}</span>
               <span className="rounded bg-[#FFD700]/10 px-2.5 py-0.5 mt-0.5 font-mono text-base font-black text-[#FFD700]">
                 @{tip.odds.toFixed(2)}
               </span>
             </div>
          ) : (
            <span className="text-xs text-[var(--tp-muted)]">{t("card.noStats")}</span>
          )}
        </div>
      </div>

      {onUnlock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FFD700]/20 text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)] mb-2 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <span className="rounded-full bg-[#FFD700] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4A3500]">
            {t("card.unlockToView")}
          </span>
        </div>
      )}

      {/* Footer: Confidence */}
      {tip && (
        <div className="mt-4 pt-3 border-t border-[#FFD700]/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="size-4 text-[#FFD700]" />
            <span className="text-xs font-bold text-[#FFD700]/90">
               {tip.confidence}% Confidence
            </span>
          </div>
          <span className="text-[10px] text-[var(--tp-muted)] truncate max-w-[50%] text-right">
             {tip.basedOn.join(", ")}
          </span>
        </div>
      )}
    </article>
  )
}
