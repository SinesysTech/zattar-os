'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ease = [0.22, 1, 0.36, 1]

export function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.push('/app/dashboard'), 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao atualizar senha.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold font-heading mb-2">Nova Senha</h2>
        <p className="text-white/30 text-sm">Crie uma senha forte para seu acesso.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1 group-focus-within:text-primary transition-colors">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-tactile w-full h-14 px-6 rounded-2xl outline-none text-white placeholder:text-white/10 text-lg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1 group-focus-within:text-primary transition-colors">
            Confirmar Senha
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-tactile w-full h-14 px-6 rounded-2xl outline-none text-white placeholder:text-white/10 text-lg"
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
            disabled={isLoading || success}
            className="btn-luminous w-full h-14 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
          >
            {success ? (
              <Check size={20} strokeWidth={3} />
            ) : isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Atualizar Senha'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
