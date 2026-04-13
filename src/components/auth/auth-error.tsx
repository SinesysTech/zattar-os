'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export function AuthError({ error }: { error?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-8"
      >
        <AlertTriangle size={40} />
      </motion.div>

      <h2 className="text-2xl font-bold font-heading mb-4">Erro de Autenticação</h2>
      
      <p className="text-white/40 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
        {error || 'Ocorreu um problema inesperado durante o processo de login. Por favor, tente novamente.'}
      </p>

      <Link 
        href="/login" 
        className="btn-luminous w-full h-14 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
      >
        <ArrowLeft size={16} />
        Voltar ao Início
      </Link>
    </div>
  )
}
