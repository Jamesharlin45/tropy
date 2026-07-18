import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

BASE_URL = "http://us3.bot-hosting.net:20562"
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")

# Major leagues/competitions to prioritize (optional filter)
PRIORITIZED_LEAGUES = [
    "premier league", "la liga", "serie a", "bundesliga", "ligue 1", 
    "champions league", "europa league", "eredivisie", "primeira liga"
]

def fetch_json(url):
    print(f"Fetching: {url}")
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Tropy Cron Job)'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    # Determine date (default today YYYY-MM-DD)
    date_str = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
    
    # 1. Fetch matches for the day
    matches_url = f"{BASE_URL}/matches?date={date_str}"
    matches_envelope = fetch_json(matches_url)
    
    if not matches_envelope or not matches_envelope.get("success"):
        print("Failed to fetch matches. Exiting.")
        sys.exit(1)
        
    raw_matches = matches_envelope.get("data") or matches_envelope.get("matches") or matches_envelope.get("fixtures") or []
    
    if not raw_matches:
        print("No matches found for this date.")
        sys.exit(0)
        
    # Convert dict of matches to list if needed
    if isinstance(raw_matches, dict):
        raw_matches = list(raw_matches.values())
        
    # 2. Filter matches (prioritize major leagues, limit to 30 matches maximum for smoothness)
    # Helper to check competition name
    def get_comp_name(m):
        for k in ["competition_name", "competition", "league_name", "league"]:
            if k in m and m[k]:
                if isinstance(m[k], dict):
                    return m[k].get("name", "").lower()
                return str(m[k]).lower()
        return ""
        
    prioritized = []
    others = []
    
    for m in raw_matches:
        comp = get_comp_name(m)
        is_prioritized = any(league in comp for league in PRIORITIZED_LEAGUES)
        if is_prioritized:
            prioritized.append(m)
        else:
            others.append(m)
            
    # Combine lists, prioritizing major leagues
    filtered_matches = (prioritized + others)[:30] # Max 30 matches to keep cache lightweight
    
    # Extract IDs
    match_ids = []
    for m in filtered_matches:
        match_id = m.get("id") or m.get("match_id") or m.get("matchId") or m.get("fixture_id") or m.get("game_id")
        if match_id:
            match_ids.append(str(match_id))
            
    if not match_ids:
        print("No valid match IDs found after filtering.")
        sys.exit(0)
        
    print(f"Filtered to {len(match_ids)} matches. Fetching stats...")
    
    # 3. Fetch matches with stats for the filtered match IDs
    ids_param = ",".join(match_ids)
    stats_url = f"{BASE_URL}/matches-with-stats?date={date_str}&match_ids={ids_param}"
    stats_envelope = fetch_json(stats_url)
    
    if not stats_envelope or not stats_envelope.get("success"):
        print("Failed to fetch matches with stats.")
        sys.exit(1)
        
    # 4. Save to public cache directory
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_filepath = os.path.join(CACHE_DIR, f"cache-{date_str}.json")
    
    with open(cache_filepath, "w", encoding="utf-8") as f:
        json.dump(stats_envelope, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully cached data for {date_str} to {cache_filepath}")

if __name__ == "__main__":
    main()
