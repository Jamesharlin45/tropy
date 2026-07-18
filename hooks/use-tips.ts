"use client"

import useSWR from "swr"
import { fetchMatches, fetchMatchesWithStats } from "@/lib/api"
import { normalizeMatchList } from "@/lib/normalize"
import { buildTips } from "@/lib/build-tips"
import type { MatchTip } from "@/lib/types"

// Fetches fixtures + stats for a date and returns fully-built tips.
async function tipsFetcher(date: string): Promise<MatchTip[]> {
  const matchesEnvelope = await fetchMatches(date)
  const matches = normalizeMatchList(
    matchesEnvelope.data ?? matchesEnvelope.matches,
    date,
  )
  const ids = matches.map((m) => m.id).filter((id) => !!id)

  let statsEnvelope = null
  if (ids.length) {
    try {
      statsEnvelope = await fetchMatchesWithStats(date, ids)
    } catch {
      // Stats are optional — fixtures still render without tips.
      statsEnvelope = null
    }
  }

  return buildTips(date, matchesEnvelope, statsEnvelope)
}

export function useTips(date: string) {
  const { data, error, isLoading, mutate } = useSWR<MatchTip[]>(
    date ? ["tips", date] : null,
    () => tipsFetcher(date),
    { 
      revalidateOnFocus: true, 
      shouldRetryOnError: false,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes in background
    },
  )
  return {
    tips: data ?? [],
    error: error as Error | undefined,
    isLoading,
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
      revalidateOnFocus: true, 
      shouldRetryOnError: false,
      refreshInterval: 10 * 60 * 1000, // Refresh history every 10 mins
    },
  )
  return {
    items: data ?? [],
    error: error as Error | undefined,
    isLoading,
    retry: () => mutate(),
  }
}

// Lightweight per-day count for the date strip badges.
async function countFetcher(date: string): Promise<number> {
  const env = await fetchMatches(date)
  return normalizeMatchList(env.data ?? env.matches, date).length
}

export function useDayCount(date: string, enabled: boolean) {
  const { data } = useSWR<number>(
    enabled && date ? ["count", date] : null,
    () => countFetcher(date),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  return data
}
