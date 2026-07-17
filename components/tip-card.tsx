"use client"

import { Bookmark, Clock, Calendar } from "lucide-react"
import { useApp } from "./app-provider"
import { StatusChip } from "./status-chip"
import { RawData } from "./raw-data"
import type { MatchTip } from "@/lib/types"

function TeamPill({ name }: { name: string }) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg-2)] px-3 py-2 text-center">
      <span className="line-clamp-2 text-sm font-semibold leading-tight text-[var(--tp-text)]">
        {name}
      </span>
    </div>
  )
}

export function TipCard({ item }: { item: MatchTip }) {
  const { t, isTracked, toggleTrack } = useApp()
  const { match, tip, status, stats } = item
  const tracked = isTracked(match.id)

  return (
    <article className="tp-fade-up relative overflow-hidden rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]">
      {/* header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {match.competition ? (
            <p className="truncate text-xs font-medium text-[var(--tp-muted)]">
              {match.competition}
            </p>
          ) : null}
          <p className="flex items-center gap-1 font-mono text-[11px] text-[var(--tp-muted)]">
            <Calendar className="size-3" aria-hidden="true" />
            {match.dateStr}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleTrack(match.id)}
          aria-pressed={tracked}
          aria-label={tracked ? t("card.tracked") : t("card.track")}
          className="tp-focus inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: tracked ? "var(--tp-on-accent)" : "var(--tp-accent)",
            backgroundColor: tracked ? "var(--tp-accent)" : "transparent",
            borderColor: "color-mix(in srgb, var(--tp-accent) 45%, transparent)",
          }}
        >
          <Bookmark
            className="size-3"
            aria-hidden="true"
            fill={tracked ? "currentColor" : "none"}
          />
          {tracked ? t("card.tracked") : t("card.track")}
        </button>
      </div>

      {/* teams */}
      <div className="flex items-stretch gap-2">
        <TeamPill name={match.homeName} />
        <div className="flex items-center">
          <span className="rounded-full bg-[var(--tp-surface-2)] px-2 py-1 font-display text-xs font-bold tracking-widest text-[var(--tp-muted)]">
            {t("card.vs")}
          </span>
        </div>
        <TeamPill name={match.awayName} />
      </div>

      {/* footer: kickoff + tip + status */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-sm tabular-nums text-[var(--tp-text)]">
            <Clock className="size-3.5 text-[var(--tp-muted)]" aria-hidden="true" />
            {match.kickoffLabel || "--:--"}
          </span>
          {tip ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-[var(--tp-text)]">
                {tip.market}
              </span>
              <span
                className="rounded-md px-1.5 py-0.5 font-mono text-sm font-bold tabular-nums"
                style={{
                  color: "var(--tp-accent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--tp-accent) 14%, transparent)",
                }}
              >
                @{tip.odds.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-[var(--tp-muted)]">{t("card.noStats")}</span>
          )}
        </div>
        <StatusChip status={status} />
      </div>

      {tip ? (
        <p className="mt-2 text-[11px] text-[var(--tp-muted)]">
          {t("card.basedOn")}: {tip.basedOn.join(" · ")} · {tip.confidence}%
        </p>
      ) : null}

      {(!stats || stats.isRaw) && (match.isRaw || (stats && stats.isRaw)) ? (
        <RawData data={stats?.raw ?? match.raw} />
      ) : null}
    </article>
  )
}
