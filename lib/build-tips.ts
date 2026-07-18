import { normalizeMatchList, normalizeStats, normalizeStatsMap } from "./normalize"
import { generateTip, resolveStatus } from "./predict"
import { todayStr } from "./dates"
import { isTopLeague, VIP_MIN_CONFIDENCE } from "./leagues"
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

function tierFor(tip: { confidence: number } | null): TipTier {
  // Predictions with high confidence (≥ VIP_MIN_CONFIDENCE%) are VIP.
  if (tip && tip.confidence >= VIP_MIN_CONFIDENCE) return "vip"
  return "free"
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
  const allMatches = normalizeMatchList(matchesEnvelope, date)

  const validAll = allMatches.filter(
    (m) =>
      !(m.homeName === "Home" && m.awayName === "Away") &&
      m.homeName !== "Unknown" &&
      m.awayName !== "Unknown",
  )

  // Only keep top-league matches. Fall back to all valid matches if none qualify
  // (this prevents blank screen on days with no big-league games).
  const topLeagueMatches = validAll.filter((m) => isTopLeague(m.competition))
  const matches = topLeagueMatches.length > 0 ? topLeagueMatches : validAll

  // stats can come from /matches-with-stats `stats` map, keyed by id.
  const statsMap = statsEnvelope?.stats ? normalizeStatsMap(statsEnvelope.stats) : {}

  const today = todayStr()

  return matches.map((match) => {
    let stats = statsMap[match.id] ?? null
    // Fallback: FootyStats embeds stats/potentials directly on the match object.
    if (!stats && match.raw && typeof match.raw === "object") {
      const rawObj = match.raw as Record<string, unknown>
      const srcStats = "stats" in rawObj && rawObj.stats ? rawObj.stats : rawObj
      stats = normalizeStats(match.id, srcStats)
    }
    const tip = generateTip(stats)
    const status = resolveStatus(match, stats, tip, today)
    return {
      match,
      stats,
      tip,
      status,
      tier: tierFor(tip),
    }
  })
}
