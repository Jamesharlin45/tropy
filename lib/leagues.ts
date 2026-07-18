// ---------------------------------------------------------------------------
// League filter configuration
// ---------------------------------------------------------------------------

/**
 * Top-performing leagues to show in the app.
 * Only matches belonging to these leagues will appear in Free/VIP tabs.
 * Lower-tier leagues are still fetched but silently dropped.
 * Add or remove league names (case-insensitive partial match) as needed.
 */
export const TOP_LEAGUES: string[] = [
  // International
  "world cup",
  "euro",
  "copa america",
  "nations league",
  "champions league",
  "europa league",
  "conference league",
  "international friendlies",
  // England
  "premier league",
  "championship",
  "fa cup",
  "efl cup",
  "league one",
  "league two",
  // Spain
  "la liga",
  "copa del rey",
  "laliga",
  // Germany
  "bundesliga",
  "dfb pokal",
  // Italy
  "serie a",
  "coppa italia",
  // France
  "ligue 1",
  "coupe de france",
  // Portugal
  "primeira liga",
  "liga portugal",
  // Netherlands
  "eredivisie",
  // Scotland
  "scottish premiership",
  "scottish league cup",
  // Turkey
  "super lig",
  // Brazil
  "brasileirao",
  "serie a",
  // Argentina
  "liga profesional",
  "copa argentina",
  // Africa
  "caf champions league",
  "afcon",
  // USA
  "mls",
  // Saudi Arabia
  "saudi pro league",
]

/** Returns true if the competition name matches a known top league. */
export function isTopLeague(competitionName: string): boolean {
  if (!competitionName) return false
  const lower = competitionName.toLowerCase()
  return TOP_LEAGUES.some((league) => lower.includes(league.toLowerCase()))
}

// Confidence thresholds
export const FREE_MIN_CONFIDENCE = 0   // show all non-VIP tips in free tab
export const VIP_MIN_CONFIDENCE = 70   // 70%+ goes to VIP
