'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { AtSign, AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Scale, ShieldCheck } from 'lucide-react'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <div className="mb-10 flex flex-col items-center gap-4 lg:hidden">
        <div className="relative h-16 w-80">
          <Image
            src="/logos/logomarca-dark.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain object-center"
          />
        </div>
        <span className="inline-flex rounded-full border border-outline-variant/30 bg-surface-container-highest/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
          Ambiente interno
        </span>
      </div>

      {success ? (
        <div className="flex flex-col gap-6">
          <div className="text-center lg:text-left">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
              Verifique seu Email
            </h2>
            <p className="text-sm text-on-surface-variant">
              Instruções de redefinição de senha enviadas.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Se o email estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
            </p>
          </div>

          <Link
            href="/app/login"
            className="text-[10px] text-outline uppercase tracking-widest hover:text-primary transition-colors text-center lg:text-left"
          >
            Voltar para o login
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center lg:text-left mb-10">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
              Redefinir Senha
            </h2>
            <p className="text-sm text-on-surface-variant">
              Digite seu email corporativo e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-widest text-primary font-bold"
              >
                E-mail corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <AtSign className="h-4 w-4 text-outline" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@zattar.com.br"
                  className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all font-mono text-sm"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary-fixed font-headline font-extrabold py-4 px-6 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar link de redefinição
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-8">
            <Link
              href="/app/login"
              className="text-[10px] text-outline uppercase tracking-widest hover:text-primary transition-colors"
            >
              Voltar para o login
            </Link>
            <div className="flex gap-4">
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/30 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> ISO-9001
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/30 uppercase tracking-wider">
                <Lock className="w-3 h-3" /> SOC2
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/30 uppercase tracking-wider">
                <Scale className="w-3 h-3" /> LGPD
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
