import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"

export const dynamic = "force-dynamic"

// GET /api/match-stats?match_id=12345
// Relays to upstream GET /match-stats.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("match_id") ?? undefined

  if (!matchId) {
    return NextResponse.json(
      { success: false, error: "Missing required 'match_id' query parameter." },
      { status: 400 },
    )
  }

  const result = await fetchUpstream("/match-stats", { match_id: matchId })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.reason ?? "Upstream request failed." },
      { status: result.status || 502 },
    )
  }

  return NextResponse.json(result.body)
}
