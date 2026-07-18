import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

// Top league names the AI should focus on
const TOP_LEAGUES_LOWER = [
  "world cup", "euro", "copa america", "nations league",
  "champions league", "europa league", "conference league",
  "premier league", "championship", "fa cup", "efl cup",
  "la liga", "laliga", "copa del rey",
  "bundesliga", "dfb pokal",
  "serie a", "coppa italia",
  "ligue 1", "coupe de france",
  "primeira liga", "liga portugal",
  "eredivisie",
  "scottish premiership", "scottish league cup",
  "super lig",
  "brasileirao", "copa argentina", "liga profesional",
  "caf champions league", "afcon",
  "mls", "saudi pro league",
  "international friendlies",
]

function isTopLeague(name: string): boolean {
  const lower = (name || '').toLowerCase()
  return TOP_LEAGUES_LOWER.some(l => lower.includes(l))
}

const SYSTEM_PROMPT = `
You are an expert football tips assistant for Tropy. Today's date: ${new Date().toISOString().split('T')[0]}.

BASE URL: http://us3.bot-hosting.net:20562

IMPORTANT — the /matches API returns this nested structure:
  { success: true, data: { success: true, data: [ { title: "League Name", name: "...", matches: [...] } ] } }
Each element of data.data is a LEAGUE GROUP with a "matches" array inside it.
When you receive match data, always look for matches INSIDE each league group's "matches" array.

## TOOLS AVAILABLE

- get_matches: Fetch today's top-league fixtures (pre-filtered, max 20 matches)
- get_match_stats: Fetch deep H2H stats for ONE match_id
- get_matches_with_stats: ⭐ PREFERRED — fetch fixtures + stats in one parallel call (max 15 matches)

## WORKFLOW

1. User asks for tips/accumulators → call get_matches_with_stats immediately (no date needed for today)
2. User asks about a specific team/league → call get_matches first to find match_ids, then get_matches_with_stats
3. Never call get_match_stats in a loop. Batch IDs together.
4. For "2 odds" → pick 2 matches with ≥70% confidence stats and combine them
5. For "5 odds" → pick 5 matches with ≥60% confidence and combine them
6. VIP tips → pick matches with the highest statistical confidence (≥70%)

## ANALYSIS FORMAT

For each match, always show:
🏆 **Competition** | ⏰ **Kickoff**
🏠 **Home** vs **Away** ✈️
📊 Tip: [market] @ [odds]
🔥 Confidence: [X]%
📌 Reasoning: [2-3 bullet points using actual stats, no guessing]

Group tips into accumulators when user asks for "2 odds", "5 odds", etc:
Show each leg, the combined odds, and overall confidence.

## RULES

- NEVER show raw JSON
- NEVER invent stats — only use data actually returned by the API
- If a match has no stats, say "stats unavailable" and skip
- Frame all analysis as statistical insights, not gambling advice
- Always note uncertainty — past performance ≠ future results
`

// Flatten the FootyStats league-group response format into a flat list of matches
function flattenMatches(body: any, maxCount = 20): any[] {
  if (!body || !body.success) return []
  
  const outerData = body.data ?? body.matches ?? body.fixtures ?? body
  // Double-unwrap: data.data is the league groups array
  const dataArr = outerData?.data ?? outerData?.matches ?? outerData?.fixtures ?? outerData
  
  const out: any[] = []
  
  if (Array.isArray(dataArr)) {
    for (const group of dataArr) {
      if (out.length >= maxCount) break
      const compName = group.name || group.title || ''
      
      // Only include top leagues
      if (!isTopLeague(compName)) continue
      
      const matches = group.matches || group.fixtures || []
      for (const m of matches) {
        if (out.length >= maxCount) break
        out.push(cleanMatch(m, compName))
      }
    }
  } else if (Array.isArray(body.data)) {
    // Flat array of matches
    body.data.slice(0, maxCount).forEach((m: any) => out.push(cleanMatch(m)))
  }
  
  return out
}

