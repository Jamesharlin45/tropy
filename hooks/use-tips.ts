"use client"

import useSWR from "swr"
import { fetchMatchesWithStats } from "@/lib/api"
import { buildTipsFromNormalized } from "@/lib/build-tips"
import type { MatchTip, NormalizedMatch, NormalizedStats } from "@/lib/types"

// ─── Fetcher ─────────────────────────────────────────────────────────────────
// Calls /api/matches-with-stats (which now reads from Supabase).
// Returns fully-built MatchTip[] ready for the UI.
async function tipsFetcher(date: string): Promise<MatchTip[]> {
  let envelope
  try {
    // Pass empty match_ids — the DB route ignores them and returns all for the date
    envelope = await fetchMatchesWithStats(date, [])
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
    if (
      msg.includes("network") ||
      msg.includes("502") ||
      msg.includes("upstream") ||
      msg.includes("failed") ||
      msg.includes("refused") ||
      msg.includes("unavailable")
    ) {
      throw new Error("Data feed temporarily unavailable. Please try again in a moment.")
    }
    throw err
  }

  // The DB route returns { success, data: NormalizedMatch[], stats: Record<string,NormalizedStats> }
  // The upstream fallback returns the raw FootyStats envelope.
  // We support both shapes here.
  const env = envelope as Record<string, unknown>

  let matches: NormalizedMatch[] = []
  let statsMap: Record<string, NormalizedStats> = {}

  if (env.source === "db" && Array.isArray(env.data)) {
    // DB path — already normalized
    matches = env.data as NormalizedMatch[]
    statsMap = (env.stats ?? {}) as Record<string, NormalizedStats>
  } else {
    // Upstream fallback — use existing normalize logic via buildTipsFromNormalized
    return buildTipsFromNormalized(date, envelope, null)
  }

  // Build tips from normalized DB data
  return buildTipsFromNormalized(date, null, null, matches, statsMap)
}

export function useTips(date: string) {
  const { data, error, isLoading, mutate } = useSWR<MatchTip[]>(
    date ? ["tips", date] : null,
    () => tipsFetcher(date),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 15000,
      keepPreviousData: true,
      refreshInterval: 6 * 60 * 1000,
      dedupingInterval: 60 * 1000,
    },
  )
  return {
    tips: data ?? [],
    error: error as Error | undefined,
    isLoading: isLoading && !data,
    retry: () => mutate(),
  }
}

// ─── History ──────────────────────────────────────────────────────────────────
async function historyFetcher(dates: string[]): Promise<MatchTip[]> {
  const results = await Promise.all(
    dates.map(async (date) => {
      try {
        return await tipsFetcher(date)
      } catch {
        return [] as MatchTip[]
      }
    }),
  )
  return results
    .flat()
    .filter((it) => it.status !== "pending" && it.tip)
    .sort((a, b) => (b.match.kickoffUnix ?? 0) - (a.match.kickoffUnix ?? 0))
}

export function useHistory(dates: string[]) {
  const key = dates.length ? ["history", dates.join(",")] : null
  const { data, error, isLoading, mutate } = useSWR<MatchTip[]>(
    key,
    () => historyFetcher(dates),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
      refreshInterval: 10 * 60 * 1000,
    },
  )
  return {
    items: data ?? [],
    error: error as Error | undefined,
    isLoading: isLoading && !data,
    retry: () => mutate(),
  }
}

// ─── Day count (for date strip badges) ───────────────────────────────────────
async function countFetcher(date: string): Promise<number> {
  try {
    const tips = await tipsFetcher(date)
    return tips.length
  } catch {
    return 0
  }
}

export function useDayCount(date: string, enabled: boolean) {
  const { data } = useSWR<number>(
    enabled && date ? ["count", date] : null,
    () => countFetcher(date),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  return data
}
