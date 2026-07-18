import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { isTopLeague } from "@/lib/leagues"
import fs from "fs"
import path from "path"

// This route is called by Vercel Cron every 6 hours.
// It pre-fetches, filters, and caches today's top-league matches.
// Vercel cron config is in vercel.json.
export const dynamic = "force-dynamic"
export const maxDuration = 30

/** Flatten FootyStats nested league-group response into a flat match array */
function flattenMatches(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return []
  const b = body as Record<string, unknown>
  const outer = (b.data ?? b.matches ?? b.fixtures ?? b) as Record<string, unknown>
  const arr = (outer?.data ?? outer?.matches ?? outer?.fixtures ?? outer) as unknown[]
  if (!Array.isArray(arr)) return []

  const out: unknown[] = []
  for (const group of arr) {
    if (!group || typeof group !== "object") continue
    const g = group as Record<string, unknown>
    const compName = String(g.name ?? g.title ?? "")
    if (!isTopLeague(compName)) continue
    const matches = g.matches ?? g.fixtures
    if (!Array.isArray(matches)) continue
    for (const m of matches) {
      if (typeof m === "object" && m !== null) {
        // Inject competition name into match object
        ;(m as Record<string, unknown>).competition_name = compName
        out.push(m)
      }
    }
  }
  return out
}

export async function GET(request: Request) {
  // Validate cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]

  const results: Record<string, { matches: number; cached: boolean; error?: string }> = {}

  for (const date of [today, tomorrow]) {
    try {
      // 1. Fetch all matches for this date
      const matchesResult = await fetchUpstream("/matches", { date, tz: "WAT" })
      if (!matchesResult.ok || !matchesResult.body) {
        results[date] = { matches: 0, cached: false, error: "Failed to fetch matches" }
        continue
      }

      const flatMatches = flattenMatches(matchesResult.body)
      if (flatMatches.length === 0) {
        results[date] = { matches: 0, cached: false, error: "No top-league matches found" }
        continue
      }

      // 2. Extract IDs (up to 30)
      const matchIds = flatMatches
        .slice(0, 30)
        .map((m) => {
          const obj = m as Record<string, unknown>
          return obj.id ?? obj.match_id
        })
        .filter(Boolean)
        .join(",")

      // 3. Fetch matches-with-stats for those IDs
      const statsResult = await fetchUpstream("/matches-with-stats", {
        date,
        match_ids: matchIds,
        tz: "WAT",
      })

      const payload = statsResult.ok ? statsResult.body : { success: true, data: flatMatches }

      // 4. Write cache file
      const cacheDir = path.join(process.cwd(), "public", "data")
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(
        path.join(cacheDir, `cache-${date}.json`),
        JSON.stringify(payload, null, 0), // compact JSON for smaller file
        "utf-8",
      )

      results[date] = { matches: flatMatches.length, cached: true }
    } catch (err) {
      results[date] = { matches: 0, cached: false, error: String(err) }
    }
  }

  return NextResponse.json({ ok: true, date: today, results })
}
