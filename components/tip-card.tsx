"use client"

import { useState } from "react"
import { Bookmark, Clock, Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { useApp } from "./app-provider"
import { StatusChip } from "./status-chip"
import type { MatchTip } from "@/lib/types"

// ─── Deep Analysis Picks ──────────────────────────────────────────────────────
interface Pick {
  label: string
  shortLabel: string
  pct: number
  isRecommended?: boolean
}

function getPredictionPicks(raw: Record<string, unknown>): Pick[] {
  const picks: Pick[] = []

  const add = (label: string, shortLabel: string, val: unknown) => {
    const pct = typeof val === "number" ? val : val != null ? Number(val) : NaN
    if (!isNaN(pct) && pct > 0) {
      picks.push({ label, shortLabel, pct: Math.round(pct) })
    }
  }

  // Goal markets — these are the real FootyStats prediction fields
  add("Over 2.5 Goals", "O2.5", raw.o25_potential ?? raw.over25_potential)
  add("Under 2.5 Goals", "U2.5", raw.u25_potential ?? raw.under25_potential)
  add("Over 1.5 Goals", "O1.5", raw.o15_potential ?? raw.over15_potential)
  add("Over 3.5 Goals", "O3.5", raw.o35_potential ?? raw.over35_potential)
  add("Over 0.5 Goals", "O0.5", raw.o05_potential ?? raw.over05_potential)
  add("Both Teams Score", "BTTS", raw.btts_potential ?? raw.bttsPotential)
  add("HT Over 0.5", "HT O0.5", raw.o05HT_potential ?? raw.over05ht_potential)
  add("Corners Over 8.5", "Crn O8.5", raw.corners_o85_potential ?? raw.corners_o85)
  add("Corners Over 9.5", "Crn O9.5", raw.corners_o95_potential ?? raw.corners_o95)

  // Form-based signals
  const homePpg = typeof raw.home_ppg === "number" ? raw.home_ppg : null
  const awayPpg = typeof raw.away_ppg === "number" ? raw.away_ppg : null
  if (homePpg !== null && homePpg > 0) {
    // Convert PPG (0-3 scale) to a percentage-like signal (max 3 = 100%)
    add("Home Win (form)", "Home Win", Math.min(100, (homePpg / 3) * 100))
  }
  if (awayPpg !== null && awayPpg > 0) {
    add("Away Win (form)", "Away Win", Math.min(100, (awayPpg / 3) * 100))
  }

  // Sort by confidence descending; mark the top pick as recommended
  picks.sort((a, b) => b.pct - a.pct)
  if (picks.length > 0) picks[0].isRecommended = true

  return picks.slice(0, 6) // top 6 picks max
}

function ConfidenceBar({ pct, recommended }: { pct: number; recommended?: boolean }) {
  const color = recommended
    ? "#a855f7"  // purple for top pick
    : pct >= 70
    ? "#22c55e"
    : pct >= 50
    ? "#f59e0b"
    : "#ef4444"
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--tp-border)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── TipCard Component ────────────────────────────────────────────────────────
export function TipCard({ item }: { item: MatchTip }) {
  const { t, isTracked, toggleTrack } = useApp()
  const { match, tip, status, stats } = item
  const tracked = isTracked(match.id)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Use stats.raw first (has all prediction fields from DB), then match.raw as fallback
  const rawObj = (stats?.raw ?? match.raw) as Record<string, unknown> | null
  const picks = rawObj ? getPredictionPicks(rawObj) : []

  return (
    <article className="tp-fade-up relative overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-2.5 shadow-md backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/50 hover:shadow-lg">

      {/* Top row: Competition & Status */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.competitionLogo ? (
            <img
              src={match.competitionLogo}
              alt=""
              className="size-3 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
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
              <img src={match.homeLogo} alt="" className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : (
              <div className="size-1.5 rounded-full bg-[var(--tp-accent)]/40 shrink-0" />
            )}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.homeName}
              {stats?.scoredAvgHome && stats.scoredAvgHome > 2.0 && <span className="ml-0.5 text-[10px]">🔥</span>}
              {stats?.concededAvgHome !== null && stats?.concededAvgHome !== undefined && stats.concededAvgHome < 0.8 && <span className="ml-0.5 text-[10px]">🛡️</span>}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {match.awayLogo ? (
              <img src={match.awayLogo} alt="" className="size-4 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : (
              <div className="size-1.5 rounded-full bg-[var(--tp-border)] shrink-0" />
            )}
            <span className="truncate text-xs font-bold text-[var(--tp-text)]">
              {match.awayName}
              {stats?.scoredAvgAway && stats.scoredAvgAway > 2.0 && <span className="ml-0.5 text-[10px]">🔥</span>}
              {stats?.concededAvgAway !== null && stats?.concededAvgAway !== undefined && stats.concededAvgAway < 0.8 && <span className="ml-0.5 text-[10px]">🛡️</span>}
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
            <span className={`text-[9px] font-black ${tip.confidence >= 70 ? "text-green-400" : tip.confidence >= 50 ? "text-amber-400" : "text-[var(--tp-muted)]"}`}>
              {tip.confidence}%
            </span>
          )}
        </div>
      </div>

      {/* Deep Analysis — collapsible */}
      {picks.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex w-full cursor-pointer items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--tp-accent)] hover:opacity-80 transition-opacity"
          >
            <TrendingUp className="size-2.5" aria-hidden="true" />
            <span>Deep Analysis</span>
            {showAnalysis ? <ChevronUp className="size-2.5 ml-auto" /> : <ChevronDown className="size-2.5 ml-auto" />}
          </button>

          {showAnalysis && (
            <div className="mt-2 space-y-2 pt-1.5 border-t border-[var(--tp-border)]/30">
              {picks.map((pick) => (
                <div key={pick.label} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      {pick.isRecommended && (
                        <span className="shrink-0 rounded bg-purple-500/20 px-1 py-0.5 text-[8px] font-black text-purple-400 uppercase tracking-wider">
                          Best
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-[var(--tp-text)] truncate">{pick.label}</span>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 ${
                      pick.pct >= 70 ? "text-green-400" : pick.pct >= 50 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {pick.pct}%
                    </span>
                  </div>
                  <ConfidenceBar pct={pick.pct} recommended={pick.isRecommended} />
                </div>
              ))}
              {/* Prediction disclaimer */}
              <p className="text-[8px] text-[var(--tp-muted)] opacity-60">Statistical predictions only — not financial advice.</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
