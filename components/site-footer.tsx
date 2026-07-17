"use client"

import { ShieldAlert } from "lucide-react"
import { useApp } from "@/components/app-provider"

export function SiteFooter() {
  const { t } = useApp()
  return (
    <footer className="mx-auto mt-12 max-w-4xl px-4 pb-10">
      <div className="rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/60 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[var(--tp-accent)]" aria-hidden="true" />
          <div>
            <p className="text-xs leading-relaxed text-[var(--tp-muted)] text-pretty">
              {t("footer.responsible")}
            </p>
            <p className="mt-2 text-[11px] text-[var(--tp-muted)]/70">{t("footer.rights")}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
