// ============================================================
// SUPABASE CLIENT — browser only (safe for Client Components)
// ============================================================

import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client (use in Client Components)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
