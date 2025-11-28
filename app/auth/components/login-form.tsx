'use client'

import { cn } from '@/app/_lib/utils/utils'
import { createClient } from '@/app/_lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { Typography } from '@/components/ui/typography'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
        // Verificar se é o erro específico do Supabase Auth com email_change
        if (error.message?.includes('Database error querying schema') || 
            error.message?.includes('email_change')) {
          console.error('Erro conhecido do Supabase Auth relacionado a email_change. ' +
            'Este é um bug interno do Supabase. Verifique os logs do Supabase para mais detalhes.')
        }
        throw error
      }
      
      if (!data.user) {
        throw new Error('Falha na autenticação: usuário não retornado')
      }
      
      // Redirecionar para o dashboard após login bem-sucedido
      router.push('/')
    } catch (error: unknown) {
      console.error('Erro no login:', error)
      if (error instanceof Error) {
        // Mensagens de erro mais amigáveis
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
            'Erro no servidor de autenticação do Supabase. ' +
            'Este é um problema conhecido relacionado ao schema do banco de dados. ' +
            'Por favor, entre em contato com o suporte do Supabase ou tente novamente mais tarde.'
          )
        } else if (error.message.includes('email_change')) {
          setError(
            'Erro interno de autenticação relacionado ao schema do banco de dados. ' +
            'Este é um bug conhecido do Supabase Auth. Por favor, entre em contato com o suporte do Supabase.'
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
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Image
              src="/zattar.png"
              alt="Zattar Advogados"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <Typography.Small className="text-red-500">{error}</Typography.Small>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
