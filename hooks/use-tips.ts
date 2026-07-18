"use client"

import useSWR from "swr"
import { fetchMatches, fetchMatchesWithStats } from "@/lib/api"
import { normalizeMatchList } from "@/lib/normalize"
import { buildTips } from "@/lib/build-tips"
import type { MatchTip } from "@/lib/types"

// Fetches fixtures + stats for a date and returns fully-built tips.
async function tipsFetcher(date: string): Promise<MatchTip[]> {
  const matchesEnvelope = await fetchMatches(date)
  // Pass the FULL envelope — normalizeMatchList knows how to unwrap nested data.data
  const matches = normalizeMatchList(matchesEnvelope, date)
  
  // Filter out matches where normalization couldn't find recognizable team names
  const validMatches = matches.filter(m => !(m.homeName === 'Home' && m.awayName === 'Away'))
  
  const ids = validMatches.map((m) => m.id).filter((id) => !!id)

  let statsEnvelope = null
  if (ids.length) {
    try {
      statsEnvelope = await fetchMatchesWithStats(date, ids)
    } catch {
      // Stats are optional — fixtures still render without tips.
      statsEnvelope = null
    }
  }

  // Build tips but only for validMatches
  const allTips = buildTips(date, matchesEnvelope, statsEnvelope)
  // Only return tips that have real team names
  return allTips.filter(t => !(t.match.homeName === 'Home' && t.match.awayName === 'Away'))
}

export function useTips(date: string) {
  const { data, error, isLoading, mutate } = useSWR<MatchTip[]>(
    date ? ["tips", date] : null,
    () => tipsFetcher(date),
    { 
      revalidateOnFocus: false,        // Don't refetch just by switching tabs
      shouldRetryOnError: false,
      keepPreviousData: true,          // Show stale data while loading fresh — prevents blank flicker
      refreshInterval: 6 * 60 * 1000, // Background refresh every 6 minutes
      dedupingInterval: 60 * 1000,     // Don't duplicate fetches within 1 minute
    },
  )
  return {
    tips: data ?? [],
    error: error as Error | undefined,
    isLoading: isLoading && !data,     // Only show loading spinner when there is NO cached data
    retry: () => mutate(),
  }
}

// History: gather resolved tips across a window of past days.
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
  // newest first, only resolved outcomes
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

// Lightweight per-day count for the date strip badges.
async function countFetcher(date: string): Promise<number> {
  const env = await fetchMatches(date)
  return normalizeMatchList(env, date).filter(m => !(m.homeName === 'Home' && m.awayName === 'Away')).length
}

export function useDayCount(date: string, enabled: boolean) {
  const { data } = useSWR<number>(
    enabled && date ? ["count", date] : null,
    () => countFetcher(date),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  return data
}
