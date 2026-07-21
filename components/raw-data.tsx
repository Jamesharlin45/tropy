"use client"

import { BarChart2 } from "lucide-react"
import { useApp } from "./app-provider"

// Fallback view when normalization can't recognize the shape. Shows the raw
// payload instead of crashing.
export function RawData({ data }: { data: unknown }) {
  const { t } = useApp()
  let text = ""
  try {
    text = JSON.stringify(data, null, 2)
  } catch {
    text = String(data)
  }
  return (
    <details className="mt-3 group rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface-2)]/50 p-3 hover:border-[var(--tp-accent)]/40 transition-colors">
      <summary className="tp-focus flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--tp-muted)] hover:text-[var(--tp-text)] transition-colors">
        <BarChart2 className="size-4" />
        {t("card.rawData")}
      </summary>
      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--tp-border)] bg-[#0B0F1A] p-3 shadow-inner">
        <pre className="max-h-80 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 scrollbar-thin scrollbar-thumb-[var(--tp-border)]">
          {text}
        </pre>
      </div>
    </details>
  )
}
