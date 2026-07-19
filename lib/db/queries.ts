import { supabase } from "./client"
import type { NormalizedMatch, NormalizedStats } from "@/lib/types"

// ─── Upsert helpers ──────────────────────────────────────────────────────────

export async function upsertMatch(match: NormalizedMatch): Promise<void> {
  const { error } = await supabase.from("matches").upsert(
    {
      id: match.id,
      date: match.dateStr,
      home_name: match.homeName,
      home_logo: match.homeLogo ?? null,
      away_name: match.awayName,
      away_logo: match.awayLogo ?? null,
      competition: match.competition,
      competition_logo: match.competitionLogo ?? null,
      kickoff_unix: match.kickoffUnix,
      kickoff_label: match.kickoffLabel,
      raw: match.raw as object,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )
  if (error) console.error("[upsertMatch] error:", error.message)
}

export async function upsertStats(stats: NormalizedStats): Promise<void> {
  const raw = (stats.raw ?? {}) as Record<string, unknown>
  const { error } = await supabase.from("match_stats").upsert(
    {
      match_id: stats.matchId,
      // Extract date from raw if available
      date: (raw.date_unix
        ? new Date((raw.date_unix as number) * 1000).toISOString().slice(0, 10)
        : null) ?? new Date().toISOString().slice(0, 10),
      over25_potential: stats.over25Potential,
      under25_potential: raw.u25_potential != null ? Number(raw.u25_potential) : null,
      over15_potential: raw.o15_potential != null ? Number(raw.o15_potential) : null,
      over35_potential: raw.o35_potential != null ? Number(raw.o35_potential) : null,
      over05_potential: raw.o05_potential != null ? Number(raw.o05_potential) : null,
      over05ht_potential: raw.o05HT_potential != null ? Number(raw.o05HT_potential) : null,
      btts_potential: stats.bttsPotential,
      corners_o85: raw.corners_o85_potential != null ? Number(raw.corners_o85_potential) : null,
      corners_o95: raw.corners_o95_potential != null ? Number(raw.corners_o95_potential) : null,
      scored_avg_home: stats.scoredAvgHome,
      scored_avg_away: stats.scoredAvgAway,
      conceded_avg_home: stats.concededAvgHome,
      conceded_avg_away: stats.concededAvgAway,
      home_ppg: raw.home_ppg != null ? Number(raw.home_ppg) : null,
      away_ppg: raw.away_ppg != null ? Number(raw.away_ppg) : null,
      h2h_home_wins: stats.h2hHomeWins,
      h2h_away_wins: stats.h2hAwayWins,
      h2h_draws: stats.h2hDraws,
      winner: stats.winner,
      home_goals: stats.homeGoals,
      away_goals: stats.awayGoals,
      raw: stats.raw as object,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  )
  if (error) console.error("[upsertStats] error:", error.message)
}

// ─── Read helpers ────────────────────────────────────────────────────────────

export async function getMatchesForDate(date: string): Promise<NormalizedMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("date", date)
    .order("kickoff_unix", { ascending: true })

  if (error) {
    console.error("[getMatchesForDate] error:", error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    homeName: row.home_name,
    homeLogo: row.home_logo ?? undefined,
    awayName: row.away_name,
    awayLogo: row.away_logo ?? undefined,
    competition: row.competition,
    competitionLogo: row.competition_logo ?? undefined,
    kickoffUnix: row.kickoff_unix ?? null,
    kickoffLabel: row.kickoff_label ?? "",
    dateStr: row.date,
    isRaw: false,
    raw: row.raw,
  }))
}

export async function getStatsMap(
  date: string,
): Promise<Record<string, NormalizedStats>> {
  const { data, error } = await supabase
    .from("match_stats")
    .select("*")
    .eq("date", date)

  if (error) {
    console.error("[getStatsMap] error:", error.message)
    return {}
  }

  const map: Record<string, NormalizedStats> = {}
  for (const row of data ?? []) {
    // Rebuild a full raw object merging individual columns with the stored raw blob
    const rawBlob = (row.raw ?? {}) as Record<string, unknown>
    const mergedRaw: Record<string, unknown> = {
      ...rawBlob,
      // Always surface key prediction fields at the top level for getBestPicks()
      o25_potential: row.over25_potential,
      u25_potential: row.under25_potential,
      o15_potential: row.over15_potential,
      o35_potential: row.over35_potential,
      o05_potential: row.over05_potential,
      o05HT_potential: row.over05ht_potential,
      btts_potential: row.btts_potential,
      corners_o85_potential: row.corners_o85,
      corners_o95_potential: row.corners_o95,
      home_ppg: row.home_ppg,
      away_ppg: row.away_ppg,
    }

    map[row.match_id] = {
      matchId: row.match_id,
      scoredAvgHome: row.scored_avg_home,
      scoredAvgAway: row.scored_avg_away,
      concededAvgHome: row.conceded_avg_home,
      concededAvgAway: row.conceded_avg_away,
      bttsPotential: row.btts_potential,
      over25Potential: row.over25_potential,
      h2hHomeWins: row.h2h_home_wins,
      h2hAwayWins: row.h2h_away_wins,
      h2hDraws: row.h2h_draws,
      winner: row.winner as "home" | "away" | "draw" | null,
      homeGoals: row.home_goals,
      awayGoals: row.away_goals,
      isRaw: false,
      raw: mergedRaw,
    }
  }
  return map
}
