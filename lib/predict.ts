import type { NormalizedMatch, NormalizedStats, Tip, TipStatus } from "./types"

// Pure tip generator. No DOM, no fetch. Given normalized stats it returns a
// market label + odds-style number and records which stats it used.
//
// Odds are derived from an implied probability: odds ≈ 1 / p (with a small
// margin), clamped to a sensible range. This is a statistical estimate, not a
// guarantee.

function oddsFromProb(p: number): number {
  const clamped = Math.min(0.92, Math.max(0.18, p))
  const raw = 1 / clamped
  return Math.round(raw * 100) / 100
}

export function generateTip(stats: NormalizedStats | null): Tip | null {
  if (!stats || stats.isRaw) return null

  const {
    scoredAvgHome,
    scoredAvgAway,
    concededAvgHome,
    concededAvgAway,
    bttsPotential,
    over25Potential,
    h2hHomeWins,
    h2hAwayWins,
    h2hDraws,
  } = stats

  // Expected goals for each side using scored vs opponent conceded.
  const homeXg =
    scoredAvgHome !== null && concededAvgAway !== null
      ? (scoredAvgHome + concededAvgAway) / 2
      : scoredAvgHome
  const awayXg =
    scoredAvgAway !== null && concededAvgHome !== null
      ? (scoredAvgAway + concededAvgHome) / 2
      : scoredAvgAway

  const totalXg = (homeXg ?? 0) + (awayXg ?? 0)

  const candidates: Tip[] = []

  // Over/Under 2.5
  if (over25Potential !== null) {
    const p = over25Potential / 100
    if (p >= 0.5) {
      candidates.push({
        market: "Over 2.5 Goals",
        odds: oddsFromProb(p),
        confidence: Math.round(p * 100),
        basedOn: ["Over 2.5 potential"],
      })
    } else {
      candidates.push({
        market: "Under 2.5 Goals",
        odds: oddsFromProb(1 - p),
        confidence: Math.round((1 - p) * 100),
        basedOn: ["Over 2.5 potential"],
      })
    }
  } else if (homeXg !== null && awayXg !== null) {
    const p = totalXg >= 2.6 ? 0.62 : 0.4
    candidates.push({
      market: totalXg >= 2.6 ? "Over 2.5 Goals" : "Under 2.5 Goals",
      odds: oddsFromProb(p),
      confidence: Math.round(p * 100),
      basedOn: ["Scored avg", "Conceded avg"],
    })
  }

  // BTTS
  if (bttsPotential !== null) {
    const p = bttsPotential / 100
    candidates.push({
      market: p >= 0.5 ? "BTTS - Yes" : "BTTS - No",
      odds: oddsFromProb(p >= 0.5 ? p : 1 - p),
      confidence: Math.round((p >= 0.5 ? p : 1 - p) * 100),
      basedOn: ["BTTS potential"],
    })
  }

  // Match result / double chance from xG + H2H
  if (homeXg !== null && awayXg !== null) {
    const diff = homeXg - awayXg
    const h2hTotal = (h2hHomeWins ?? 0) + (h2hAwayWins ?? 0) + (h2hDraws ?? 0)
    const h2hHomeEdge = h2hTotal > 0 ? (h2hHomeWins ?? 0) / h2hTotal : 0
    const h2hAwayEdge = h2hTotal > 0 ? (h2hAwayWins ?? 0) / h2hTotal : 0
    const basedOn = ["Scored avg", "Conceded avg"]
    if (h2hTotal > 0) basedOn.push("H2H record")

    if (diff > 0.5 || h2hHomeEdge > 0.55) {
      const p = 0.55 + Math.min(0.2, diff * 0.12) + h2hHomeEdge * 0.1
      candidates.push({
        market: "Home or Draw",
        odds: oddsFromProb(Math.min(0.9, p)),
        confidence: Math.round(Math.min(0.9, p) * 100),
        basedOn,
      })
    } else if (diff < -0.5 || h2hAwayEdge > 0.55) {
      const p = 0.5 + Math.min(0.2, -diff * 0.12) + h2hAwayEdge * 0.1
      candidates.push({
        market: "Away or Draw",
        odds: oddsFromProb(Math.min(0.88, p)),
        confidence: Math.round(Math.min(0.88, p) * 100),
        basedOn,
      })
    } else {
      candidates.push({
        market: "Double Chance 1X2 tight",
        odds: oddsFromProb(0.66),
        confidence: 66,
        basedOn,
      })
    }
  }

  if (candidates.length === 0) return null

  // Pick the highest-confidence candidate as the headline tip.
  candidates.sort((a, b) => b.confidence - a.confidence)
  return candidates[0]
}

/**
 * Resolve a tip's win/loss status. If the match has a real result we grade the
 * tip against it. Otherwise (future match) it is pending.
 */
export function resolveStatus(
  match: NormalizedMatch,
  stats: NormalizedStats | null,
  tip: Tip | null,
  todayStr: string,
): TipStatus {
  if (!tip) return "void"

  const hasResult =
    stats && stats.winner !== null && stats.homeGoals !== null && stats.awayGoals !== null

  if (!hasResult) {
    // No result yet. Past-dated matches without a result are treated as void.
    return match.dateStr < todayStr ? "void" : "pending"
  }

  const { winner, homeGoals, awayGoals } = stats!
  const total = (homeGoals ?? 0) + (awayGoals ?? 0)
  const btts = (homeGoals ?? 0) > 0 && (awayGoals ?? 0) > 0

  const won = (() => {
    switch (tip.market) {
      case "Over 2.5 Goals":
        return total > 2.5
      case "Under 2.5 Goals":
        return total < 2.5
      case "BTTS - Yes":
        return btts
      case "BTTS - No":
        return !btts
      case "Home or Draw":
        return winner === "home" || winner === "draw"
      case "Away or Draw":
        return winner === "away" || winner === "draw"
      case "Double Chance 1X2 tight":
        return winner === "draw" || winner === "home"
      default:
        return false
    }
  })()

  return won ? "won" : "lost"
}
