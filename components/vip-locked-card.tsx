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
    <article className="tp-fade-up relative flex overflow-hidden rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-3 shadow-lg backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/50">
      
      {/* Background obscured teams */}
      <div className="absolute inset-0 flex flex-col justify-center px-4 opacity-15 blur-[3px]" aria-hidden="true">
        <div className="flex items-center gap-2 mb-2">
           <div className="size-1.5 rounded-full bg-[var(--tp-text)] shrink-0" />
           <span className="truncate text-sm font-bold">{match.homeName}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="size-1.5 rounded-full bg-[var(--tp-text)] shrink-0" />
           <span className="truncate text-sm font-bold">{match.awayName}</span>
        </div>
      </div>

      {/* particle texture */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="tp-particle absolute size-1 rounded-full"
            style={{
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              backgroundColor: "var(--tp-accent)",
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* lock + CTA */}
      <div className="relative z-10 flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="tp-glow flex size-10 items-center justify-center rounded-full shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--tp-accent) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--tp-accent) 40%, transparent)",
            }}
          >
            <Lock className="size-4" style={{ color: "var(--tp-accent)" }} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <p className="font-display text-xs font-bold text-[var(--tp-text)] truncate">
              {t("vip.locked.title")}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--tp-muted)] truncate">
              {t("vip.locked.subtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUnlock}
          className="tp-focus shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[1.03]"
          style={{
            backgroundColor: "var(--tp-accent)",
            color: "var(--tp-on-accent)",
          }}
        >
          <Sparkles className="size-3" aria-hidden="true" />
          {t("vip.unlock")}
        </button>
      </div>
    </article>
  )
}
