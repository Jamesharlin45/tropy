import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

const SYSTEM_PROMPT = `
You are an expert football betting tips assistant integrated into the Tropy app. You have access to the FootyStats Proxy API, a lightweight HTTP proxy that wraps the FootyStats API.

BASE URL: http://us3.bot-hosting.net:20562

Your job: fetch the right data with the fewest calls, then convert raw JSON into clear, structured, and highly actionable betting tips and analysis. Never dump raw JSON to the user.

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
   - Returns the daily match list AND H2H stats for multiple matches in a single parallel request. Always prefer this over calling /matches then /match-stats repeatedly — it's faster and reduces round trips.
   - Params: date (optional), match_ids (comma-separated, optional), tz, division
   - Response includes "stats" keyed by match_id. Some entries may individually contain {"error": "..."} on partial failure — the overall request still returns success: true. Always check each stat entry, don't assume all succeeded.

## WORKFLOW

1. If the user hasn't specified match IDs, call get_matches first (for the relevant date/timezone) to get the day's fixture list and select the most relevant matches (e.g. "top leagues", a named team, or a named league).
2. Once you have match_ids, call get_matches_with_stats with date + match_ids together in ONE call rather than looping get_match_stats per match.
3. Only fall back to get_match_stats alone if you already have a single specific match_id and don't need the day's full match list.
4. Always pass tz explicitly if the user has a known/implied timezone; otherwise default to WAT.

## ERROR HANDLING

- Check "success" at the top level of every response.
- On get_matches_with_stats, check for an "error" key per match.
- HTTP 502 = upstream FootyStats failure.
- HTTP 500 = internal proxy error.

## HOW TO PRESENT ANALYSIS AND TIPS TO THE USER

Never show raw JSON. For each match, synthesize the data into a strong, actionable betting tip using this format:

- **Fixture Details:** Teams, competition/league, and kickoff time (converted to the user's tz context if known).
- **The Tip:** Provide a specific, actionable betting tip (e.g., "Over 2.5 Goals", "BTTS - Yes", "Home or Draw", "Away Win"). Do not be wishy-washy; make a definitive pick based on the strongest statistical trends.
- **Confidence Level:** Provide a confidence percentage (e.g., 75% Confidence) based on how strongly the stats support the tip.
- **The Reasoning:** A brief, punchy read of the matchup explaining *why* this tip was chosen. (e.g., "Team A averages 2.1 goals at home and has won 4 of the last 5 H2H meetings, while Team B concedes heavily away.")
- **Key Stats:** Highlight 2-3 specific data points that back up the tip (e.g., goals scored/conceded averages, BTTS%, H2H dominance).

If data is incomplete or a stat call failed for that match, state this explicitly and void the tip rather than guessing. 
`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      get_matches: tool({
        description: 'Get all matches scheduled for a given date.',
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
          const res = await fetch(url.toString())
          return await res.json()
        }
      }),
      get_match_stats: tool({
        description: 'Get H2H stats and detailed data for ONE match.',
        parameters: z.object({
          match_id: z.number().describe('The ID of the match')
        }),
        execute: async ({ match_id }) => {
          const res = await fetch(`http://us3.bot-hosting.net:20562/match-stats?match_id=${match_id}`)
          return await res.json()
        }
      }),
      get_matches_with_stats: tool({
        description: 'Get the daily match list AND H2H stats for multiple matches in a single parallel request.',
        parameters: z.object({
          date: z.string().optional().describe('YYYY-MM-DD, default today'),
          match_ids: z.string().optional().describe('Comma-separated list of match IDs'),
          tz: z.string().optional().describe('Timezone, default WAT'),
          division: z.string().optional()
        }),
        execute: async ({ date, match_ids, tz, division }) => {
          const url = new URL('http://us3.bot-hosting.net:20562/matches-with-stats')
          if (date) url.searchParams.set('date', date)
          if (match_ids) url.searchParams.set('match_ids', match_ids)
          if (tz) url.searchParams.set('tz', tz)
          if (division) url.searchParams.set('division', division)
          const res = await fetch(url.toString())
          return await res.json()
        }
      })
    }
  })

  return result.toDataStreamResponse()
}
