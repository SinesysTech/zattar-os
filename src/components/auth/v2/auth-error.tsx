'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export function AuthErrorV2({ error }: { error?: string }) {
  return (
    <div className="flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="relative h-10 w-10">
          <Image
            src="/logos/logo-small-dark.svg"
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

      <div className="flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/5 border border-destructive/10">
          <ShieldAlert className="h-6 w-6 text-destructive/60" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
            Algo deu errado.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-64 mx-auto">
            {error || 'Ocorreu um erro não especificado durante a autenticação.'}
          </p>
        </div>

        {/* CTA */}
        <Button variant="outline" size="lg" className="w-full cursor-pointer" asChild>
          <Link href="/app/login">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </Button>
      </div>
    </div>
  )
}
