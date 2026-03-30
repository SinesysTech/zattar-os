'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Scale, ShieldCheck } from 'lucide-react'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', test: password.length >= 8 },
    { label: 'Letra maiúscula', test: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', test: /[a-z]/.test(password) },
    { label: 'Número', test: /[0-9]/.test(password) },
  ]
  const passed = checks.filter((c) => c.test).length

  if (!password) return null

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= passed
                ? passed <= 1
                  ? 'bg-destructive'
                  : passed <= 2
                    ? 'bg-amber-400'
                    : passed <= 3
                      ? 'bg-emerald-400/70'
                      : 'bg-emerald-400'
                : 'bg-outline-variant/20'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(
              'text-[10px] transition-colors',
              check.test ? 'text-emerald-400' : 'text-outline/50'
            )}
          >
            {check.test ? '✓' : '○'} {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        router.push('/app/dashboard')
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a senha.')
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
              Senha Atualizada
            </h2>
            <p className="text-sm text-on-surface-variant">
              Sua nova senha foi definida com sucesso.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Você será redirecionado para o dashboard em instantes.
            </p>
          </div>

          <Link
            href="/app/login"
            className="text-[10px] text-outline uppercase tracking-widest hover:text-primary transition-colors text-center lg:text-left"
          >
            Ir para o login
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center lg:text-left mb-10">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
              Redefinir sua Senha
            </h2>
            <p className="text-sm text-on-surface-variant">
              Defina uma nova senha segura para sua conta corporativa.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-widest text-primary font-bold"
              >
                Nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-outline" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all font-mono text-sm"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-outline transition-colors hover:text-on-surface"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-[10px] uppercase tracking-widest text-primary font-bold"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <ShieldCheck className="h-4 w-4 text-outline" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className={cn(
                    'w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:outline-none transition-all font-mono text-sm',
                    confirmPassword && confirmPassword !== password
                      ? 'focus:ring-destructive/50'
                      : 'focus:ring-primary/50'
                  )}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-outline transition-colors hover:text-on-surface"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[10px] text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Criptografia E2E</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativo
              </span>
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
                  Salvando...
                </>
              ) : (
                <>
                  Salvar nova senha
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
