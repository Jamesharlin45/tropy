"use client"

import { useMemo } from "react"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useApp } from "@/components/app-provider"
import type { MatchTip } from "@/lib/types"

interface DataAnalysisProps {
  items: MatchTip[]
  loading?: boolean
}

export function DataAnalysis({ items, loading }: DataAnalysisProps) {
  const { t } = useApp()

  const stats = useMemo(() => {
    if (!items.length) return null

    const won = items.filter(i => i.status === "won").length
    const lost = items.filter(i => i.status === "lost").length
    const pending = items.filter(i => i.status === "pending").length
    const total = items.length
    const winRate = total ? Math.round((won / total) * 100) : 0

    // Group by league
    const byLeague = items.reduce((acc: Record<string, any>, item) => {
      const league = item.match.competition
      if (!acc[league]) {
        acc[league] = { won: 0, lost: 0, pending: 0, total: 0 }
      }
      acc[league].total++
      if (item.status === "won") acc[league].won++
      else if (item.status === "lost") acc[league].lost++
      else acc[league].pending++
      return acc
    }, {})

    return { won, lost, pending, total, winRate, byLeague }
  }, [items])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[var(--tp-bg-2)] rounded-lg" />
        <div className="h-64 bg-[var(--tp-bg-2)] rounded-lg" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-8 text-center text-[var(--tp-muted)]">
        <p>{t("empty.title")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4">
          <p className="text-xs font-medium text-[var(--tp-muted)] uppercase tracking-wide">
            Win Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--tp-accent)]">{stats.winRate}%</p>
        </div>

        <div className="rounded-lg border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4">
          <p className="text-xs font-medium text-[var(--tp-muted)] uppercase tracking-wide">
            Won
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[var(--tp-won)]">
            <ArrowUpRight className="size-5" />
            {stats.won}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4">
          <p className="text-xs font-medium text-[var(--tp-muted)] uppercase tracking-wide">
            Lost
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[var(--tp-lost)]">
            <ArrowDownLeft className="size-5" />
            {stats.lost}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4">
          <p className="text-xs font-medium text-[var(--tp-muted)] uppercase tracking-wide">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--tp-text)]">{stats.total}</p>
        </div>
      </div>

      {/* League Breakdown Table */}
      <div className="rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--tp-border)] bg-[var(--tp-bg-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--tp-text)]">
                  League
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--tp-text)]">
                  Won
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--tp-text)]">
                  Lost
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--tp-text)]">
                  Pending
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--tp-text)]">
                  Win %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tp-border)]">
              {Object.entries(stats.byLeague).map(([league, data]: [string, any]) => {
                const leagueWinRate = data.total ? Math.round((data.won / data.total) * 100) : 0
                return (
                  <tr key={league} className="hover:bg-[var(--tp-bg-2)] transition-colors">
                    <td className="px-4 py-3 text-[var(--tp-text)] font-medium">
                      {league}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--tp-won)] font-semibold">
                      {data.won}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--tp-lost)] font-semibold">
                      {data.lost}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--tp-muted)]">
                      {data.pending}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--tp-accent)]">
                      {leagueWinRate}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Match Rows */}
      <div className="rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-[var(--tp-border)] bg-[var(--tp-bg-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--tp-text)]">
                  Match
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--tp-text)]">
                  League
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--tp-text)]">
                  Tip
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--tp-text)]">
                  Odds
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--tp-text)]">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--tp-text)]">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tp-border)]">
              {items.map((item) => (
                <tr
                  key={`${item.match.id}-${item.match.dateStr}`}
                  className="hover:bg-[var(--tp-bg-2)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--tp-text)]">
                    <div className="font-semibold">{item.match.homeName}</div>
                    <div className="text-[var(--tp-muted)]">vs {item.match.awayName}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--tp-muted)]">
                    {item.match.competition}
                  </td>
                  <td className="px-4 py-3 text-[var(--tp-text)]">
                    {item.tip}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-[var(--tp-accent)]">
                    {item.odds}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "won"
                          ? "bg-[var(--tp-won)]/20 text-[var(--tp-won)]"
                          : item.status === "lost"
                          ? "bg-[var(--tp-lost)]/20 text-[var(--tp-lost)]"
                          : "bg-[var(--tp-border)] text-[var(--tp-muted)]"
                       }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--tp-text)]">
                    {item.result ? (
                      <span className="font-semibold">{item.result}</span>
                    ) : (
                      <span className="text-[var(--tp-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
