"use client"

import { Inbox, AlertTriangle, SearchX, Loader2 } from "lucide-react"
import { useApp } from "@/components/app-provider"

export function LoadingState() {
  const { t } = useApp()
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--tp-muted)]"
    >
      <Loader2 className="tp-transition size-6 animate-spin text-[var(--tp-accent)]" aria-hidden="true" />
      <p className="text-sm">{t("loading")}</p>
    </div>
  )
}

export function EmptyState({ noResults = false }: { noResults?: boolean }) {
  const { t } = useApp()
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--tp-border)] bg-[var(--tp-surface)]/40 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tp-surface-2)] text-[var(--tp-muted)]">
        {noResults ? (
          <SearchX className="size-6" aria-hidden="true" />
        ) : (
          <Inbox className="size-6" aria-hidden="true" />
        )}
      </div>
      <p className="font-display text-base font-bold text-[var(--tp-text)]">
        {noResults ? t("empty.noResults") : t("empty.title")}
      </p>
      {!noResults && (
        <p className="max-w-xs text-sm text-[var(--tp-muted)] text-pretty">{t("empty.subtitle")}</p>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useApp()
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--tp-lost)]/40 bg-[var(--tp-lost)]/8 py-14 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tp-lost)]/15 text-[var(--tp-lost)]">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <p className="font-display text-base font-bold text-[var(--tp-text)]">{t("error.title")}</p>
      {message ? (
        <p className="max-w-md px-4 font-mono text-xs text-[var(--tp-muted)] text-pretty">{message}</p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="tp-focus rounded-xl bg-[var(--tp-accent)] px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-[var(--tp-on-accent)] transition-colors hover:bg-[var(--tp-accent-2)]"
      >
        {t("error.retry")}
      </button>
    </div>
  )
}
