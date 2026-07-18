import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { DEFAULT_TZ } from "@/lib/config"
import fs from "fs"
import path from "path"

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

  // 1. Try to serve from local static cache if it exists (for speed and stability)
  try {
    const cachePath = path.join(process.cwd(), "public", "data", `cache-${date}.json`)
    if (fs.existsSync(cachePath)) {
      const cachedData = fs.readFileSync(cachePath, "utf-8")
      const parsed = JSON.parse(cachedData)
      
      // If matchIds is specified, we can optionally filter the cached matches/stats to only return those requested.
      // However, returning the whole pre-cached day's file is usually perfectly fine and faster.
      if (parsed && parsed.success) {
        console.log(`Serving cached matches with stats for date: ${date}`)
        return NextResponse.json(parsed)
      }
    }
  } catch (err) {
    console.error("Cache read error:", err)
  }

  // 2. Fall back to upstream fetch
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
