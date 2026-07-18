import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

const SYSTEM_PROMPT = `
You are an expert football betting tips assistant integrated into the Tropy app. 

BASE URL: http://us3.bot-hosting.net:20562

Your job: fetch the right data with the fewest calls, then convert raw JSON into
clear, structured, human-readable analysis. Never dump raw JSON to the user.

## AVAILABLE ENDPOINTS

1. GET /matches
   - Returns all matches scheduled for a given date.
   - Params: date (YYYY-MM-DD, default today), tz (default WAT), division (default leagues)
   - Use when: the user wants to browse/see what's on today or on a specific date.

2. GET /match-stats
   - Returns H2H stats and detailed data for ONE match.
   - Params: match_id (required, integer)
   - Use when: you already know the specific match_id and just need deep stats for it.

3. GET /matches-with-stats  ⭐ PREFERRED for anything involving 2+ matches
   - Returns the daily match list AND H2H stats for multiple matches in a single
     parallel request. Always prefer this over calling /matches then /match-stats
     repeatedly — it's faster and reduces round trips.
   - Params: date (optional), match_ids (comma-separated, optional), tz, division
   - Response includes "stats" keyed by match_id. Some entries may individually
     contain {"error": "..."} on partial failure — the overall request still
     returns success: true. Always check each stat entry, don't assume all succeeded.

## WORKFLOW

1. If the user hasn't specified match IDs, call /matches first (for the relevant
   date/timezone) to get the day's fixture list and let the user pick, or select
   the most relevant matches yourself based on their request (e.g. "top leagues",
   a named team, or a named league).
2. Once you have match_ids, call /matches-with-stats with date + match_ids together
   in ONE call rather than looping /match-stats per match.
3. Only fall back to /match-stats alone if you already have a single specific
   match_id and don't need the day's full match list.
4. Always pass tz explicitly if the user has a known/implied timezone; otherwise
   default to WAT. Common values: WAT (UTC+1), EAT (UTC+3), CAT (UTC+2), UTC.

## ERROR HANDLING

- Check "success" at the top level of every response before using "data" /
  "matches" / "stats".
- If success is false, read "error" and explain the failure to the user in plain
  language (e.g. "FootyStats couldn't find that match ID" rather than echoing
  raw error strings verbatim).
- On /matches-with-stats, iterate every entry in "stats" and check for an "error"
  key per match — report which specific matches failed to load stats without
  failing the whole response to the user.
- HTTP 400 = missing required param (e.g. no match_id on /match-stats).
- HTTP 502 = upstream FootyStats failure (their API, not yours) — tell the user
  the data source is temporarily unavailable, suggest retrying shortly.
- HTTP 500 = internal proxy error — treat as transient, suggest retrying.

## HOW TO PRESENT ANALYSIS TO THE USER

Never show raw JSON. For each match, synthesize a short, clear analysis covering
(only using fields actually present in the data — do not invent numbers):

- Fixture: teams, competition/league, kickoff time (converted to the user's tz
  context if known)
- Form/H2H summary: head-to-head record, recent results if available
- Key stats: goals scored/conceded trends, BTTS%, over/under trends — whatever
  the stats payload actually contains
- A brief, clearly-labeled "read" of the matchup in plain language (e.g. "Team A
  has won 4 of the last 5 meetings and averages 2.1 goals at home")
- If data is incomplete or a stat call failed for that match, say so explicitly
  rather than guessing or filling gaps

Do not present speculative predictions as certainties. Frame analysis as "based
on the available stats," not as guaranteed outcomes. Avoid any language that
could be read as betting/gambling advice unless the app is explicitly a betting
context the user has opted into — even then, present stats neutrally and note
uncertainty.

## EFFICIENCY RULES

- Prefer one /matches-with-stats call over multiple sequential calls.
- Don't re-fetch data you already have in the current conversation/session unless
  the user asks for a refresh or significant time has passed.
- Batch match_ids in a single comma-separated request instead of one request per
  match.
`

function cleanMatch(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id || raw.match_id || raw.matchId || raw.fixture_id || raw.game_id
  const home = raw.home_name || raw.homeName || raw.home_team || raw.homeTeam || raw.home_team_name || raw.team_a_name || raw.home || raw.team_home || (raw.localteam && raw.localteam.name)
  const away = raw.away_name || raw.awayName || raw.away_team || raw.awayTeam || raw.away_team_name || raw.team_b_name || raw.away || raw.team_away || (raw.visitorteam && raw.visitorteam.name)
  const comp = raw.competition_name || raw.competition || raw.league_name || raw.league || raw.division || raw.comp || raw.tournament || (raw.league && raw.league.name)
  const time = raw.time || raw.kickoff || raw.kickoff_time || raw.kickoffTime || raw.start_time || raw.starting_at || raw.date_unix || raw.kickoff_unix
  return { id, home, away, competition: comp, kickoff: time }
}

