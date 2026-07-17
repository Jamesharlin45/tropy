"use client"

import { Lock, Sparkles } from "lucide-react"
import { useApp } from "./app-provider"
import type { MatchTip } from "@/lib/types"

// Decorative particle positions (percent-based).
const PARTICLES = [
  { top: "18%", left: "12%", delay: "0s" },
  { top: "30%", left: "82%", delay: "0.4s" },
  { top: "68%", left: "20%", delay: "0.9s" },
  { top: "72%", left: "74%", delay: "1.3s" },
  { top: "48%", left: "50%", delay: "0.6s" },
  { top: "22%", left: "60%", delay: "1.1s" },
]

export function VipLockedCard({
  item,
  onUnlock,
}: {
  item: MatchTip
  onUnlock: () => void
}) {
  const { t } = useApp()
  const { match } = item

  return (
    <article className="tp-fade-up relative overflow-hidden rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] p-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]">
      {/* obscured team row */}
      <div className="mb-4 flex items-center justify-between gap-2 opacity-30 blur-[2px]" aria-hidden="true">
        <span className="text-sm font-semibold">{match.homeName}</span>
        <span className="font-display text-xs font-bold tracking-widest text-[var(--tp-muted)]">
          {t("card.vs")}
        </span>
        <span className="text-sm font-semibold">{match.awayName}</span>
      </div>

      {/* particle texture */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="tp-particle absolute size-1.5 rounded-full"
            style={{
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              backgroundColor: "var(--tp-accent)",
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* lock + CTA */}
      <div className="relative flex flex-col items-center gap-3 py-4 text-center">
        <div
          className="tp-glow flex size-14 items-center justify-center rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--tp-accent) 14%, transparent)",
            border: "1px solid color-mix(in srgb, var(--tp-accent) 45%, transparent)",
          }}
        >
          <Lock className="size-6" style={{ color: "var(--tp-accent)" }} aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-[var(--tp-text)]">
            {t("vip.locked.title")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--tp-muted)]">
            {t("vip.locked.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          className="tp-focus inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-transform hover:scale-[1.03]"
          style={{
            backgroundColor: "var(--tp-accent)",
            color: "var(--tp-on-accent)",
          }}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {t("vip.unlock")}
        </button>
      </div>
    </article>
  )
}
