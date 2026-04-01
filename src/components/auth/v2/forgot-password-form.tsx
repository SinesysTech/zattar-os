'use client'

/**
 * ForgotPasswordForm V2 — "Átrio de Vidro" (Light Mode)
 */

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  AtSign,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Shared AuthInput (Light Mode) ───────────────────────────────────────────

function AuthInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative group">
      <div
        className={cn(
          'absolute -inset-0.75 rounded-xl transition-all duration-500 pointer-events-none',
          focused ? 'opacity-100' : 'opacity-0'
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
              focused ? 'text-primary' : 'text-muted-foreground/40'
            )}
          />
        </div>
        <input
          className={cn(
            'relative w-full rounded-xl border py-3.5 pl-11 pr-3.5 text-sm text-foreground',
            'bg-white/60 backdrop-blur-sm',
            'placeholder:text-muted-foreground/40',
            'transition-all duration-300 focus:outline-none',
            focused
              ? 'border-primary/30 shadow-[0_0_0_3px_oklch(0.48_0.26_281/0.06)] bg-white/80'
              : 'border-border/40 hover:border-border/60',
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
      </div>
    </div>
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

export function ForgotPasswordFormV2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
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
                Pronto.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Se o email estiver cadastrado, você receberá
                <br />
                um link para redefinir sua senha.
              </p>
            </div>

            {/* Success card */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-50/60 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Email enviado
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>
            </div>

            <div className="mt-2 text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
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
                Sem problemas.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Digite seu email e enviamos
                <br />
                um link para redefinir.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <AuthInput
                icon={AtSign}
                id="email"
                type="email"
                placeholder="voce@zattar.com.br"
                className="font-mono"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

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
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar link
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
