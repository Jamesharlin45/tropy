// Local browser cache for match tips — persists across page reloads via localStorage.
// Allows the app to serve cached data instantly on mount, then background-refresh
// only when data is stale (>2 hours). Failures during refresh never wipe the cache.

import type { MatchTip } from "./types"

const CACHE_VERSION = "v2"
const STALE_MS = 2 * 60 * 60 * 1000 // 2 hours

interface CacheEntry {
  version: string
  tips: MatchTip[]
  lastFetchedAt: number // epoch ms
}

function cacheKey(date: string): string {
  return `tropy_tips_${CACHE_VERSION}_${date}`
}

/** Read cached tips for a date. Returns null if absent, expired is left to the caller. */
export function readCache(date: string): CacheEntry | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(cacheKey(date))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.version !== CACHE_VERSION) return null
    return entry
  } catch {
    return null
  }
}

/** Write tips + timestamp to localStorage. Silently swallows quota errors. */
export function writeCache(date: string, tips: MatchTip[]): void {
  if (typeof window === "undefined") return
  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      tips,
      lastFetchedAt: Date.now(),
    }
    localStorage.setItem(cacheKey(date), JSON.stringify(entry))
  } catch {
    // Silently ignore QuotaExceededError — cache is best-effort
  }
}

/** True when cached data is older than 2 hours (or absent). */
export function isCacheStale(entry: CacheEntry | null): boolean {
  if (!entry) return true
  return Date.now() - entry.lastFetchedAt > STALE_MS
}

/** Prune cache entries older than 7 days to avoid filling up localStorage. */
export function pruneOldCache(): void {
  if (typeof window === "undefined") return
  try {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (!key?.startsWith("tropy_tips_")) continue
      try {
        const entry = JSON.parse(localStorage.getItem(key) ?? "{}") as Partial<CacheEntry>
        if (entry.lastFetchedAt && now - entry.lastFetchedAt > sevenDaysMs) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key!)
      }
    }
  } catch {
    // ignore
  }
}
