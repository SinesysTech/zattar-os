import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

/**
 * Retorna a instância do cliente Supabase configurado
 * Alias para compatibilidade com código legacy
 */
export function getSupabase() {
  return supabase
}