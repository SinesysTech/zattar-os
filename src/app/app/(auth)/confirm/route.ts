import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/app/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Redirecionar usuário para URL especificada ou dashboard
      redirect(next || '/app/dashboard')
    } else {
      // Redirecionar para página de erro com instruções
      redirect(`/app/error?error=${encodeURIComponent(error?.message || 'Erro desconhecido')}`)
    }
  }

  // Redirecionar para página de erro se não houver token_hash ou type
  redirect(`/app/error?error=${encodeURIComponent('Token hash ou tipo não fornecidos')}`)
}
