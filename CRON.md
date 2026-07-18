# Tropy Cron Cache Setup Guide

To bypass upstream proxy slowness and guarantee a smooth mobile experience, we've implemented a **static JSON caching system**.

A Python script runs on a schedule (cron), fetches all matches for today, filters out less relevant matches (prioritizing major leagues and keeping at most 30 matches), fetches their stats in a single parallel call, and writes the cache file. The Next.js API automatically loads from this cache instead of calling the external API proxy.

---

## 1. The Cache Script: `scripts/fetch_matches.py`

This script:
1. Fetches all scheduled matches for today (or a specific date).
2. Filters them to keep at most 30 matches (prioritizing major leagues like Premier League, La Liga, Serie A, etc.).
3. Fetches the H2H stats for those 30 matches in one optimized `/matches-with-stats` API call.
4. Saves the JSON output directly to `public/data/cache-YYYY-MM-DD.json`.

---

## 2. Setting Up the Cron Job

### On Linux / macOS (using `crontab`)

1. Open your cron editor:
   ```bash
   crontab -e
   ```

2. Add a rule to run the script every 6 hours (or once a day at midnight):
   ```text
   # Run at 00:00, 06:00, 12:00, and 18:00 every day
   0 */6 * * * /usr/bin/python3 /path/to/tropy/scripts/fetch_matches.py >> /path/to/tropy/cron.log 2>&1
   ```

---

### On Windows (using Task Scheduler)

1. Open **Task Scheduler** and click **Create Basic Task**.
2. Set the Trigger to **Daily** and configure it to repeat every 6 hours.
3. Set the Action to **Start a Program**.
4. Configure the program settings:
   - **Program/script:** `python`
   - **Add arguments:** `scripts/fetch_matches.py`
   - **Start in:** `C:\Users\s\.gemini\antigravity\scratch\tropy` (or the folder where your project resides)

---

## 3. How the Next.js App Uses the Cache

The API endpoints `/api/matches` and `/api/matches-with-stats` now check for the cache file before making external requests:
- If `public/data/cache-YYYY-MM-DD.json` exists, it is served **instantly** (0ms delay).
- If the cache does not exist yet (or has expired), it automatically falls back to fetching from the upstream API.
