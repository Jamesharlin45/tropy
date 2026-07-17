"use client"

import { useState } from "react"
import { Globe, Check } from "lucide-react"
import { useApp } from "./app-provider"
import { LANGUAGES } from "@/lib/i18n"

export function LanguagePicker() {
  const { t, lang, setLang } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.language")}
        className="tp-focus flex h-9 items-center gap-1.5 rounded-full border border-[var(--tp-border)] bg-[var(--tp-surface)] px-2.5 text-[var(--tp-text)] transition-colors hover:border-[var(--tp-accent)]"
      >
        <Globe className="size-4" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold uppercase">{lang}</span>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label={t("nav.language")}
            className="tp-fade-up absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-1 shadow-xl"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={lang === l.code}
                type="button"
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className="tp-focus flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-[var(--tp-text)] transition-colors hover:bg-[var(--tp-surface-2)]"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[var(--tp-muted)]">
                    {l.flag}
                  </span>
                  {l.label}
                </span>
                {lang === l.code ? (
                  <Check className="size-4" style={{ color: "var(--tp-accent)" }} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
