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
    <details className="mt-2 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg-2)] p-2">
      <summary className="tp-focus cursor-pointer text-xs font-medium text-[var(--tp-muted)]">
        {t("card.rawData")}
      </summary>
      <pre className="mt-2 max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-[var(--tp-muted)]">
        {text}
      </pre>
    </details>
  )
}
