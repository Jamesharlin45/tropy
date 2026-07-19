import { NextResponse } from "next/server"
import { DEFAULT_TZ } from "@/lib/config"
import { getMatchesForDate, getStatsMap } from "@/lib/db/queries"
import { fetchUpstream } from "@/lib/server/upstream"

export const dynamic = "force-dynamic"

// GET /api/matches-with-stats?date=YYYY-MM-DD&match_ids=1,2,3
// Primary source: Supabase `matches` + `match_stats` tables joined.
// Fallback: upstream /matches-with-stats endpoint.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? undefined
  const matchIds = searchParams.get("match_ids") ?? undefined
  const tz = searchParams.get("tz") ?? DEFAULT_TZ

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Missing required 'date' query parameter (YYYY-MM-DD)." },
      { status: 400 },
    )
  }

  // ── 1. Try Supabase ────────────────────────────────────────────────────────
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

  // ── 2. Fallback: upstream ─────────────────────────────────────────────────
  const result = await fetchUpstream("/matches-with-stats", {
    date,
    match_ids: matchIds,
    tz,
  })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.reason ?? "Upstream request failed." },
      { status: result.status || 502 },
    )
  }

  return NextResponse.json(result.body)
}
