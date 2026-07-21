"use client"

import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { useApp } from "@/components/app-provider"
import { useHistory } from "@/hooks/use-tips"
import { dateWindow, todayStr } from "@/lib/dates"
import { TipCard } from "@/components/tip-card"
import { SectionHeader } from "@/components/section-header"
import { DataAnalysis } from "@/components/data-analysis"
import { LoadingState, EmptyState, ErrorState } from "@/components/states"
import type { MatchTip } from "@/lib/types"

export function HistoryView({ query }: { query: string }) {
  const { t } = useApp()
  // Look back 30 days for resolved tips.
  const dates = useMemo(() => dateWindow(todayStr(), 30, 0).reverse(), [])
  const { items, error, isLoading, retry } = useHistory(dates)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it: MatchTip) =>
      [it.match.homeName, it.match.awayName, it.match.competition]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [items, query])

  const { won, lost, total, rate } = useMemo(() => {
    const w = items.filter((i) => i.status === "won").length
    const l = items.filter((i) => i.status === "lost").length
    const tot = w + l
    return { won: w, lost: l, total: items.length, rate: tot ? Math.round((w / tot) * 100) : 0 }
  }, [items])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={retry} />

  return (
    <section className="tp-fade-up space-y-8">
      {/* win-rate summary */}
      <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--tp-won)]/15 text-[var(--tp-won)]">
            <TrendingUp className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-xl font-bold tabular-nums text-[var(--tp-text)]">
              {t("history.hitRate", { rate })}
            </p>
            <p className="text-xs text-[var(--tp-muted)]">
              {t("history.summary", { won, lost, total })}
            </p>
          </div>
        </div>
      </div>

      {/* Data Analysis Tables */}
      <DataAnalysis items={filtered} loading={isLoading} />

      {/* Card Grid View */}
      <div>
        <SectionHeader eyebrowKey="section.history.eyebrow" count={filtered.length} />

        {filtered.length === 0 ? (
          <EmptyState noResults={!!query.trim() && items.length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <TipCard key={`${item.match.id}-${item.match.dateStr}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
