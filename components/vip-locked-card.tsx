"use client"

import { Lock, Sparkles } from "lucide-react"
import { useApp } from "./app-provider"
import type { MatchTip } from "@/lib/types"

const PARTICLES = [
  { top: "20%", left: "15%", delay: "0s" },
  { top: "65%", left: "75%", delay: "0.5s" },
  { top: "45%", left: "50%", delay: "0.9s" },
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
    <article
      onClick={onUnlock}
      className="tp-fade-up relative flex cursor-pointer overflow-hidden rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/80 p-2.5 shadow-md backdrop-blur-md transition-all hover:border-[var(--tp-accent)]/60 hover:shadow-lg"
    >
      {/* Blurred background teams */}
      <div className="absolute inset-0 flex flex-col justify-center px-3 opacity-10 blur-[4px]" aria-hidden="true">
        <div className="flex items-center gap-1.5 mb-1">
          {match.homeLogo ? (
            <img src={match.homeLogo} alt="" className="size-4 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : <div className="size-1.5 rounded-full bg-white shrink-0" />}
          <span className="truncate text-xs font-bold">{match.homeName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {match.awayLogo ? (
            <img src={match.awayLogo} alt="" className="size-4 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : <div className="size-1.5 rounded-full bg-white/50 shrink-0" />}
          <span className="truncate text-xs font-bold">{match.awayName}</span>
        </div>
      </div>

      {/* particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span key={i} className="tp-particle absolute size-1 rounded-full"
            style={{ top: p.top, left: p.left, animationDelay: p.delay, backgroundColor: "var(--tp-accent)", opacity: 0.5 }}
          />
        ))}
      </div>

      {/* lock CTA */}
      <div className="relative z-10 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--tp-accent) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--tp-accent) 40%, transparent)" }}>
            <Lock className="size-3.5" style={{ color: "var(--tp-accent)" }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--tp-text)] truncate">{t("vip.locked.title")}</p>
            <p className="text-[10px] text-[var(--tp-muted)] truncate">{t("vip.locked.subtitle")}</p>
          </div>
        </div>
        <button type="button" onClick={onUnlock}
          className="tp-focus shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--tp-accent)", color: "var(--tp-on-accent)" }}>
          <Sparkles className="size-2.5" aria-hidden="true" />
          {t("vip.unlock")}
        </button>
      </div>
    </article>
  )
}

