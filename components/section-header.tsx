"use client"

import { useApp } from "@/components/app-provider"

export function SectionHeader({
  eyebrowKey,
  count,
}: {
  eyebrowKey: string
  count: number
}) {
  const { t } = useApp()
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-[var(--tp-text)] text-balance">
          {t(eyebrowKey)}
        </h2>
        <span className="shrink-0 rounded-full border border-[var(--tp-border)] bg-[var(--tp-surface)] px-3 py-1 font-mono text-xs font-semibold text-[var(--tp-muted)]">
          {t("section.matches", { n: count })}
        </span>
      </div>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-[var(--tp-accent)]/60 via-[var(--tp-border)] to-transparent" />
    </div>
  )
}
