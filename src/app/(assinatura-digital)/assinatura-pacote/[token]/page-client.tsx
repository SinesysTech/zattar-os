'use client'

import { AlertTriangle, PartyPopper, XCircle } from 'lucide-react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import type { PacoteStatus } from '@/shared/assinatura-digital/types/pacote'

interface Props {
  status: PacoteStatus
}

/**
 * Telas terminais do pacote: exibidas quando o link não pode mais ser usado
 * (expirado, cancelado ou já concluído). O fluxo ativo passa direto pelo
 * `PacoteWizardClient`, então este componente só renderiza estes 3 casos.
 */
export function PacoteTerminalState({ status }: Props) {
  const content = MAP[status]
  if (!content) return null

  const { icon, iconTone, title, description, tint } = content
  const iconClasses = {
    warning: 'bg-warning/10 text-warning ring-warning/20',
    destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
    success: 'bg-success/10 text-success ring-success/20',
  }[iconTone]

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-surface-dim p-4">
      <AmbientBackdrop blurIntensity={55} tint={tint} />
      <GlassPanel depth={2} className="relative z-10 max-w-md space-y-5 p-8 text-center sm:p-10">
        <div className="flex justify-center">
          <span
            className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${iconClasses}`}
          >
            {icon}
          </span>
        </div>
        <div className="space-y-2">
          <Heading level="page" className="font-display text-2xl tracking-tight sm:text-3xl">
            {title}
          </Heading>
          <Text variant="caption" className="block text-muted-foreground leading-relaxed">
            {description}
          </Text>
        </div>
      </GlassPanel>
    </div>
  )
}

const MAP: Partial<
  Record<
    PacoteStatus,
    {
      icon: React.ReactNode
      iconTone: 'warning' | 'destructive' | 'success'
      title: string
      description: string
      tint: 'primary' | 'success'
    }
  >
> = {
  expirado: {
    icon: <AlertTriangle className="h-7 w-7" strokeWidth={2} />,
    iconTone: 'warning',
    title: 'Link expirado',
    description:
      'O prazo pra assinar este pacote de documentos já passou. Entre em contato com o escritório responsável pra receber um novo link.',
    tint: 'primary',
  },
  cancelado: {
    icon: <XCircle className="h-7 w-7" strokeWidth={2} />,
    iconTone: 'destructive',
    title: 'Link cancelado',
    description:
      'Este pacote foi cancelado pelo escritório e não está mais disponível para assinatura. Entre em contato caso precise de esclarecimento.',
    tint: 'primary',
  },
  concluido: {
    icon: <PartyPopper className="h-7 w-7" strokeWidth={2} />,
    iconTone: 'success',
    title: 'Tudo pronto!',
    description:
      'Todos os documentos deste pacote foram assinados com sucesso. Você pode fechar esta página com tranquilidade.',
    tint: 'success',
  },
}
