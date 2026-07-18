"use client"

import { useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { useTips } from "@/hooks/use-tips"
import { TipCard } from "@/components/tip-card"
import { VipLockedCard } from "@/components/vip-locked-card"
import { BankerCard } from "@/components/banker-card"
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
  
  const [selectedLeague, setSelectedLeague] = useState<string>("All")

  const list = useMemo(
    () => tips.filter((it: MatchTip) => it.tier === tier),
    [tips, tier],
  )

  const leagues = useMemo(() => {
    const set = new Set<string>()
    list.forEach(it => {
       if (it.match.competition) set.add(it.match.competition)
    })
    return ["All", ...Array.from(set).sort()]
  }, [list])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = list
    if (selectedLeague !== "All") {
      res = res.filter(it => it.match.competition === selectedLeague)
    }
    if (q) {
      res = res.filter((it) =>
        [it.match.homeName, it.match.awayName, it.match.competition]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    }
    // Sort by kickoff time
    return res.sort((a, b) => (a.match.kickoffUnix ?? 0) - (b.match.kickoffUnix ?? 0))
  }, [list, query, selectedLeague])

  const banker = useMemo(() => {
    if (tier !== "vip" || list.length === 0) return null
    // Find highest confidence among VIP
    return list.reduce((prev, curr) => {
      const prevConf = prev.tip?.confidence || 0
      const currConf = curr.tip?.confidence || 0
      return currConf > prevConf ? curr : prev
    }, list[0])
  }, [list, tier])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={retry} />

  const eyebrow = tier === "free" ? "section.free.eyebrow" : "section.vip.eyebrow"

  // Only show banker if "All" is selected or if banker is in the selected league, 
  // and we don't duplicate it in the grid below.
  const showBanker = banker && (selectedLeague === "All" || banker.match.competition === selectedLeague) && !query
  const cardsToRender = showBanker ? filtered.filter(it => it.match.id !== banker.match.id) : filtered

  return (
    <section className="tp-fade-up">
      <SectionHeader eyebrowKey={eyebrow} count={filtered.length} />

      {/* League Filter */}
      {leagues.length > 2 && (
        <div className="tp-scroll-x mb-4 flex gap-2 overflow-x-auto pb-2 px-1">
          {leagues.map(league => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`tp-focus whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedLeague === league
                  ? "bg-[var(--tp-accent)] text-[var(--tp-on-accent)]"
                  : "bg-[var(--tp-surface)] text-[var(--tp-muted)] hover:bg-[var(--tp-bg-2)] border border-[var(--tp-border)]"
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !showBanker ? (
        <EmptyState noResults={!!query.trim() && list.length > 0} />
      ) : (
        <div className="flex flex-col gap-4">
          {showBanker && (
             <div className="mb-2">
                <BankerCard item={banker} onUnlock={onUnlock} />
             </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cardsToRender.map((item) =>
              tier === "vip" ? (
                <VipLockedCard key={item.match.id} item={item} onUnlock={onUnlock} />
              ) : (
                <TipCard key={item.match.id} item={item} />
              ),
            )}
          </div>
        </div>
      )}
    </section>
  )
}
