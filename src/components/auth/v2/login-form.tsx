'use client'

/**
 * LoginForm V2 — Refined
 *
 * Typography matches internal app exactly:
 *   - Headings: font-heading (Montserrat), text-2xl font-bold tracking-tight
 *   - Labels: text-sm font-medium text-foreground (above inputs)
 *   - Inputs: h-11 (44px), rounded-lg, border-input, bg-white/60
 *   - Body/Helper: text-sm text-muted-foreground
 *   - Button: h-11 font-semibold, matches input height
 *
 * UX aligned with Linear/Vercel/Stripe best practices:
 *   - Labels above inputs (not placeholder-only)
 *   - 20-24px gap between fields
 *   - 28px gap from fields to button
 *   - NO mono font on email
 *   - Liquid focus glow on inputs
 *   - Morphing button states (default → loading → success)
 */

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AtSign,
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Greeting ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia.'
  if (hour < 18) return 'Boa tarde.'
  return 'Boa noite.'
}

// ─── Animation ───────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
}

const ease = [0.22, 1, 0.36, 1] as const

// ─── AuthInput (Internal App Typography) ─────────────────────────────────────

function AuthInput({
  label,
  icon: Icon,
  rightElement,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: React.ComponentType<{ className?: string }>
  rightElement?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-1.5">
      {/* Label — matches internal app: text-sm font-medium */}
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none text-foreground select-none"
      >
        {label}
      </label>

      <div className="relative group">
        {/* Liquid glow */}
        <div
          className={cn(
            'absolute -inset-0.5 rounded-lg transition-all duration-500 pointer-events-none',
            focused ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background:
              'linear-gradient(135deg, oklch(0.48 0.26 281 / 0.08), oklch(0.48 0.26 281 / 0.02))',
            filter: 'blur(6px)',
          }}
          aria-hidden="true"
        />

        <div className="relative">
          {/* Icon */}
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Icon
              className={cn(
                'h-4 w-4 transition-colors duration-300',
                focused ? 'text-primary' : 'text-muted-foreground/40'
              )}
            />
          </div>

          {/* Input — matches internal: h-11, rounded-lg, border-input, text-sm */}
          <input
            id={id}
            className={cn(
              'relative w-full h-11 rounded-lg border px-3 pl-10 text-sm text-foreground',
              'bg-white/60 backdrop-blur-sm',
              'placeholder:text-muted-foreground/40',
              'shadow-xs transition-[color,box-shadow,border-color] duration-200',
              'focus:outline-none',
              focused
                ? 'border-primary/30 ring-[3px] ring-primary/8'
                : 'border-input hover:border-input/80',
              rightElement ? 'pr-10' : 'pr-3',
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Submit Button ───────────────────────────────────────────────────────────

function SubmitButton({
  isLoading,
  success,
  label,
  loadingLabel,
}: {
  isLoading: boolean
  success: boolean
  label: string
  loadingLabel: string
}) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading || success}
      className={cn(
        'relative flex w-full cursor-pointer items-center justify-center gap-2',
        'h-11 rounded-lg px-6',
        'text-sm font-semibold text-white',
        'transition-all duration-500',
        'disabled:cursor-not-allowed',
        success
          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25'
          : 'bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30'
      )}
      whileTap={!isLoading && !success ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-2"
          >
            <Check className="h-5 w-5" strokeWidth={3} />
          </motion.span>
        ) : isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {label}
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Error Alert ─────────────────────────────────────────────────────────────

function ErrorAlert({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-2 rounded-lg border border-destructive/15 bg-destructive/5 p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </motion.div>
  )
}

// ─── Login Form ──────────────────────────────────────────────────────────────

export function LoginFormV2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (
          error.message?.includes('Database error querying schema') ||
          error.message?.includes('email_change')
        ) {
          console.error(
            'Erro conhecido do Supabase Auth relacionado a email_change.'
          )
        }
        throw error
      }

      if (!data.user) {
        throw new Error('Falha na autenticação: usuário não retornado')
      }

      setSuccess(true)
      setTimeout(() => router.push('/app/dashboard'), 700)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          setError(
            'Por favor, confirme seu email antes de fazer login'
          )
        } else if (
          error.message.includes('500') ||
          error.message.includes('Database error')
        ) {
          setError(
            'Erro no servidor de autenticação. Tente novamente mais tarde.'
          )
        } else if (error.message.includes('email_change')) {
          setError(
            'Erro interno de autenticação. Entre em contato com o suporte.'
          )
        } else {
          setError(error.message)
        }
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-2.5 mb-8">
        <div className="relative h-10 w-10">
          <Image
            src="/logos/logo-small.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
          Zattar Advogados
        </span>
      </div>

      {/* Greeting — font-heading matches PageShell h1 */}
      <motion.div
        className="mb-8 text-center"
        {...fadeUp}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
          {getGreeting()}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Acesse sua estação de trabalho
        </p>
      </motion.div>

      {/* Form — 24px gap between fields, 28px to button */}
      <motion.form
        onSubmit={handleLogin}
        className="flex flex-col gap-5"
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.08, ease }}
      >
        <AuthInput
          label="Email"
          icon={AtSign}
          id="email"
          type="email"
          placeholder="voce@zattar.com.br"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <AuthInput
          label="Senha"
          icon={Lock}
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Digite sua senha"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer text-muted-foreground/30 transition-colors duration-200 hover:text-muted-foreground/60"
              aria-label={
                showPassword ? 'Ocultar senha' : 'Mostrar senha'
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <AnimatePresence mode="wait">
          {error && <ErrorAlert message={error} />}
        </AnimatePresence>

        <div className="pt-2">
          <SubmitButton
            isLoading={isLoading}
            success={success}
            label="Entrar"
            loadingLabel="Entrando..."
          />
        </div>
      </motion.form>

      {/* Footer */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25, ease }}
      >
        <Link
          href="/app/forgot-password"
          className="text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-primary"
        >
          Esqueci minha senha
        </Link>
      </motion.div>
    </div>
  )
}
