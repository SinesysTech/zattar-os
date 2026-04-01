'use client'

/**
 * AuthError V2 — Refined (Light Mode, Internal Typography)
 */

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'

export function AuthErrorV2({ error }: { error?: string }) {
  return (
    <div className="flex flex-col">
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

      <motion.div
        className="flex flex-col gap-8"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/6 border border-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive/60" />
          </div>
        </div>

        {/* Heading — font-heading matches internal */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
            Algo deu errado.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-65 mx-auto">
            {error ||
              'Ocorreu um erro não especificado durante a autenticação.'}
          </p>
        </div>

        {/* CTA — outline button matching internal variant */}
        <Link
          href="/app/login"
          className="flex w-full cursor-pointer items-center justify-center gap-2 h-11 rounded-lg border border-input bg-white/60 backdrop-blur-sm text-sm font-medium text-foreground/70 transition-all duration-200 hover:bg-white/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </motion.div>
    </div>
  )
}
