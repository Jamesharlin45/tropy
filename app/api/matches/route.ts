import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { DEFAULT_DIVISION, DEFAULT_TZ } from "@/lib/config"

export const dynamic = "force-dynamic"

// GET /api/matches?date=YYYY-MM-DD&tz=WAT&division=leagues
// Relays to upstream GET /matches.
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

  // 1. Fetch from upstream (automatically cached by Next.js edge cache)
  const result = await fetchUpstream("/matches", { date, tz, division })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.reason ?? "Upstream request failed." },
      { status: result.status || 502 },
    )
  }

  return NextResponse.json(result.body)
}
