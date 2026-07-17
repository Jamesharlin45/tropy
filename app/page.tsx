"use client"

import { useMemo, useState } from "react"
import { TopNav } from "@/components/top-nav"
import { SearchBar } from "@/components/search-bar"
import { DateStrip } from "@/components/date-strip"
import { TipsView } from "@/components/tips-view"
import { PlansView } from "@/components/plans-view"
import { HistoryView } from "@/components/history-view"
import { SiteFooter } from "@/components/site-footer"
import { dateWindow, todayStr } from "@/lib/dates"
import type { TabId } from "@/lib/types"

export default function TropyApp() {
  const [tab, setTab] = useState<TabId>("free")
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr())
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  // A window of dates around today for the strip (-3 .. +10).
  const dates = useMemo(() => dateWindow(todayStr(), 3, 10), [])

  const showDateStrip = tab === "free" || tab === "vip"

  return (
    <div className="min-h-screen">
      <TopNav
        active={tab}
        onChange={setTab}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((s) => !s)}
      />

      {searchOpen && tab !== "plans" ? (
        <SearchBar value={query} onChange={setQuery} />
      ) : null}

      {showDateStrip ? (
        <DateStrip dates={dates} selected={selectedDate} onSelect={setSelectedDate} />
      ) : null}

      <main className="mx-auto max-w-4xl px-4 py-4">
        {tab === "free" ? (
          <TipsView date={selectedDate} tier="free" query={query} onUnlock={() => setTab("plans")} />
        ) : null}
        {tab === "vip" ? (
          <TipsView date={selectedDate} tier="vip" query={query} onUnlock={() => setTab("plans")} />
        ) : null}
        {tab === "plans" ? <PlansView /> : null}
        {tab === "history" ? <HistoryView query={query} /> : null}
      </main>

      <SiteFooter />
    </div>
  )
}
