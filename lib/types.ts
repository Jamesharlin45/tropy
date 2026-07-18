// Fixed internal shapes. The raw API field names are not guaranteed, so the
// normalize layer maps many possible upstream keys onto these stable shapes.

export type TipStatus = "pending" | "won" | "lost" | "void"

export type TabId = "free" | "vip" | "plans" | "history" | "ai"

export interface NormalizedMatch {
  id: string
  homeName: string
  awayName: string
  competition: string
  kickoffUnix: number | null
  kickoffLabel: string // HH:mm (best effort) or ""
  dateStr: string // YYYY-MM-DD
  /** true when normalization could not find recognizable fields */
  isRaw: boolean
  raw: unknown
}

export interface NormalizedStats {
  matchId: string
  // scoring / conceded season averages
  scoredAvgHome: number | null
  scoredAvgAway: number | null
  concededAvgHome: number | null
  concededAvgAway: number | null
  // percentages 0-100
  bttsPotential: number | null
  over25Potential: number | null
  // head to head
  h2hHomeWins: number | null
  h2hAwayWins: number | null
  h2hDraws: number | null
  // result (for resolved/history) — winner: "home" | "away" | "draw" | null
  winner: "home" | "away" | "draw" | null
  homeGoals: number | null
  awayGoals: number | null
  error?: string
  isRaw: boolean
  raw: unknown
}

export interface Tip {
  market: string // e.g. "Home or Draw", "Over 2.5", "BTTS - Yes"
  odds: number
  confidence: number // 0-100
  basedOn: string[] // which stats were used, as human-readable keys
}

export type TipTier = "free" | "vip"

export interface MatchTip {
  match: NormalizedMatch
  stats: NormalizedStats | null
  tip: Tip | null
  status: TipStatus
  tier: TipTier
}
