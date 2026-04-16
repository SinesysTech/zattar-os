'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Camera, PenLine } from 'lucide-react'
import { Heading, Text } from '@/components/ui/typography'
import {
  DocumentPeekCard,
  PublicStepCard,
  PublicStepFooter,
} from '@/shared/assinatura-digital'

export interface WelcomeStepProps {
  documento: { titulo?: string | null; pdf_original_url: string }
  selfieHabilitada?: boolean
  onNext: () => void
}

function extractFileName(url: string, fallbackTitle?: string | null): string {
  if (fallbackTitle) return fallbackTitle
  try {
    const pathname = new URL(url, 'http://localhost').pathname
    const filename = pathname.split('/').pop() || 'Documento.pdf'
    return decodeURIComponent(filename.replace(/^[a-f0-9-]{36}_/i, ''))
  } catch {
    return 'Documento.pdf'
  }
}

export function WelcomeStep({ documento, selfieHabilitada = false, onNext }: WelcomeStepProps) {
  const fileName = extractFileName(documento.pdf_original_url, documento.titulo)
  const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const stepCount = selfieHabilitada ? 4 : 3

  const steps = [
    { label: 'Confirmar dados', Icon: User },
    ...(selfieHabilitada ? [{ label: 'Verificação por foto', Icon: Camera }] : []),
    { label: 'Assinar documento', Icon: PenLine },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            chip="Contrato para assinatura"
            title={`Revise e assine em ${stepCount} passos.`}
            description="Você vai confirmar seus dados, revisar o documento e aplicar sua assinatura digital."
          >
            <div className="space-y-5">
              <DocumentPeekCard fileName={fileName} sender="Zattar Advogados" date={formattedDate} />

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                <Heading level="card" className="text-xs uppercase tracking-wider text-muted-foreground">
                  O que você vai fazer
                </Heading>
                <ol className="mt-3 space-y-3">
                  {steps.map(({ label, Icon }, idx) => (
                    <li key={label} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-background text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <Text variant="label" className="text-foreground">
                          {label}
                        </Text>
                      </div>
                      <Text variant="micro-caption" className="pt-1.5 text-muted-foreground">
                        {idx + 1}
                      </Text>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter onNext={onNext} nextLabel="Iniciar assinatura" hidePrevious />
    </div>
  )
}
