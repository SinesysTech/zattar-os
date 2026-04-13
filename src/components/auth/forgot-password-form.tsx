'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ease = [0.22, 1, 0.36, 1]

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocorreu um erro ao enviar o e-mail.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} strokeWidth={3} />
          </div>
          <h3 className="text-xl font-bold font-heading mb-2">E-mail Enviado</h3>
          <p className="text-white/40 text-sm mb-8">
            Verifique sua caixa de entrada para continuar o processo de recuperação.
          </p>
          <Link 
            href="/login" 
            className="text-[10px] text-white/20 hover:text-white transition-colors font-bold uppercase tracking-widest inline-flex items-center gap-2"
          >
            <ArrowLeft size={12} /> Voltar para o login
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2 group">
            <label 
              htmlFor="email" 
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1 group-focus-within:text-primary transition-colors"
            >
              E-mail Associado
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
          </div>

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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-luminous w-full h-14 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Recuperar Acesso'
              )}
            </button>
          </div>

          <div className="mt-10 flex justify-center">
            <Link 
              href="/login" 
              className="text-[10px] text-white/10 hover:text-white transition-colors font-bold uppercase tracking-widest"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
