import type { NormalizedMatch, NormalizedStats } from "./types"

// ---------------------------------------------------------------------------
// Defensive helpers: read common FootyStats-style keys with fallbacks and
// never throw on an unexpected shape.
// ---------------------------------------------------------------------------

type Dict = Record<string, unknown>

function isObj(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** Read the first key that exists and is non-empty. */
function pick(obj: Dict, keys: string[]): unknown {
  for (const k of keys) {
    if (k in obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k]
    }
  }
  return undefined
}

function toStr(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  return undefined
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v)
  }
  return null
}

/** Percentages sometimes arrive as 0-1 fractions; scale to 0-100. */
function toPct(v: unknown): number | null {
  const n = toNum(v)
  if (n === null) return null
  if (n >= 0 && n <= 1) return Math.round(n * 100)
  return Math.round(n)
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

const HOME_KEYS = ["home_name", "homeName", "home_team", "homeTeam", "home_team_name", "team_a_name", "home", "team_home", "localteam"]
const AWAY_KEYS = ["away_name", "awayName", "away_team", "awayTeam", "away_team_name", "team_b_name", "away", "team_away", "visitorteam"]
const COMP_KEYS = ["competition_name", "competition", "league_name", "league", "division", "comp", "tournament"]
const ID_KEYS = ["id", "match_id", "matchId", "fixture_id", "fixtureId", "game_id"]
const KICKOFF_KEYS = ["date_unix", "kickoff_unix", "kickoffUnix", "unix_timestamp", "timestamp", "starting_at_timestamp"]
const TIME_KEYS = ["time", "kickoff", "kickoff_time", "kickoffTime", "start_time", "starting_at"]

/** Extract a team display name whether the value is a string or nested object. */
function readTeam(v: unknown, nameKeys: string[]): string | undefined {
  if (typeof v === "string") return v
  if (isObj(v)) {
    return toStr(pick(v, ["name", "shortName", "short_name", ...nameKeys]))
  }
  return undefined
}

function formatTimeFromUnix(unix: number | null, fallback?: string): string {
  if (unix === null) return fallback ?? ""
  // Values may be seconds or milliseconds.
  const ms = unix < 1e12 ? unix * 1000 : unix
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(new Date(ms))
  } catch {
    return fallback ?? ""
  }
}

export function normalizeMatch(raw: unknown, dateStr: string, index = 0): NormalizedMatch {
  if (!isObj(raw)) {
    return {
      id: `raw-${index}`,
      homeName: "Unknown",
      awayName: "Unknown",
      competition: "",
      kickoffUnix: null,
      kickoffLabel: "",
      dateStr,
      isRaw: true,
      raw,
    }
  }

  const id = toStr(pick(raw, ID_KEYS)) ?? `idx-${index}`
  const homeName = readTeam(pick(raw, HOME_KEYS), ["home_name"]) 
  const awayName = readTeam(pick(raw, AWAY_KEYS), ["away_name"])
  const competition = readTeam(pick(raw, COMP_KEYS), ["name"]) ?? ""
  const kickoffUnix = toNum(pick(raw, KICKOFF_KEYS))
  const timeStr = toStr(pick(raw, TIME_KEYS))
  const kickoffLabel = timeStr ?? formatTimeFromUnix(kickoffUnix)

  const isRaw = !homeName || !awayName

  return {
    id,
    homeName: homeName ?? "Home",
    awayName: awayName ?? "Away",
    competition,
    kickoffUnix,
    kickoffLabel,
    dateStr,
    isRaw,
    raw,
  }
}

/**
 * The /matches payload shape is not documented precisely. Handle:
 *  - array of matches
 *  - { data: [...] } / { matches: [...] } / { fixtures: [...] }
 *  - object keyed by id -> match
 *  - object keyed by competition -> array of matches
 */
