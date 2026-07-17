import { normalizeMatchList, normalizeStats, normalizeStatsMap } from "./normalize"
import { generateTip, resolveStatus } from "./predict"
import { todayStr } from "./dates"
import type { Envelope } from "./api"
import type { MatchTip, TipTier } from "./types"

// Stable string hash -> used to deterministically assign a tier (free/vip)
// per match so the same fixture is always in the same tab.
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function tierFor(id: string): TipTier {
  // ~45% free, ~55% VIP — deterministic and stable per fixture.
  return hashId(id) % 20 < 9 ? "free" : "vip"
}

/**
 * Merge a /matches envelope with a /matches-with-stats envelope into the
 * fixed internal MatchTip[] shape, generating tips + statuses.
 */
export function buildTips(
  date: string,
  matchesEnvelope: Envelope,
  statsEnvelope: Envelope | null,
): MatchTip[] {
  const matches = normalizeMatchList(matchesEnvelope.data ?? matchesEnvelope.matches, date)

  // stats can come from /matches-with-stats `stats` map, keyed by id.
  const statsMap = statsEnvelope?.stats ? normalizeStatsMap(statsEnvelope.stats) : {}

  const today = todayStr()

  return matches.map((match) => {
    let stats = statsMap[match.id] ?? null
    // Fallback: some responses embed stats on the match itself.
    if (!stats && match.raw && typeof match.raw === "object" && "stats" in (match.raw as object)) {
      stats = normalizeStats(match.id, (match.raw as { stats: unknown }).stats)
    }
    const tip = generateTip(stats)
    const status = resolveStatus(match, stats, tip, today)
    return {
      match,
      stats,
      tip,
      status,
      tier: tierFor(match.id),
    }
  })
}
