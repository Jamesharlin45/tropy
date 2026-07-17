import { UPSTREAM_BASE_URL } from "@/lib/config"

// Server-side fetch to the upstream HTTP API. Runs on the server (Vercel),
// where egress to arbitrary HTTP ports is allowed, so it bypasses the
// browser's mixed-content and CORS restrictions.
//
// Always resolves to a JSON-serializable object. On failure it returns a
// specific reason string rather than throwing, so route handlers can surface
// the exact cause to the client instead of a generic error.
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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        // Some hosts reject requests without a browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (compatible; TropyGames/1.0; +https://tropy.games)",
      },
      signal: controller.signal,
      cache: "no-store",
    })

    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : {}
    } catch {
      // Upstream returned non-JSON (e.g. HTML error page). Surface a snippet.
      return {
        ok: false,
        status: res.status,
        body: null,
        reason: `Upstream returned non-JSON (status ${res.status}): ${text.slice(0, 180)}`,
      }
    }

    if (!res.ok) {
      const upstreamErr =
        (parsed as { error?: string })?.error ?? `Upstream HTTP ${res.status}`
      return { ok: false, status: res.status, body: parsed, reason: upstreamErr }
    }

    return { ok: true, status: res.status, body: parsed }
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      ok: false,
      status: 502,
      body: null,
      reason: isAbort
        ? "Upstream request timed out after 20s"
        : `Cannot reach upstream API: ${err instanceof Error ? err.message : String(err)}`,
    }
  } finally {
    clearTimeout(timeout)
  }
}