export function normalizeMatchList(payload: unknown, dateStr: string): NormalizedMatch[] {
  const container =
    isObj(payload) && ("data" in payload || "matches" in payload || "fixtures" in payload)
      ? (payload as Dict).data ?? (payload as Dict).matches ?? (payload as Dict).fixtures
      : payload

  const out: NormalizedMatch[] = []

  const pushArray = (arr: unknown[]) => {
    arr.forEach((m, i) => out.push(normalizeMatch(m, dateStr, out.length + i)))
  }

  if (Array.isArray(container)) {
    pushArray(container)
  } else if (isObj(container)) {
    const values = Object.values(container)
    // Case A: object keyed by id -> match object
    if (values.every((v) => isObj(v) && !Array.isArray(v))) {
      // Could be id->match OR competition->matchObject; both handled as matches.
      const looksLikeGroups = values.some(
        (v) => isObj(v) && (Array.isArray((v as Dict).matches) || Array.isArray((v as Dict).fixtures)),
      )
      if (looksLikeGroups) {
        for (const group of values) {
          const arr =
            (isObj(group) && ((group as Dict).matches ?? (group as Dict).fixtures)) || []
          if (Array.isArray(arr)) pushArray(arr)
        }
      } else {
        Object.entries(container as Dict).forEach(([key, v], i) => {
          const m = normalizeMatch(v, dateStr, i)
          // Prefer the map key as id if the match itself had no id.
          if (m.id.startsWith("idx-")) m.id = key
          out.push(m)
        })
      }
    } else {
      // Case B: object keyed by competition -> array of matches
      for (const v of values) {
        if (Array.isArray(v)) pushArray(v)
      }
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const SCORED_HOME = ["seasonScoredAVG_home", "scoredAVG_home", "scored_avg_home", "avg_goals_scored_home", "home_scored_avg", "home_ppg", "pre_match_home_ppg", "team_a_last5_ppg_overall", "team_a_default_ppg"]
const SCORED_AWAY = ["seasonScoredAVG_away", "scoredAVG_away", "scored_avg_away", "avg_goals_scored_away", "away_scored_avg", "away_ppg", "pre_match_away_ppg", "team_b_last5_ppg_overall", "team_b_default_ppg"]
const CONCEDED_HOME = ["seasonConcededAVG_home", "concededAVG_home", "conceded_avg_home", "avg_goals_conceded_home", "home_conceded_avg"]
const CONCEDED_AWAY = ["seasonConcededAVG_away", "concededAVG_away", "conceded_avg_away", "avg_goals_conceded_away", "away_conceded_avg"]
const BTTS_KEYS = ["btts_potential", "bttsPotential", "btts", "btts_percentage", "gg_potential"]
const OVER25_KEYS = ["o25_potential", "over25_potential", "over_25_potential", "o25Potential", "over25", "o25"]

const H2H_KEYS = ["h2h", "head2head", "headToHead", "previous_meetings"]

function readH2H(raw: Dict): { home: number | null; away: number | null; draws: number | null } {
  const h2hRaw = pick(raw, H2H_KEYS)
  const src = isObj(h2hRaw) ? h2hRaw : raw
  return {
    home: toNum(pick(src, ["team_a_wins", "home_wins", "homeWins", "w1", "teamA_wins"])),
    away: toNum(pick(src, ["team_b_wins", "away_wins", "awayWins", "w2", "teamB_wins"])),
    draws: toNum(pick(src, ["draws", "draw", "x", "total_draws"])),
  }
}

function readResult(raw: Dict): {
  winner: "home" | "away" | "draw" | null
  homeGoals: number | null
  awayGoals: number | null
} {
  const hg = toNum(pick(raw, ["homeGoalCount", "home_goals", "homeScore", "score_home", "ft_home", "goals_home"]))
  const ag = toNum(pick(raw, ["awayGoalCount", "away_goals", "awayScore", "score_away", "ft_away", "goals_away"]))
  let winner = ((): "home" | "away" | "draw" | null => {
    const w = toStr(pick(raw, ["winner", "result", "winningTeam"]))
    if (w) {
      const lw = w.toLowerCase()
      if (lw.includes("home") || lw === "1" || lw === "h") return "home"
      if (lw.includes("away") || lw === "2" || lw === "a") return "away"
      if (lw.includes("draw") || lw === "x" || lw === "d") return "draw"
    }
    return null
  })()
  if (!winner && hg !== null && ag !== null) {
    winner = hg > ag ? "home" : hg < ag ? "away" : "draw"
  }
  return { winner, homeGoals: hg, awayGoals: ag }
}

export function normalizeStats(matchId: string, raw: unknown): NormalizedStats {
  if (isObj(raw) && typeof (raw as Dict).error === "string") {
    return emptyStats(matchId, raw, (raw as Dict).error as string)
  }

  // stats may be nested under `data`
  const src = isObj(raw) && isObj((raw as Dict).data) ? ((raw as Dict).data as Dict) : raw

  if (!isObj(src)) return emptyStats(matchId, raw)

  const scoredAvgHome = toNum(pick(src, SCORED_HOME))
  const scoredAvgAway = toNum(pick(src, SCORED_AWAY))
  const concededAvgHome = toNum(pick(src, CONCEDED_HOME))
  const concededAvgAway = toNum(pick(src, CONCEDED_AWAY))
  const bttsPotential = toPct(pick(src, BTTS_KEYS))
  const over25Potential = toPct(pick(src, OVER25_KEYS))
  const h2h = readH2H(src)
  const result = readResult(src)

  const recognized =
    scoredAvgHome !== null ||
    scoredAvgAway !== null ||
    bttsPotential !== null ||
    over25Potential !== null ||
    h2h.home !== null

  return {
    matchId,
    scoredAvgHome,
    scoredAvgAway,
    concededAvgHome,
    concededAvgAway,
    bttsPotential,
    over25Potential,
    h2hHomeWins: h2h.home,
    h2hAwayWins: h2h.away,
    h2hDraws: h2h.draws,
    winner: result.winner,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    isRaw: !recognized,
    raw,
  }
}

function emptyStats(matchId: string, raw: unknown, error?: string): NormalizedStats {
  return {
    matchId,
    scoredAvgHome: null,
    scoredAvgAway: null,
    concededAvgHome: null,
    concededAvgAway: null,
    bttsPotential: null,
    over25Potential: null,
    h2hHomeWins: null,
    h2hAwayWins: null,
    h2hDraws: null,
    winner: null,
    homeGoals: null,
    awayGoals: null,
    error,
    isRaw: true,
    raw,
  }
}

/** Normalize the `stats` map from /matches-with-stats (id -> stats | {error}). */
export function normalizeStatsMap(statsMap: unknown): Record<string, NormalizedStats> {
  const out: Record<string, NormalizedStats> = {}
  if (isObj(statsMap)) {
    for (const [id, v] of Object.entries(statsMap)) {
      out[id] = normalizeStats(id, v)
    }
  }
  return out
}
