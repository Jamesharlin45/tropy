"use client"

import { useState } from "react"
import { Palette, Check } from "lucide-react"
import { useApp } from "./app-provider"
import { THEMES } from "@/lib/theme"

export function ThemePicker() {
  const { t, theme, setTheme } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.theme")}
        className="tp-focus flex size-9 items-center justify-center rounded-full border border-[var(--tp-border)] bg-[var(--tp-surface)] text-[var(--tp-text)] transition-colors hover:border-[var(--tp-accent)]"
      >
        <Palette className="size-4" aria-hidden="true" />
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
            aria-label={t("nav.theme")}
            className="tp-fade-up absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-1 shadow-xl"
          >
            {THEMES.map((th) => (
              <button
                key={th.id}
                role="menuitemradio"
                aria-checked={theme === th.id}
                type="button"
                onClick={() => {
                  setTheme(th.id)
                  setOpen(false)
                }}
                className="tp-focus flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-[var(--tp-text)] transition-colors hover:bg-[var(--tp-surface-2)]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex overflow-hidden rounded-full border border-[var(--tp-border)]">
                    <span className="size-4" style={{ backgroundColor: th.swatch[0] }} />
                    <span className="size-4" style={{ backgroundColor: th.swatch[1] }} />
                  </span>
                  {th.label}
                </span>
                {theme === th.id ? (
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
