"use client"

import { useEffect, useRef, useState } from "react"
import { fetchMatchesWithStats } from "@/lib/api"
import { buildTipsFromNormalized } from "@/lib/build-tips"
import { readCache, writeCache, isCacheStale, pruneOldCache } from "@/lib/local-cache"
import type { MatchTip, NormalizedMatch, NormalizedStats } from "@/lib/types"

// ─── Network fetcher ──────────────────────────────────────────────────────────
// Calls our Next.js relay (/api/matches-with-stats) which reads from Supabase
// (falling back to the upstream API if the DB has no rows for that date).
async function fetchTipsFromNetwork(date: string): Promise<MatchTip[]> {
  const envelope = await fetchMatchesWithStats(date, [])
  const env = envelope as Record<string, unknown>

  // DB path — data is already normalized
  if (env.source === "db" && Array.isArray(env.data)) {
    const matches = env.data as NormalizedMatch[]
    const statsMap = (env.stats ?? {}) as Record<string, NormalizedStats>
    return buildTipsFromNormalized(date, null, null, matches, statsMap)
  }

  // Upstream fallback — normalize from the raw FootyStats envelope
  return buildTipsFromNormalized(date, envelope, null)
}

// ─── useTips ─────────────────────────────────────────────────────────────────
// Cache-first strategy:
//   1. On mount → serve from localStorage immediately (zero loading flash)
//   2. If cache is stale (>2 hours) → background fetch from network
//   3. On success → update both state AND cache
//   4. On failure → keep showing cached data, never blank the screen
//   5. Manual retry → always triggers a network fetch regardless of staleness
export function useTips(date: string) {
  const [tips, setTips] = useState<MatchTip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)

  // Ref to track the current date to avoid stale-closure issues
  const dateRef = useRef(date)
  dateRef.current = date

  // ─── Mount: load from cache immediately ──────────────────────────────────
  useEffect(() => {
    pruneOldCache() // housekeeping, non-blocking

    const cached = readCache(date)
    if (cached && cached.tips.length > 0) {
      setTips(cached.tips)
      setLastFetchedAt(cached.lastFetchedAt)
      setIsLoading(false) // cache hit — no loading spinner needed
    } else {
      setIsLoading(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // ─── Background refresh when data is stale ────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const cached = readCache(date)
      const stale = isCacheStale(cached)

      // If cache is fresh, skip the network call entirely
      if (!stale && cached && cached.tips.length > 0) {
        setIsLoading(false)
        return
      }

      // Only show a spinner when we have NO cached data at all
      const hasCachedData = cached && cached.tips.length > 0
      if (!hasCachedData) setIsLoading(true)

      try {
        const fresh = await fetchTipsFromNetwork(date)
        if (cancelled || dateRef.current !== date) return

        if (fresh.length > 0) {
          setTips(fresh)
          writeCache(date, fresh)
          setLastFetchedAt(Date.now())
          setError(undefined) // clear any previous error
        }
      } catch (err) {
        if (cancelled || dateRef.current !== date) return
        // ⚠️ On failure, NEVER clear cached data.
        // Only surface the error if we have nothing to show.
        const stillCached = readCache(date)
        if (!stillCached || stillCached.tips.length === 0) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
        // else: silently ignore — user keeps seeing cached data
      } finally {
        if (!cancelled && dateRef.current === date) setIsLoading(false)
      }
    }

    refresh()

    // Re-run background refresh every 2 hours (same as cache TTL)
    const interval = setInterval(refresh, 2 * 60 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // ─── Manual retry ─────────────────────────────────────────────────────────
  async function retry() {
    setError(undefined)
    setIsLoading(true)
    try {
      const fresh = await fetchTipsFromNetwork(date)
      if (fresh.length > 0) {
        setTips(fresh)
        writeCache(date, fresh)
        setLastFetchedAt(Date.now())
      }
    } catch (err) {
      // Only show error if we have nothing to show
      if (tips.length === 0) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { tips, error, isLoading, lastFetchedAt, retry }
}

// ─── useHistory ───────────────────────────────────────────────────────────────
// Simple multi-date wrapper — reads from cache first, then background-refreshes.
export function useHistory(dates: string[]) {
  const [items, setItems] = useState<MatchTip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      // Serve cache immediately for all dates
      const cached = dates.flatMap((d) => readCache(d)?.tips ?? [])
      const resolved = cached.filter((it) => it.status !== "pending" && it.tip)
        .sort((a, b) => (b.match.kickoffUnix ?? 0) - (a.match.kickoffUnix ?? 0))
      if (resolved.length > 0) {
        setItems(resolved)
        setIsLoading(false)
      }

      // Background fetch stale dates
      const staleDates = dates.filter((d) => isCacheStale(readCache(d)))
      const results = await Promise.allSettled(staleDates.map((d) => fetchTipsFromNetwork(d)))
      if (cancelled) return

      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.length > 0) {
          writeCache(staleDates[i], r.value)
        }
      })

      const fresh = dates.flatMap((d) => readCache(d)?.tips ?? [])
      const freshResolved = fresh.filter((it) => it.status !== "pending" && it.tip)
        .sort((a, b) => (b.match.kickoffUnix ?? 0) - (a.match.kickoffUnix ?? 0))
      if (!cancelled) {
        setItems(freshResolved)
        setIsLoading(false)
      }
    }

    if (dates.length > 0) load().catch((e) => { if (!cancelled) setError(e) })
    else setIsLoading(false)

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.join(",")])

  return { items, error, isLoading, retry: () => {} }
}

// ─── useDayCount ──────────────────────────────────────────────────────────────
// Returns the count of tips for a date, served from cache if available.
export function useDayCount(date: string, enabled: boolean): number | undefined {
  const [count, setCount] = useState<number | undefined>(() => {
    if (!enabled || !date) return undefined
    const cached = readCache(date)
    return cached ? cached.tips.length : undefined
  })

  useEffect(() => {
    if (!enabled || !date) return
    const cached = readCache(date)
    if (cached) setCount(cached.tips.length)
  }, [date, enabled])

  return count
}
