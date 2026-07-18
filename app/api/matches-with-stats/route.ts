import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { DEFAULT_TZ } from "@/lib/config"

export const dynamic = "force-dynamic"

// GET /api/matches-with-stats?date=YYYY-MM-DD&match_ids=1,2,3&tz=WAT
// Relays to upstream GET /matches-with-stats.
// Individual stats entries can fail independently upstream; we pass the
// envelope through untouched so the client can check each entry.
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

  // 1. Fetch from upstream (automatically cached by Next.js edge cache)
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
