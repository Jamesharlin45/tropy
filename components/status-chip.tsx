"use client"

import { Check, Clock, X, Ban } from "lucide-react"
import { useApp } from "./app-provider"
import type { TipStatus } from "@/lib/types"

const MAP: Record<
  TipStatus,
  { token: string; icon: typeof Check; key: string }
> = {
  pending: { token: "--tp-pending", icon: Clock, key: "status.pending" },
  won: { token: "--tp-won", icon: Check, key: "status.won" },
  lost: { token: "--tp-lost", icon: X, key: "status.lost" },
  void: { token: "--tp-void", icon: Ban, key: "status.void" },
}

export function StatusChip({ status }: { status: TipStatus }) {
  const { t } = useApp()
  const { token, icon: Icon, key } = MAP[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: `var(${token})`,
        backgroundColor: `color-mix(in srgb, var(${token}) 16%, transparent)`,
        border: `1px solid color-mix(in srgb, var(${token}) 40%, transparent)`,
      }}
    >
      <Icon className="size-3" aria-hidden="true" />
      {t(key)}
    </span>
  )
}
