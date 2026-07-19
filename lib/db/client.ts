import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client using the service role key.
// Never expose this to the browser — it bypasses Row Level Security.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set.",
  )
}

// Singleton — safe in Next.js serverless because each invocation is isolated.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})
