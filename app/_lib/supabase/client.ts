import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurada')
  }

  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY não está configurada')
  }

  // Verificar se não está usando service_role key no cliente do browser
  if (supabaseKey.startsWith('eyJ') || supabaseKey.includes('service_role')) {
    console.warn(
      'AVISO: Parece que você está usando uma chave service_role ou JWT no cliente do browser. ' +
      'Use apenas a chave anon ou publishable no cliente do browser.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
