"use client"

import { Bookmark, Clock, Calendar, TrendingUp } from "lucide-react"
import { useApp } from "./app-provider"
import { StatusChip } from "./status-chip"
import type { MatchTip } from "@/lib/types"

/** Derive the 5 best statistical picks from raw match data */
function getBestPicks(raw: Record<string, unknown>): { label: string; value: string; pct: number }[] {
  const picks: { label: string; value: string; pct: number }[] = []

  const add = (label: string, value: string, pct: number | null | undefined) => {
    if (pct !== null && pct !== undefined && !isNaN(Number(pct))) {
      picks.push({ label, value, pct: Number(pct) })
    }
  }

  add("Over 2.5 Goals", `${raw.o25_potential ?? "—"}%`, raw.o25_potential as number)
  add("Under 2.5 Goals", `${raw.u25_potential ?? "—"}%`, raw.u25_potential as number)
  add("BTTS", `${raw.btts_potential ?? "—"}%`, raw.btts_potential as number)
  add("Over 1.5 Goals", `${raw.o15_potential ?? "—"}%`, raw.o15_potential as number)
  add("Over 3.5 Goals", `${raw.o35_potential ?? "—"}%`, raw.o35_potential as number)
  add("Over 0.5 Goals", `${raw.o05_potential ?? "—"}%`, raw.o05_potential as number)
  add("HT Over 0.5", `${raw.o05HT_potential ?? "—"}%`, raw.o05HT_potential as number)
  add("Corners >8.5", `${raw.corners_o85_potential ?? "—"}%`, raw.corners_o85_potential as number)

  // Sort by confidence descending and take top 5
  return picks.sort((a, b) => b.pct - a.pct).slice(0, 5)
}

function ConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444"
  return (
    <div className="h-1 w-full rounded-full bg-[var(--tp-border)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function TipCard({ item }: { item: MatchTip }) {
  const { t, isTracked, toggleTrack } = useApp()
  const { match, tip, status, stats } = item
  const tracked = isTracked(match.id)
  const rawObj = (stats?.raw ?? match.raw) as Record<string, unknown> | null
  const bestPicks = rawObj ? getBestPicks(rawObj) : []

  return (
    <article className="tp-fade-up relative overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-2.5 shadow-md backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/50 hover:shadow-lg">

      {/* Top row: Comp & Status */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.competitionLogo ? (
            <img
              src={match.competitionLogo}
              alt=""
              className="size-3 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <Calendar className="size-2.5 text-[var(--tp-muted)] shrink-0" aria-hidden="true" />
          )}
          <span className="truncate text-[9px] font-semibold tracking-wider text-[var(--tp-muted)] uppercase">
            {match.competition || "Competition"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusChip status={status} />
          <button
            type="button"
            onClick={() => toggleTrack(match.id)}
            aria-pressed={tracked}
            aria-label={tracked ? t("card.tracked") : t("card.track")}
            className="tp-focus flex items-center rounded p-0.5 transition-colors"
            style={{ color: tracked ? "var(--tp-accent)" : "var(--tp-muted)" }}
          >
            <Bookmark className="size-3" aria-hidden="true" fill={tracked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Main: Teams (left) + Tip (right) */}
      <div className="flex items-center gap-2">
        {/* Teams */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {match.homeLogo ? (
              <img
                src={match.homeLogo}
                alt=""
                className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="size-1.5 rounded-full bg-[var(--tp-accent)]/40 shrink-0" />
            )}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.homeName}
              {stats?.scoredAvgHome && stats.scoredAvgHome > 2.0 ? <span className="ml-0.5 text-[10px]">🔥</span> : null}
              {stats && stats.concededAvgHome !== null && stats.concededAvgHome < 0.8 ? <span className="ml-0.5 text-[10px]">🛡️</span> : null}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {match.awayLogo ? (
              <img
                src={match.awayLogo}
                alt=""
                className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="size-1.5 rounded-full bg-[var(--tp-border)] shrink-0" />
            )}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.awayName}
              {stats?.scoredAvgAway && stats.scoredAvgAway > 2.0 ? <span className="ml-0.5 text-[10px]">🔥</span> : null}
              {stats && stats.concededAvgAway !== null && stats.concededAvgAway < 0.8 ? <span className="ml-0.5 text-[10px]">🛡️</span> : null}
            </span>
          </div>
        </div>

        {/* Tip + Time */}
        <div className="flex shrink-0 flex-col items-end gap-1 border-l border-[var(--tp-border)]/50 pl-2.5">
          {status !== "pending" && stats?.homeGoals !== null && stats?.awayGoals !== null ? (
            <span className="font-black text-xs tracking-widest text-[var(--tp-text)]">
              {stats.homeGoals}–{stats.awayGoals}
            </span>
          ) : (
            <div className="flex items-center gap-0.5 text-[10px] font-mono text-[var(--tp-muted)]">
              <Clock className="size-2.5" aria-hidden="true" />
              {match.kickoffLabel || "--:--"}
            </div>
          )}
          {tip ? (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[var(--tp-muted)] uppercase">{tip.market}</span>
              <span className="rounded bg-[var(--tp-accent)]/15 px-1.5 py-0.5 font-mono text-xs font-black text-[var(--tp-accent)]">
                @{tip.odds.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-[var(--tp-muted)]">No tip</span>
          )}
          {tip && (
            <span className="text-[9px] font-semibold text-[var(--tp-muted)]">{tip.confidence}%</span>
          )}
        </div>
      </div>

      {/* Best Picks — collapsible */}
      {bestPicks.length > 0 && (
        <details className="mt-2 group">
          <summary className="flex cursor-pointer select-none items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--tp-accent)] hover:opacity-80 transition-opacity">
            <TrendingUp className="size-2.5" aria-hidden="true" />
            5 Best Picks ▾
          </summary>
          <div className="mt-2 space-y-1.5 pt-1.5 border-t border-[var(--tp-border)]/30">
            {bestPicks.map((pick) => (
              <div key={pick.label} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-[var(--tp-text)] truncate">{pick.label}</span>
                  <span className={`text-[10px] font-black shrink-0 ${
                    pick.pct >= 70 ? "text-green-400" : pick.pct >= 50 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {Math.round(pick.pct)}%
                  </span>
                </div>
                <ConfidenceBar pct={pick.pct} />
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  )
}