function cleanMatch(raw: any, compName?: string) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id || raw.match_id || raw.matchId
  const home = raw.home_name || raw.homeName || raw.team_a_name
  const away = raw.away_name || raw.awayName || raw.team_b_name
  const comp = compName || raw.competition_name || raw.competition || raw.league_name
  const kickoff = raw.date_unix || raw.kickoff_unix || raw.time
  const homeId = raw.homeID || raw.home_id
  const awayId = raw.awayID || raw.away_id
  const compId = raw.competition_id || raw.season_id
  return {
    id,
    home,
    away,
    competition: comp,
    kickoff,
    home_logo: homeId ? `https://cdn.footystats.org/img/teams/${homeId}.png` : undefined,
    away_logo: awayId ? `https://cdn.footystats.org/img/teams/${awayId}.png` : undefined,
    competition_logo: compId ? `https://cdn.footystats.org/img/competitions/${compId}.png` : undefined,
    // Key betting stats already on match object
    btts_potential: raw.btts_potential,
    o25_potential: raw.o25_potential,
    home_ppg: raw.home_ppg || raw.pre_match_home_ppg,
    away_ppg: raw.away_ppg || raw.pre_match_away_ppg,
    odds_over25: raw.odds_ft_over25,
    odds_btts: raw.odds_btts_yes,
    odds_home: raw.odds_ft_1,
    odds_draw: raw.odds_ft_x,
    odds_away: raw.odds_ft_2,
    status: raw.status,
    score: raw.status === 'complete' ? `${raw.homeGoalCount}-${raw.awayGoalCount}` : null,
  }
}

function cleanStats(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  const data = raw.data || raw
  if (data.error) return { error: data.error }
  return {
    scoredAvgHome: data.seasonScoredAVG_home || data.scoredAVG_home,
    scoredAvgAway: data.seasonScoredAVG_away || data.scoredAVG_away,
    concededAvgHome: data.seasonConcededAVG_home || data.concededAVG_home,
    concededAvgAway: data.seasonConcededAVG_away || data.concededAVG_away,
    btts_potential: data.btts_potential,
    o25_potential: data.o25_potential,
    home_ppg: data.pre_match_home_ppg || data.home_ppg,
    away_ppg: data.pre_match_away_ppg || data.away_ppg,
    h2h: data.h2h || data.head2head || {
      homeWins: data.team_a_wins || data.home_wins,
      awayWins: data.team_b_wins || data.away_wins,
      draws: data.draws
    }
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 5,
    tools: {
      get_matches: tool({
        description: 'Get today\'s top-league matches (pre-filtered to major leagues, max 20 fixtures).',
        parameters: z.object({
          date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
          tz: z.string().optional().describe('Timezone e.g. WAT, EAT, CAT, UTC'),
        }),
        execute: async ({ date, tz }) => {
          const url = new URL('http://us3.bot-hosting.net:20562/matches')
          if (date) url.searchParams.set('date', date)
          url.searchParams.set('tz', tz || 'WAT')
          try {
            const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
            const body = await res.json()
            const matches = flattenMatches(body, 20)
            return { success: true, total: matches.length, matches }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      }),

      get_match_stats: tool({
        description: 'Get deep H2H stats for a single match by ID.',
        parameters: z.object({
          match_id: z.number().describe('The numeric match ID'),
        }),
        execute: async ({ match_id }) => {
          try {
            const res = await fetch(
              `http://us3.bot-hosting.net:20562/match-stats?match_id=${match_id}`,
              { signal: AbortSignal.timeout(15000) }
            )
            const body = await res.json()
            if (!body?.success) return body
            return { success: true, stats: cleanStats(body.data || body) }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      }),

      get_matches_with_stats: tool({
        description: '⭐ PREFERRED: Get fixtures + H2H stats in one call. Returns top-league matches with betting stats. Use this for all accumulator/tip requests.',
        parameters: z.object({
          date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
          match_ids: z.string().optional().describe('Comma-separated match IDs (max 15). Leave empty to auto-select best matches.'),
          tz: z.string().optional().describe('Timezone e.g. WAT'),
        }),
        execute: async ({ date, match_ids, tz }) => {
          const url = new URL('http://us3.bot-hosting.net:20562/matches-with-stats')
          if (date) url.searchParams.set('date', date)
          url.searchParams.set('tz', tz || 'WAT')

          if (match_ids) {
            const limited = match_ids.split(',').slice(0, 15).join(',')
            url.searchParams.set('match_ids', limited)
          }

          try {
            const res = await fetch(url.toString(), { signal: AbortSignal.timeout(25000) })
            const body = await res.json()
            if (!body?.success) return body

            const matches = flattenMatches(body, 15)

            // Clean stats map
            const cleanedStats: Record<string, any> = {}
            if (body.stats && typeof body.stats === 'object') {
              for (const [id, stat] of Object.entries(body.stats)) {
                cleanedStats[id] = cleanStats(stat)
              }
            }

            return { success: true, total: matches.length, matches, stats: cleanedStats }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      })
    }
  })

  return result.toDataStreamResponse()
}
