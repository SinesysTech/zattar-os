'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowRight, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      if (!data.user) throw new Error('Falha na autenticação')

      setSuccess(true)
      setTimeout(() => router.push('/app/dashboard'), 700)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Credenciais incorretas')
        } else {
          setError(err.message)
        }
      } else {
        setError('Ocorreu um erro ao entrar.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <form onSubmit={handleLogin} className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease }}
          className="space-y-2 group"
        >
          <label 
            htmlFor="email" 
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1 group-focus-within:text-primary transition-colors"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="nome@zattar.com.br"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-tactile w-full h-14 px-6 rounded-2xl outline-none text-white placeholder:text-white/10 text-lg"
            autoComplete="email"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease }}
          className="space-y-2 group"
        >
          <label 
            htmlFor="password" 
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1 group-focus-within:text-primary transition-colors"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-tactile w-full h-14 px-6 rounded-2xl outline-none text-white placeholder:text-white/10 text-lg"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive text-xs font-bold uppercase tracking-wider">
                <AlertCircle size={14} />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={isLoading || success}
            className={cn(
              "btn-luminous w-full h-14 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] transition-all",
              success && "bg-success shadow-success/20"
            )}
          >
            {success ? (
              <Check size={20} strokeWidth={3} />
            ) : isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Autenticar
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>
      </form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, ease }}
        className="mt-10 flex justify-center"
      >
        <Link 
          href="/forgot-password" 
          className="text-[10px] text-white/10 hover:text-white transition-colors font-bold uppercase tracking-widest"
        >
          Recuperar Acesso
        </Link>
      </motion.div>
    </div>
  )
}
