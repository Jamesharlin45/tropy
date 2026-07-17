"use client"

import { Flame, Crown, Diamond, History as HistoryIcon, Search } from "lucide-react"
import { useApp } from "./app-provider"
import { ThemePicker } from "./theme-picker"
import { LanguagePicker } from "./language-picker"
import type { TabId } from "@/lib/types"

const TABS: { id: TabId; icon: typeof Flame; key: string }[] = [
  { id: "free", icon: Flame, key: "nav.free" },
  { id: "vip", icon: Crown, key: "nav.vip" },
  { id: "plans", icon: Diamond, key: "nav.plans" },
  { id: "history", icon: HistoryIcon, key: "nav.history" },
]

export function TopNav({
  active,
  onChange,
  searchOpen,
  onToggleSearch,
}: {
  active: TabId
  onChange: (t: TabId) => void
  searchOpen: boolean
  onToggleSearch: () => void
}) {
  const { t } = useApp()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--tp-border)] bg-[color-mix(in_srgb,var(--tp-bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--tp-accent)", color: "var(--tp-on-accent)" }}
          >
            <Diamond className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-extrabold tracking-tight text-[var(--tp-text)]">
            {t("app.name")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-label={t("nav.search")}
            aria-pressed={searchOpen}
            className="tp-focus flex size-9 items-center justify-center rounded-full border border-[var(--tp-border)] bg-[var(--tp-surface)] text-[var(--tp-text)] transition-colors hover:border-[var(--tp-accent)]"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
          <LanguagePicker />
          <ThemePicker />
        </div>
      </div>

      {/* pill tabs */}
      <nav
        aria-label="Sections"
        className="tp-scroll-x mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 pb-3"
      >
        {TABS.map(({ id, icon: Icon, key }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className="tp-focus inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "var(--tp-accent)" : "transparent",
                color: isActive ? "var(--tp-on-accent)" : "var(--tp-muted)",
                borderColor: isActive
                  ? "var(--tp-accent)"
                  : "var(--tp-border)",
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(key)}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
