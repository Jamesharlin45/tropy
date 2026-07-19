import { NextResponse } from "next/server"
import { fetchUpstream } from "@/lib/server/upstream"
import { isTopLeague } from "@/lib/leagues"
import { normalizeMatchList, normalizeStatsMap } from "@/lib/normalize"
import { upsertMatch, upsertStats } from "@/lib/db/queries"

// ─── Vercel Cron entry point ──────────────────────────────────────────────────
// Called every 6 hours by Vercel Cron (configured in vercel.json).
// 1. Fetches today + tomorrow from the upstream API
// 2. Flattens league groups, filters to top-tier leagues (max 30 per day)
// 3. Upserts all matches into Supabase `matches` table
// 4. Fetches per-match stats and upserts into `match_stats` table
export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Flatten FootyStats nested league-group response into a flat match array */
function flattenLeagueGroups(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return []
  const b = body as Record<string, unknown>
  // Unwrap one or two levels of { data: { data: [...] } }
  let arr = (b.data ?? b.matches ?? b.fixtures ?? b) as unknown
  if (arr && typeof arr === "object" && !Array.isArray(arr)) {
    const inner = arr as Record<string, unknown>
    arr = inner.data ?? inner.matches ?? inner.fixtures ?? arr
  }
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
        // Inject competition name so normalizer picks it up
        ;(m as Record<string, unknown>).competition_name = compName
        ;(m as Record<string, unknown>).competition_image =
          (g as Record<string, unknown>).competition_image ?? null
        out.push(m)
      }
    }
  }
  return out
}

export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0]

  const results: Record<string, { matchesStored: number; statsStored: number; error?: string }> = {}

  for (const date of [today, tomorrow]) {
    try {
      // ── Step 1: Fetch all matches ──────────────────────────────────────────
      const matchesResult = await fetchUpstream("/matches", { date, tz: "WAT" })
      if (!matchesResult.ok || !matchesResult.body) {
        results[date] = { matchesStored: 0, statsStored: 0, error: "Failed to fetch matches from upstream" }
        continue
      }

      // ── Step 2: Flatten → top leagues only (max 30) ───────────────────────
      const rawFlat = flattenLeagueGroups(matchesResult.body)
      if (rawFlat.length === 0) {
        results[date] = { matchesStored: 0, statsStored: 0, error: "No top-league matches found" }
        continue
      }
      const limited = rawFlat.slice(0, 30)

      // ── Step 3: Normalize & upsert matches ────────────────────────────────
      // Build a synthetic envelope the normalizer understands
      const syntheticEnvelope = { success: true, data: { data: limited } }
      const normalizedMatches = normalizeMatchList(syntheticEnvelope, date)
      const validMatches = normalizedMatches.filter(
        (m) => m.homeName && m.homeName !== "Home" && m.awayName && m.awayName !== "Away",
      )

      await Promise.all(validMatches.map((m) => upsertMatch(m)))

      // ── Step 4: Fetch stats for those match IDs ───────────────────────────
      const matchIds = limited
        .map((m) => {
          const obj = m as Record<string, unknown>
          return obj.id ?? obj.match_id
        })
        .filter(Boolean)
        .join(",")

      let statsStored = 0
      if (matchIds.length > 0) {
        const statsResult = await fetchUpstream("/matches-with-stats", {
          date,
          match_ids: String(matchIds),
          tz: "WAT",
        })

        if (statsResult.ok && statsResult.body) {
          const statsBody = statsResult.body as Record<string, unknown>
          // FootyStats may return stats in multiple shapes; try each
          const rawStats =
            statsBody.stats ??
            statsBody.data ??
            statsBody.matches ??
            statsBody

          if (rawStats && typeof rawStats === "object") {
            const statsMap = normalizeStatsMap(rawStats)
            await Promise.all(
              Object.values(statsMap).map(async (stats) => {
                await upsertStats(stats)
                statsStored++
              }),
            )
          }
        }
      }

      results[date] = { matchesStored: validMatches.length, statsStored }
    } catch (err) {
      results[date] = { matchesStored: 0, statsStored: 0, error: String(err) }
    }
  }

  return NextResponse.json({ ok: true, primed: true, dates: [today, tomorrow], results })
}
