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
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  return {
    tips: data ?? [],
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
