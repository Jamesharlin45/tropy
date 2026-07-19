import { NextResponse } from "next/server"
import { DEFAULT_TZ } from "@/lib/config"
import { getMatchesForDate, getStatsMap } from "@/lib/db/queries"
import { fetchUpstream } from "@/lib/server/upstream"

export const dynamic = "force-dynamic"

// Top-tier leagues for ranking
const TOP_LEAGUES = [
  "world cup", "euro", "copa america", "nations league",
  "champions league", "europa league", "conference league",
  "premier league", "championship", "fa cup", "efl cup",
  "la liga", "laliga", "copa del rey",
  "bundesliga", "dfb pokal",
  "serie a", "coppa italia",
  "ligue 1", "coupe de france",
  "primeira liga", "liga portugal",
  "eredivisie",
  "scottish premiership", "scottish league cup",
  "super lig",
  "brasileirao", "copa argentina", "liga profesional",
  "caf champions league", "afcon",
  "mls", "saudi pro league",
  "international friendlies",
]

function getLeaguePriority(name: string): number {
  if (!name) return 0
  const lower = name.toLowerCase()
  if (TOP_LEAGUES.some(l => lower.includes(l))) return 10
  if (lower.includes("pro") || lower.includes("1") || lower.includes("a") || lower.includes("premier")) return 5
  if (lower.includes("youth") || lower.includes("u21") || lower.includes("u19") || lower.includes("reserve") || lower.includes("amateur") || lower.includes("women")) return -5
  return 1 // Medium priority default
}

// GET /api/matches-with-stats?date=YYYY-MM-DD
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? undefined
  const tz = searchParams.get("tz") ?? "EAT" // Default to EAT as requested

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Missing required 'date' query parameter (YYYY-MM-DD)." },
      { status: 400 },
    )
  }

  // ── 1. Try Supabase ────────────────────────────────────────────────────────
  try {
    const [dbMatches, dbStats] = await Promise.all([
      getMatchesForDate(date),
      getStatsMap(date),
    ])

    if (dbMatches.length > 0) {
      return NextResponse.json({
        success: true,
        data: dbMatches,
        stats: dbStats,
        source: "db",
      })
    }
  } catch (err) {
    console.error("Supabase check failed, falling back to upstream:", err)
  }

  // ── 2. Fallback: 2-Pass Upstream Fetch ────────────────────────────────────
  console.log(`[API] Fetching matches for ${date} from upstream...`)
  
  // Pass 1: Get all matches for the date
  const matchesResult = await fetchUpstream("/matches", { date, tz })
  
  if (!matchesResult.ok) {
    return NextResponse.json(
      { success: false, error: matchesResult.reason ?? "Upstream request failed." },
      { status: matchesResult.status || 502 },
    )
  }

  const body = matchesResult.body as any
  const outerData = body?.data ?? body?.matches ?? body?.fixtures ?? body
  const dataArr = outerData?.data ?? outerData?.matches ?? outerData?.fixtures ?? outerData

  if (!dataArr || !Array.isArray(dataArr)) {
    return NextResponse.json(
      { success: false, error: "Invalid matches format returned from upstream." },
      { status: 502 },
    )
  }

  // Flatten and filter
  let allMatches: any[] = []
  
  for (const group of dataArr) {
    const compName = group.name || group.title || ''
    const matches = group.matches || group.fixtures || []
    
    if (matches.length === 0 && group.id) {
       // Flat array structure
       allMatches.push(group)
       continue
    }

    for (const m of matches) {
      if (!m.competition_name && !m.competition && !m.league_name) {
          m.competition_name = compName
      }
      allMatches.push(m)
    }
  }

  // Filter valid matches
  const validMatches = allMatches.filter(m => {
    const id = m.id || m.match_id || m.matchId
    const home = m.home_name || m.homeName || m.team_a_name
    const away = m.away_name || m.awayName || m.team_b_name
    const time = m.date_unix || m.kickoff_unix || m.time || m.status
    return id && home && away && time
  })

  // Rank matches
  validMatches.sort((a, b) => {
    const aComp = a.competition_name || a.competition || a.league_name || ""
    const bComp = b.competition_name || b.competition || b.league_name || ""
    const aScore = getLeaguePriority(aComp)
    const bScore = getLeaguePriority(bComp)
    return bScore - aScore
  })

  // Take top 10
  const selectedMatches = validMatches.slice(0, 10)
  const selectedIds = selectedMatches.map(m => m.id || m.match_id || m.matchId)

  console.log(`[API] Daily matches found: ${validMatches.length}`)
  console.log(`[API] Important matches selected: ${selectedMatches.length}`)
  console.log(`[API] Selected match IDs: ${selectedIds.join(",")}`)

  if (selectedIds.length === 0) {
    return NextResponse.json({ success: true, data: [], stats: {}, source: "upstream" })
  }

  // Pass 2: Bulk fetch stats
  const statsResult = await fetchUpstream("/matches-with-stats", { 
    date, 
    match_ids: selectedIds.join(","), 
    tz 
  })

  if (!statsResult.ok) {
    return NextResponse.json(
      { success: false, error: statsResult.reason ?? "Upstream stats request failed." },
      { status: statsResult.status || 502 },
    )
  }

  const statsBody = statsResult.body as any
  
  // Safe filtering of partial errors in stats
  let validStats: Record<string, any> = {}
  if (statsBody.stats && typeof statsBody.stats === "object") {
      validStats = Object.fromEntries(
        Object.entries(statsBody.stats).filter(([_, stat]) => stat && !(stat as any).error)
      )
  }

  return NextResponse.json({
    success: true,
    data: statsBody.data ?? statsBody.matches ?? statsBody.fixtures ?? statsBody,
    stats: validStats,
    source: "upstream"
  })
}
