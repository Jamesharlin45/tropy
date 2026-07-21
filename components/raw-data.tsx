"use client"

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
    <details className="mt-2 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg-2)] p-3">
      <summary className="tp-focus cursor-pointer text-xs font-medium text-[var(--tp-muted)] hover:text-[var(--tp-accent)] transition-colors select-none">
        📊 {t("card.rawData")}
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[var(--tp-bg)] p-3 font-mono text-[10px] leading-relaxed text-[var(--tp-muted)] border border-[var(--tp-border)]">
        {text}
      </pre>
    </details>
  )
}
