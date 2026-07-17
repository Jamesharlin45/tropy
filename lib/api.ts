import { DEFAULT_DIVISION, DEFAULT_TZ } from "./config"

// Client-side fetch wrappers. These call our same-origin relay (/api/*),
// which proxies to the upstream HTTP API. Every wrapper normalizes errors into
// a thrown Error with a specific, human-readable message.

export interface Envelope {
  success: boolean
  error?: string
  [key: string]: unknown
}

async function getJson(url: string): Promise<Envelope> {
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } })
  } catch (err) {
    throw new Error(
      `Network error contacting relay: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  let body: Envelope
  try {
    body = (await res.json()) as Envelope
  } catch {
    throw new Error(`Relay returned an invalid response (HTTP ${res.status}).`)
  }

  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Request failed (HTTP ${res.status}).`)
  }
  return body
}

export function fetchMatches(
  date: string,
  opts?: { tz?: string; division?: string },
): Promise<Envelope> {
  const params = new URLSearchParams({
    date,
    tz: opts?.tz ?? DEFAULT_TZ,
    division: opts?.division ?? DEFAULT_DIVISION,
  })
  return getJson(`/api/matches?${params.toString()}`)
}

export function fetchMatchStats(matchId: string): Promise<Envelope> {
  const params = new URLSearchParams({ match_id: matchId })
  return getJson(`/api/match-stats?${params.toString()}`)
}

export function fetchMatchesWithStats(
  date: string,
  matchIds: string[],
  opts?: { tz?: string },
): Promise<Envelope> {
  const params = new URLSearchParams({
    date,
    tz: opts?.tz ?? DEFAULT_TZ,
  })
  if (matchIds.length) params.set("match_ids", matchIds.join(","))
  return getJson(`/api/matches-with-stats?${params.toString()}`)
}
