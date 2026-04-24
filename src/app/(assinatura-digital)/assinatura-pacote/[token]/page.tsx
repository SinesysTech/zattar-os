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

  // Estados terminais — antes de abrir o wizard, bloqueia com tela amigável.
  if (dados.status_efetivo !== 'ativo' || !dados.hidratacao) {
    return <PacoteTerminalState status={dados.status_efetivo} />
  }

  return <PacoteWizardClient dados={dados} />
}
