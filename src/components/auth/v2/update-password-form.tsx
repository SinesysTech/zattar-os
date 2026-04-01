'use client'

/**
 * UpdatePasswordForm V2 — "Átrio de Vidro" (Light Mode)
 */

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Shared AuthInput (Light Mode) ───────────────────────────────────────────

function AuthInput({
  icon: Icon,
  rightElement,
  error: hasError,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>
  rightElement?: React.ReactNode
  error?: boolean
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative group">
      <div
        className={cn(
          'absolute -inset-0.75 rounded-xl transition-all duration-500 pointer-events-none',
          focused && !hasError ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'linear-gradient(135deg, oklch(0.48 0.26 281 / 0.10), oklch(0.48 0.26 281 / 0.03))',
          filter: 'blur(6px)',
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          <Icon
            className={cn(
              'h-4 w-4 transition-colors duration-300',
              hasError
                ? 'text-destructive/50'
                : focused
                  ? 'text-primary'
                  : 'text-muted-foreground/40'
            )}
          />
        </div>
        <input
          className={cn(
            'relative w-full rounded-xl border py-3.5 pl-11 text-sm text-foreground',
            'bg-white/60 backdrop-blur-sm',
            'placeholder:text-muted-foreground/40',
            'transition-all duration-300 focus:outline-none',
            hasError
              ? 'border-destructive/30 shadow-[0_0_0_3px_oklch(0.55_0.22_25/0.06)]'
              : focused
                ? 'border-primary/30 shadow-[0_0_0_3px_oklch(0.48_0.26_281/0.06)] bg-white/80'
                : 'border-border/40 hover:border-border/60',
            rightElement ? 'pr-11' : 'pr-3.5',
            className
          )}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Password Strength — Continuous Bar + Criteria ───────────────────────────

function PasswordStrengthV2({ password }: { password: string }) {
  const criteria = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
  ]
  const passed = criteria.filter((c) => c.met).length
  const percentage = (passed / 4) * 100

  if (!password) return null

  const gradientColor =
    passed <= 1
      ? 'oklch(0.55 0.22 25)'
      : passed <= 2
        ? 'oklch(0.65 0.16 85)'
        : 'oklch(0.55 0.18 145)'

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2.5 px-1 pt-1"
    >
      <div className="h-1 w-full rounded-full bg-border/20 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ backgroundColor: gradientColor }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-300',
                c.met
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-border/10 text-muted-foreground/20'
              )}
            >
              {c.met && <Check className="h-2 w-2" strokeWidth={3} />}
            </div>
            <span
              className={cn(
                'text-[10px] transition-colors duration-300',
                c.met ? 'text-muted-foreground/70' : 'text-muted-foreground/30'
              )}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const pageVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

const pageTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as const,
}

// ─── Form Component ──────────────────────────────────────────────────────────

export function UpdatePasswordFormV2({
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

  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== password

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
      }, 2500)
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao atualizar a senha.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordToggle = ({
    show,
    onToggle,
  }: {
    show: boolean
    onToggle: () => void
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="cursor-pointer text-muted-foreground/30 transition-colors duration-200 hover:text-muted-foreground/60"
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative h-11 w-11">
          <Image
            src="/logos/logo-small.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[3px] text-muted-foreground/40">
          Zattar Advogados
        </span>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                Tudo certo.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sua nova senha foi definida com sucesso.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-50/60 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Senha atualizada
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Você será redirecionado em instantes.
                </p>
              </div>
            </div>

            {/* Animated redirect progress bar */}
            <div className="h-0.5 w-full rounded-full bg-border/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500/50"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            </div>

            <div className="text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Ir para o login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
          >
            <div className="mb-8 text-center">
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                Senha nova.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Defina sua nova senha abaixo
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <AuthInput
                  icon={Lock}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  rightElement={
                    <PasswordToggle
                      show={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                <div className="mt-2">
                  <AnimatePresence>
                    {password && <PasswordStrengthV2 password={password} />}
                  </AnimatePresence>
                </div>
              </div>

              <AuthInput
                icon={ShieldCheck}
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                required
                error={passwordsMismatch}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                rightElement={
                  <PasswordToggle
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  />
                }
              />

              <AnimatePresence>
                {passwordsMismatch && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-1 text-xs text-destructive"
                  >
                    As senhas não coincidem
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 rounded-xl border border-destructive/15 bg-destructive/5 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <p className="text-sm leading-relaxed text-destructive">
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-1">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 px-6',
                    'bg-linear-to-br from-primary to-primary-dim',
                    'font-headline text-sm font-bold text-white',
                    'shadow-lg shadow-primary/25 transition-all duration-500',
                    'hover:shadow-xl hover:shadow-primary/30',
                    'disabled:cursor-not-allowed disabled:opacity-70'
                  )}
                  whileTap={!isLoading ? { scale: 0.98 } : undefined}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Salvar nova senha
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
