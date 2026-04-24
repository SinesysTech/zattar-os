'use client'

import { AlertTriangle, Construction, PartyPopper, XCircle } from 'lucide-react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import type { PacoteStatus } from '@/shared/assinatura-digital/types/pacote'

/**
 * Estados de UI suportados pela tela terminal. Inclui o tipo do banco
 * (`PacoteStatus`) mais `'indisponivel'`, que é puramente de apresentação:
 * pacote está ativo mas a hidratação (contrato/segmento/formulário) falhou.
 */
export type PacoteTerminalStatus = PacoteStatus | 'indisponivel'

interface Props {
  status: PacoteTerminalStatus
  /**
   * Apenas em dev: motivo diagnóstico quando um pacote ativo caiu para
   * `indisponivel`. O page.tsx passa null em produção.
   */
  debugMotivo?: string | null
  /** Apenas em dev: IDs do contrato/segmento/formulário envolvidos. */
  debugContexto?: {
    contratoId: number | null
    segmentoId: number | null
    formularioId: number | null
  } | null
}

const DEBUG_LABELS: Record<string, string> = {
  contrato_nao_encontrado: 'Contrato não encontrado no banco',
  contrato_sem_cliente: 'Contrato sem cliente vinculado',
  contrato_sem_segmento: 'Contrato sem segmento definido — edite o contrato e escolha um segmento',
  segmento_sem_formulario_contrato:
    'Nenhum formulário tipo "contrato" ativo cadastrado neste segmento — configure em Assinatura Digital › Formulários',
  formulario_nao_encontrado: 'Formulário referenciado pelo pacote não existe mais ou foi desativado',
}

/**
 * Telas terminais do pacote: exibidas quando o link não pode mais ser usado
 * (expirado, cancelado, já concluído) ou quando a configuração do contrato
 * está inconsistente e bloqueia a abertura do wizard (`indisponivel`).
 */
export function PacoteTerminalState({ status, debugMotivo, debugContexto }: Props) {
  const content = MAP[status]
  if (!content) return null

  const { icon, iconTone, title, description, tint } = content
  const iconClasses = {
    warning: 'bg-warning/10 text-warning ring-warning/20',
    destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
    success: 'bg-success/10 text-success ring-success/20',
  }[iconTone]
  const debugLabel = debugMotivo ? DEBUG_LABELS[debugMotivo] ?? debugMotivo : null

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
        {debugLabel ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-left">
            <Text variant="meta-label" className="block text-warning">
              Dev diagnóstico
            </Text>
            <Text variant="caption" className="mt-1 block text-muted-foreground">
              {debugLabel}
            </Text>
            {debugContexto ? (
              <Text variant="meta-label" className="mt-2 block text-muted-foreground font-mono">
                contrato_id={debugContexto.contratoId ?? '—'} · segmento_id=
                {debugContexto.segmentoId ?? '—'} · formulario_id=
                {debugContexto.formularioId ?? '—'}
              </Text>
            ) : null}
          </div>
        ) : null}
      </GlassPanel>
    </div>
  )
}

const MAP: Partial<
  Record<
    PacoteTerminalStatus,
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
  indisponivel: {
    icon: <Construction className="h-7 w-7" strokeWidth={2} />,
    iconTone: 'warning',
    title: 'Pacote indisponível no momento',
    description:
      'Este link existe, mas o pacote ainda não pode ser aberto para assinatura — alguma configuração do contrato ou do formulário está incompleta. Entre em contato com o escritório para que revisem e reenviem o link.',
    tint: 'primary',
  },
}
