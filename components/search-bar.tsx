"use client"

import { Search, X } from "lucide-react"
import { useApp } from "./app-provider"

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useApp()
  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <div className="tp-fade-up flex items-center gap-2 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)] px-3 py-2">
        <Search className="size-4 shrink-0 text-[var(--tp-muted)]" aria-hidden="true" />
        <input
          type="search"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("nav.search")}
          className="tp-focus w-full bg-transparent text-sm text-[var(--tp-text)] outline-none placeholder:text-[var(--tp-muted)]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("search.clear")}
            className="tp-focus flex size-6 items-center justify-center rounded-full text-[var(--tp-muted)] hover:text-[var(--tp-text)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
