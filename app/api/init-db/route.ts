import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// We need the postgres connection string, but we can construct it if we only have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// Wait, actually Vercel sets POSTGRES_URL if the integration is linked.
// Let's use the REST API via @supabase/supabase-js, but we can't do CREATE TABLE with it.
// To make it fool-proof, let's use the standard POSTGRES_URL or SUPABASE_URL parsing.

export async function GET(req: Request) {
  try {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({ 
        success: false, 
        error: "No POSTGRES_URL or DATABASE_URL found. Please make sure your Supabase/Postgres is linked in Vercel settings." 
      }, { status: 500 })
    }

    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    })

    const client = await pool.connect()
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.matches (
          id TEXT PRIMARY KEY, date TEXT NOT NULL, home_name TEXT DEFAULT '',
          home_logo TEXT, away_name TEXT DEFAULT '', away_logo TEXT,
          competition TEXT DEFAULT '', competition_logo TEXT, kickoff_unix BIGINT,
          kickoff_label TEXT DEFAULT '', raw JSONB,
          created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
        );
      `)
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.match_stats (
          match_id TEXT PRIMARY KEY, date TEXT NOT NULL,
          over25_potential REAL, under25_potential REAL, over15_potential REAL,
          over35_potential REAL, over05_potential REAL, over05ht_potential REAL,
          btts_potential REAL, corners_o85 REAL, corners_o95 REAL,
          scored_avg_home REAL, scored_avg_away REAL, conceded_avg_home REAL,
          conceded_avg_away REAL, home_ppg REAL, away_ppg REAL,
          h2h_home_wins INT, h2h_away_wins INT, h2h_draws INT,
          winner TEXT, home_goals INT, away_goals INT, raw JSONB,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `)
      
      return NextResponse.json({ success: true, message: "Database tables created successfully!" })
    } finally {
      client.release()
      await pool.end()
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
