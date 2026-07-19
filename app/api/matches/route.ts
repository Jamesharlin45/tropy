import { NextResponse } from "next/server"
import { DEFAULT_DIVISION, DEFAULT_TZ } from "@/lib/config"
import { getMatchesForDate } from "@/lib/db/queries"
import { fetchUpstream } from "@/lib/server/upstream"
import { normalizeMatchList } from "@/lib/normalize"
import { upsertMatch } from "@/lib/db/queries"
import { isTopLeague } from "@/lib/leagues"

export const dynamic = "force-dynamic"

// GET /api/matches?date=YYYY-MM-DD
// Primary source: Supabase `matches` table.
// Fallback: upstream API (and auto-upserts results into Supabase for next time).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? undefined
  const tz = searchParams.get("tz") ?? DEFAULT_TZ
  const division = searchParams.get("division") ?? DEFAULT_DIVISION

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Missing required 'date' query parameter (YYYY-MM-DD)." },
      { status: 400 },
    )
  }

  // ── 1. Try Supabase first ──────────────────────────────────────────────────
  const dbMatches = await getMatchesForDate(date)
  if (dbMatches.length > 0) {
    return NextResponse.json({ success: true, data: dbMatches, source: "db" })
  }

  // ── 2. Fallback: fetch from upstream + auto-populate DB ───────────────────
  const result = await fetchUpstream("/matches", { date, tz, division })
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.reason ?? "Upstream request failed." },
      { status: result.status || 502 },
    )
  }

  // Normalize and upsert into Supabase in background so next call hits DB
  try {
    const normalized = normalizeMatchList(result.body, date)
    const valid = normalized.filter(
      (m) =>
        m.homeName !== "Home" &&
        m.awayName !== "Away" &&
        m.homeName !== "Unknown" &&
        isTopLeague(m.competition),
    )
    // Fire and forget — don't await to keep response fast
    Promise.all(valid.map((m) => upsertMatch(m))).catch(() => {})
    return NextResponse.json({ success: true, data: valid, source: "upstream" })
  } catch {
    return NextResponse.json(result.body)
  }
}
