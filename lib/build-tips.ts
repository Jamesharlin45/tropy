import { normalizeMatchList, normalizeStats, normalizeStatsMap } from "./normalize"
import { generateTip, resolveStatus } from "./predict"
import { todayStr } from "./dates"
import { isTopLeague, VIP_MIN_CONFIDENCE } from "./leagues"
import type { Envelope } from "./api"
import type { MatchTip, NormalizedMatch, NormalizedStats, TipTier } from "./types"

// Stable string hash → used to deterministically assign a tier (free/vip)
// per match so the same fixture is always in the same tab.
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Suppress unused warning — hashId is kept for future deterministic tier assignment
void hashId

function tierFor(tip: { confidence: number } | null): TipTier {
  // Predictions with high confidence (≥ VIP_MIN_CONFIDENCE%) are VIP.
  if (tip && tip.confidence >= VIP_MIN_CONFIDENCE) return "vip"
  return "free"
}

/** Core tip-building logic — shared between both builders. */
function buildFromMatchesAndStats(
  matches: NormalizedMatch[],
  statsMap: Record<string, NormalizedStats>,
  today: string,
): MatchTip[] {
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
    return { match, stats, tip, status, tier: tierFor(tip) }
  })
}

/**
 * Build tips from raw API envelopes (upstream fallback path).
 * Accepts raw /matches + /matches-with-stats envelopes and normalizes internally.
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

  // Prefer top-league matches; fall back to all valid if none qualify.
  const topLeagueMatches = validAll.filter((m) => isTopLeague(m.competition))
  const matches = topLeagueMatches.length > 0 ? topLeagueMatches : validAll

  const rawStats = (statsEnvelope as Record<string, unknown> | null)?.stats
  const statsMap = rawStats ? normalizeStatsMap(rawStats) : {}

  return buildFromMatchesAndStats(matches, statsMap, todayStr())
}

/**
 * Build tips from pre-normalized data (DB path).
 * Accepts already-normalized NormalizedMatch[] + NormalizedStats map.
 * Also accepts raw envelopes as a fallback for the upstream path.
 */
export function buildTipsFromNormalized(
  date: string,
  matchesEnvelope: Envelope | null,
  statsEnvelope: Envelope | null,
  normalizedMatches?: NormalizedMatch[],
  normalizedStatsMap?: Record<string, NormalizedStats>,
): MatchTip[] {
  // DB path: use pre-normalized data directly
  if (normalizedMatches) {
    return buildFromMatchesAndStats(
      normalizedMatches,
      normalizedStatsMap ?? {},
      todayStr(),
    )
  }

  // Upstream fallback path: normalize from raw envelopes
  if (matchesEnvelope) {
    return buildTips(date, matchesEnvelope, statsEnvelope)
  }

  return []
}
