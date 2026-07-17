"use client"

import { useMemo } from "react"
import { useApp } from "@/components/app-provider"
import { useTips } from "@/hooks/use-tips"
import { TipCard } from "@/components/tip-card"
import { VipLockedCard } from "@/components/vip-locked-card"
import { SectionHeader } from "@/components/section-header"
import { LoadingState, EmptyState, ErrorState } from "@/components/states"
import type { MatchTip } from "@/lib/types"

export function TipsView({
  date,
  tier,
  query,
  onUnlock,
}: {
  date: string
  tier: "free" | "vip"
  query: string
  onUnlock: () => void
}) {
  useApp()
  const { tips, error, isLoading, retry } = useTips(date)

  const list = useMemo(
    () => tips.filter((it: MatchTip) => it.tier === tier),
    [tips, tier],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((it) =>
      [it.match.homeName, it.match.awayName, it.match.competition]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [list, query])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={retry} />

  const eyebrow = tier === "free" ? "section.free.eyebrow" : "section.vip.eyebrow"

  return (
    <section className="tp-fade-up">
      <SectionHeader eyebrowKey={eyebrow} count={filtered.length} />
      {filtered.length === 0 ? (
        <EmptyState noResults={!!query.trim() && list.length > 0} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) =>
            tier === "vip" ? (
              <VipLockedCard key={item.match.id} item={item} onUnlock={onUnlock} />
            ) : (
              <TipCard key={item.match.id} item={item} />
            ),
          )}
        </div>
      )}
    </section>
  )
}
