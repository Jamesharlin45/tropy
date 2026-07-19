import { UPSTREAM_BASE_URL } from "@/lib/config"

// Server-side fetch to the upstream HTTP API. Runs on the server (Vercel),
// where egress to arbitrary HTTP ports is allowed.

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

export async function fetchUpstream(
  path: string,
  searchParams: Record<string, string | undefined>,
): Promise<{ ok: boolean; status: number; body: unknown; reason?: string }> {
  const url = new URL(UPSTREAM_BASE_URL + path)
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value)
    }
  }

  let attempt = 0
  
  while (attempt <= MAX_RETRIES) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000) // 25s timeout
    
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; TropyGames/1.0; +https://tropy.games)",
        },
        signal: controller.signal,
        // No cache directive here as we need fresh data if we're retrying, 
        // caching is handled in the application layer / DB layer.
      })
      
      clearTimeout(timeout)

      // Only retry temporary failures (502, 503, 504). Don't retry 4xx errors.
      if (!res.ok) {
        if ([502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
          throw new Error(`Temporary HTTP error ${res.status}`) // Trigger catch block to retry
        }
        
        // Safe parsing for non-retryable errors
        const text = await res.text()
        let parsed: any = {}
        try { parsed = JSON.parse(text) } catch { /* ignore */ }
        
        return { 
          ok: false, 
          status: res.status, 
          body: parsed, 
          reason: parsed.error ?? `HTTP ${res.status}: ${res.statusText}` 
        }
      }

      // Success
      const text = await res.text()
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        if (attempt < MAX_RETRIES) throw new Error("Invalid JSON response")
        return {
          ok: false,
          status: 500,
          body: null,
          reason: `Upstream returned non-JSON: ${text.slice(0, 180)}`,
        }
      }
      
      // Verify data.success is somewhat truthy if it exists
      if (parsed && typeof parsed === 'object' && parsed.success === false) {
          return {
              ok: false,
              status: 400,
              body: parsed,
              reason: parsed.error || "Upstream returned success: false"
          }
      }

      return { ok: true, status: res.status, body: parsed }
      
    } catch (err) {
      clearTimeout(timeout)
      
      const isAbort = err instanceof Error && err.name === "AbortError"
      const isRetryable = isAbort || (err instanceof Error && (
        err.message.includes('fetch failed') || 
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('Temporary HTTP error') ||
        err.message.includes('Invalid JSON')
      ))

      if (!isRetryable || attempt >= MAX_RETRIES) {
         return {
          ok: false,
          status: isAbort ? 504 : 502,
          body: null,
          reason: isAbort
            ? "Upstream request timed out after 25s"
            : `Cannot reach upstream API: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
      
      // Exponential backoff
      attempt++
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)))
    }
  }
  
  return { ok: false, status: 500, body: null, reason: "Max retries exceeded" }
}
