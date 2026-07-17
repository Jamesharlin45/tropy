// Date helpers. All app-facing dates use the YYYY-MM-DD string form.

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(s: string, n: number): string {
  const d = parseDateStr(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

/** Build a window of date strings from -before to +after around a base date. */
export function dateWindow(base: string, before: number, after: number): string[] {
  const out: string[] = []
  for (let i = -before; i <= after; i++) out.push(addDays(base, i))
  return out
}

export interface DateParts {
  month: string // MMM
  weekday: string // EEE
  day: string // D
}

export function dateParts(s: string, locale: string): DateParts {
  const d = parseDateStr(s)
  return {
    month: new Intl.DateTimeFormat(locale, { month: "short" }).format(d),
    weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d),
    day: String(d.getDate()),
  }
}
