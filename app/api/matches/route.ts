import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { DEFAULT_DIVISION, DEFAULT_TZ } from "@/lib/config"
import fs from "fs"
import path from "path"

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

  // 1. Try to serve from local static cache if it exists (for speed and stability)
  try {
    const cachePath = path.join(process.cwd(), "public", "data", `cache-${date}.json`)
    if (fs.existsSync(cachePath)) {
      const cachedData = fs.readFileSync(cachePath, "utf-8")
      const parsed = JSON.parse(cachedData)
      if (parsed && parsed.success) {
        console.log(`Serving cached matches for date: ${date}`)
        const matches = parsed.data ?? parsed.matches ?? parsed.fixtures ?? []
        return NextResponse.json({ success: true, data: matches })
      }
    }
  } catch (err) {
    console.error("Cache read error:", err)
  }

  // 2. Fall back to upstream fetch
  const result = await fetchUpstream("/matches", { date, tz, division })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.reason ?? "Upstream request failed." },
      { status: result.status || 502 },
    )
  }

  return NextResponse.json(result.body)
}