function cleanStats(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  const data = raw.data || raw
  if (data.error) return { error: data.error }
  return {
    scoredAvgHome: data.seasonScoredAVG_home || data.scoredAVG_home || data.scored_avg_home || data.home_scored_avg,
    scoredAvgAway: data.seasonScoredAVG_away || data.scoredAVG_away || data.scored_avg_away || data.away_scored_avg,
    concededAvgHome: data.seasonConcededAVG_home || data.concededAVG_home || data.conceded_avg_home || data.home_conceded_avg,
    concededAvgAway: data.seasonConcededAVG_away || data.concededAVG_away || data.conceded_avg_away || data.away_conceded_away,
    btts_potential: data.btts_potential || data.bttsPotential || data.btts_percentage || data.gg_potential,
    o25_potential: data.o25_potential || data.over25_potential || data.o25Potential || data.over25 || data.o25,
    h2h: data.h2h || data.head2head || data.headToHead || {
      homeWins: data.team_a_wins || data.home_wins || data.w1,
      awayWins: data.team_b_wins || data.away_wins || data.w2,
      draws: data.draws || data.draw || data.x
    }
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      get_matches: tool({
        description: 'Get a limited, filtered list of matches scheduled for a given date to avoid token overflow.',
        parameters: z.object({
          date: z.string().optional().describe('YYYY-MM-DD, default today'),
          tz: z.string().optional().describe('Timezone, default WAT'),
          division: z.string().optional().describe('e.g. leagues')
        }),
        execute: async ({ date, tz, division }) => {
          const url = new URL('http://us3.bot-hosting.net:20562/matches')
          if (date) url.searchParams.set('date', date)
          if (tz) url.searchParams.set('tz', tz)
          if (division) url.searchParams.set('division', division)
          try {
            const res = await fetch(url.toString())
            const body = await res.json()
            if (!body || !body.success) return body
            
            // Get matches array
            const rawMatches = body.data || body.matches || body.fixtures || []
            // Clean and limit to top 20 matches
            const cleanedMatches = Array.isArray(rawMatches) 
              ? rawMatches.slice(0, 20).map(cleanMatch)
              : Object.values(rawMatches).slice(0, 20).map(cleanMatch)
              
            return { success: true, matches: cleanedMatches }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      }),
      get_match_stats: tool({
        description: 'Get H2H stats and detailed data for ONE match.',
        parameters: z.object({
          match_id: z.number().describe('The ID of the match')
        }),
        execute: async ({ match_id }) => {
          try {
            const res = await fetch(`http://us3.bot-hosting.net:20562/match-stats?match_id=${match_id}`)
            const body = await res.json()
            if (!body || !body.success) return body
            return { success: true, stats: cleanStats(body.data || body) }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      }),
      get_matches_with_stats: tool({
        description: 'Get the daily match list AND H2H stats for multiple matches in a single parallel request (limited to 15 matches maximum).',
        parameters: z.object({
          date: z.string().optional().describe('YYYY-MM-DD, default today'),
          match_ids: z.string().optional().describe('Comma-separated list of match IDs'),
          tz: z.string().optional().describe('Timezone, default WAT'),
          division: z.string().optional()
        }),
        execute: async ({ date, match_ids, tz, division }) => {
          const url = new URL('http://us3.bot-hosting.net:20562/matches-with-stats')
          if (date) url.searchParams.set('date', date)
          if (tz) url.searchParams.set('tz', tz)
          if (division) url.searchParams.set('division', division)
          
          let limitedMatchIds = match_ids
          if (match_ids) {
            const ids = match_ids.split(',').slice(0, 15) // Limit to 15 match stats at once
            limitedMatchIds = ids.join(',')
            url.searchParams.set('match_ids', limitedMatchIds)
          }
          
          try {
            const res = await fetch(url.toString())
            const body = await res.json()
            if (!body || !body.success) return body
            
            // Clean matches list
            const rawMatches = body.data || body.matches || body.fixtures || []
            const cleanedMatches = Array.isArray(rawMatches)
              ? rawMatches.slice(0, 15).map(cleanMatch)
              : Object.values(rawMatches).slice(0, 15).map(cleanMatch)
              
            // Clean stats map
            const cleanedStats: Record<string, any> = {}
            if (body.stats && typeof body.stats === 'object') {
              for (const [id, stat] of Object.entries(body.stats)) {
                cleanedStats[id] = cleanStats(stat)
              }
            }
            
            return { success: true, matches: cleanedMatches, stats: cleanedStats }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      })
    }
  })

  return result.toDataStreamResponse()
}
