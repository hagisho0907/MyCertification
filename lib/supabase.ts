import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase service-role client for server-side only usage
let adminClient: SupabaseClient | null = null

export function getSupabaseServiceClient(): SupabaseClient {
  if (adminClient) return adminClient

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
