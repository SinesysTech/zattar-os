import { lerPacoteParaWizard } from '@/shared/assinatura-digital/services/pacote.service'
import { notFound } from 'next/navigation'
import { PacoteTerminalState } from './page-client'
import { PacoteWizardClient } from './pacote-wizard-client'

export const runtime = 'nodejs'

export default async function AssinaturaPacotePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token || token.length !== 64) {
    notFound()
  }

  const dados = await lerPacoteParaWizard(token)
  if (!dados) notFound()

  // Estados terminais (expirado/cancelado/concluído) — bloqueia com tela amigável.
  if (dados.status_efetivo !== 'ativo') {
    return <PacoteTerminalState status={dados.status_efetivo} />
  }

  // Pacote ativo mas sem dados de hidratação — configuração do contrato/formulário
  // está inconsistente. Renderiza uma tela de erro dedicada em vez de tela branca.
  if (!dados.hidratacao) {
    const isDev = process.env.NODE_ENV === 'development'
    return (
      <PacoteTerminalState
        status="indisponivel"
        debugMotivo={isDev ? dados.motivoHidratacaoBloqueada ?? null : null}
        debugContexto={isDev ? dados.debugContexto ?? null : null}
      />
    )
  }

  return <PacoteWizardClient dados={dados} />
}
