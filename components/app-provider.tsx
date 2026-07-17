"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { translate, type LangCode } from "@/lib/i18n"
import { themeStyle, type ThemeId } from "@/lib/theme"

interface AppContextValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  theme: ThemeId
  setTheme: (id: ThemeId) => void
  tracked: Set<string>
  toggleTrack: (id: string) => void
  isTracked: (id: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // In-memory state only (no localStorage), per spec.
  const [lang, setLang] = useState<LangCode>("en")
  const [theme, setTheme] = useState<ThemeId>("midnight-gold")
  const [tracked, setTracked] = useState<Set<string>>(() => new Set())

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )

  const toggleTrack = useCallback((id: string) => {
    setTracked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isTracked = useCallback((id: string) => tracked.has(id), [tracked])

  const value = useMemo<AppContextValue>(
    () => ({ lang, setLang, t, theme, setTheme, tracked, toggleTrack, isTracked }),
    [lang, t, theme, tracked, toggleTrack, isTracked],
  )

  return (
    <AppContext.Provider value={value}>
      <div
        data-theme={theme}
        style={themeStyle(theme)}
        className="min-h-screen bg-[var(--tp-bg)] text-[var(--tp-text)] transition-colors duration-300"
      >
        {children}
      </div>
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
