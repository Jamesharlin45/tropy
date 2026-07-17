// Central configuration for the upstream football data API.
// The upstream API is plain HTTP on a non-standard port, so all browser
// requests are routed through our same-origin Next.js relay (see app/api/*).
// This solves both mixed-content blocking (HTTPS page -> HTTP API) and CORS.

export const UPSTREAM_BASE_URL =
  process.env.TROPY_UPSTREAM_URL?.replace(/\/$/, "") ??
  "http://us3.bot-hosting.net:20562"

// Default timezone used across the app for fixture listings.
export const DEFAULT_TZ = "WAT"
export const DEFAULT_DIVISION = "leagues"
