"use client"

import { useApp } from "./app-provider"
import { useDayCount } from "@/hooks/use-tips"
import { dateParts, todayStr } from "@/lib/dates"

function DateCard({
  date,
  selected,
  onSelect,
}: {
  date: string
  selected: boolean
  onSelect: (d: string) => void
}) {
  const { lang, t } = useApp()
  const localeMap: Record<string, string> = { en: "en-GB", fr: "fr-FR", pt: "pt-PT" }
  const locale = localeMap[lang] ?? "en-GB"
  const parts = dateParts(date, locale)
  const isToday = date === todayStr()
  // Only fetch counts for a manageable window; fetch for every rendered card.
  const count = useDayCount(date, true)
  const hasZero = count === 0
  const muted = hasZero

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={selected}
      aria-label={`${parts.weekday} ${parts.day} ${parts.month}${
        count !== undefined ? `, ${count} ${t("nav.free")}` : ""
      }`}
      className="tp-focus relative flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 transition-transform"
      style={{
        backgroundColor: selected ? "var(--tp-surface-2)" : "var(--tp-surface)",
        borderColor: selected ? "var(--tp-accent)" : "var(--tp-border)",
        boxShadow: selected ? "0 0 18px -4px rgba(var(--tp-glow),0.5)" : "none",
        opacity: muted && !selected ? 0.45 : 1,
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      {count !== undefined && count > 0 ? (
        <span
          className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold tabular-nums"
          style={{ backgroundColor: "var(--tp-accent)", color: "var(--tp-on-accent)" }}
        >
          {count}
        </span>
      ) : null}
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tp-muted)]">
        {parts.month}
      </span>
      <span
        className="flex size-9 items-center justify-center rounded-full font-display text-sm font-bold tabular-nums"
        style={{
          backgroundColor: selected ? "var(--tp-accent)" : "var(--tp-bg-2)",
          color: selected ? "var(--tp-on-accent)" : "var(--tp-text)",
        }}
      >
        {parts.day}
      </span>
      <span className="text-[10px] font-medium uppercase text-[var(--tp-muted)]">
        {parts.weekday}
      </span>
      {isToday ? (
        <span
          className="rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wide"
          style={{
            color: "var(--tp-accent)",
            backgroundColor: "color-mix(in srgb, var(--tp-accent) 16%, transparent)",
          }}
        >
          {t("section.today")}
        </span>
      ) : null}
    </button>
  )
}

export function DateStrip({
  dates,
  selected,
  onSelect,
}: {
  dates: string[]
  selected: string
  onSelect: (d: string) => void
}) {
  return (
    <div className="tp-scroll-x mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3">
      {dates.map((d) => (
        <DateCard key={d} date={d} selected={d === selected} onSelect={onSelect} />
      ))}
    </div>
  )
}
