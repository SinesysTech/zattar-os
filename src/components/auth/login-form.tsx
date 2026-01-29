'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
        console.error('Erro de autenticação:', error)
        if (
          error.message?.includes('Database error querying schema') ||
          error.message?.includes('email_change')
        ) {
          console.error(
            'Erro conhecido do Supabase Auth relacionado a email_change. ' +
              'Este é um bug interno do Supabase. Verifique os logs do Supabase para mais detalhes.'
          )
        }
        throw error
      }

      if (!data.user) {
        throw new Error('Falha na autenticação: usuário não retornado')
      }

      router.push('/app/dashboard')
    } catch (error: unknown) {
      console.error('Erro no login:', error)
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login')
        } else if (
          error.message.includes('500') ||
          error.message.includes('Database error querying schema') ||
          error.message.includes('Database error')
        ) {
          setError(
            'Erro no servidor de autenticação. Por favor, tente novamente mais tarde.'
          )
        } else if (error.message.includes('email_change')) {
          setError(
            'Erro interno de autenticação. Por favor, entre em contato com o suporte.'
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
      {/* Mobile-only logo (hidden on lg+ where brand panel shows) */}
      <div className="mb-10 flex justify-center lg:hidden">
        <Image
          src="/logos/logomarca-light.svg"
          alt="Zattar Advogados"
          width={200}
          height={30}
          className="h-auto w-[200px] object-contain dark:hidden"
          priority
        />
        <Image
          src="/logos/logomarca-dark.svg"
          alt="Zattar Advogados"
          width={200}
          height={30}
          className="hidden h-auto w-[200px] object-contain dark:block"
          priority
        />
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-muted-foreground">
          Entre com suas credenciais para acessar o portal
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="h-11 pl-10 bg-white dark:bg-input/30"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/app/forgot-password"
              className="text-sm text-primary transition-colors hover:text-primary/80"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="h-11 pl-10 pr-10 bg-white dark:bg-input/30"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm leading-relaxed text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-11"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

    </div>
  )
}
