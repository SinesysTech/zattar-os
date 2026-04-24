'use client'

import { useEffect, useState } from 'react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import FormularioContainer from '@/app/(assinatura-digital)/_wizard/form/formulario-container'
import type { PacoteParaWizard } from '@/shared/assinatura-digital/services/pacote.service'
import type {
  Template,
  DynamicFormSchema,
  MetadadoSeguranca,
} from '@/shared/assinatura-digital/types'

interface Props {
  dados: PacoteParaWizard
}

/**
 * Hidrata o `useFormularioStore` com os dados já conhecidos do pacote
 * (cliente, contrato, parte contrária, templates, formulário) e abre o
 * wizard público a partir do step de Visualização. Pula os steps iniciais
 * de coleta (CPF → Identidade → Contato → DynamicForm) porque esses dados
 * foram preenchidos no admin na hora de criar o contrato.
 */
export function PacoteWizardClient({ dados }: Props) {
  const [hidratado, setHidratado] = useState(false)

  useEffect(() => {
    if (!dados.hidratacao) return

    const { contrato, inputData, segmento, formulario, templates, templateUuids } = dados.hidratacao

    const store = useFormularioStore.getState()

    // Limpeza total antes de hidratar — sessionStorage pode carregar estado
    // de uma sessão anterior (outro pacote/formulário). Isto também zera
    // fotoBase64/assinaturaBase64/pdfsGerados, obrigando o cliente a recapturar.
    store.resetAll()

    const templatesConvertidos: Template[] = templates.map((t) => ({
      id: t.id,
      template_uuid: t.template_uuid,
      nome: t.nome,
      tipo_template: t.conteudo_markdown ? 'markdown' : 'pdf',
      conteudo_markdown: t.conteudo_markdown ?? null,
      pdf_url: t.pdf_url ?? null,
      ativo: t.ativo,
      status: t.ativo ? 'ativo' : 'inativo',
      versao: 1,
      arquivo_original: t.arquivo_original ?? null,
      campos: t.campos,
      created_at: '',
      updated_at: '',
    }))

    store.hydrateContext({
      segmentoId: segmento.id,
      formularioId: formulario.id,
      segmentoNome: segmento.nome,
      formularioNome: formulario.nome,
      templateIds: templateUuids,
      templates: templatesConvertidos,
      formSchema: (formulario.form_schema as DynamicFormSchema | null) ?? undefined,
      flowConfig: {
        foto_necessaria: formulario.foto_necessaria,
        geolocation_necessaria: formulario.geolocation_necessaria,
        metadados_seguranca: (formulario.metadados_seguranca ?? [
          'ip',
          'user_agent',
        ]) as MetadadoSeguranca[],
      },
    })

    const cliente = inputData.cliente

    store.setDadosCPF({
      cpf: cliente.cpf ?? '',
      clienteExistente: true,
      clienteId: cliente.id,
    })

    const celularCompleto = cliente.ddd_celular && cliente.numero_celular
      ? `(${cliente.ddd_celular}) ${cliente.numero_celular}`
      : cliente.numero_celular ?? ''

    const emailPrincipal = cliente.emails?.[0] ?? ''

    store.setDadosPessoais({
      cliente_id: cliente.id,
      nome_completo: cliente.nome,
      cpf: cliente.cpf ?? '',
      rg: cliente.rg ?? undefined,
      data_nascimento: cliente.data_nascimento ?? '',
      estado_civil: cliente.estado_civil ?? '',
      genero: cliente.genero ?? '',
      nacionalidade: cliente.nacionalidade ?? '',
      email: emailPrincipal,
      celular: celularCompleto,
      telefone: cliente.numero_residencial ?? undefined,
      endereco_cep: cliente.endereco?.cep ?? '',
      endereco_logradouro: cliente.endereco?.logradouro ?? '',
      endereco_numero: cliente.endereco?.numero ?? '',
      endereco_complemento: cliente.endereco?.complemento ?? undefined,
      endereco_bairro: cliente.endereco?.bairro ?? '',
      endereco_cidade: cliente.endereco?.municipio ?? '',
      endereco_uf: cliente.endereco?.estado_sigla ?? '',
    })

    const clienteDados = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf ?? null,
      cnpj: cliente.cnpj ?? null,
      email: emailPrincipal || null,
      celular: cliente.numero_celular ?? null,
      telefone: cliente.numero_residencial ?? null,
    }

    const parteContrariaDados = inputData.parteContrariaNome
      ? [{ id: 0, nome: inputData.parteContrariaNome }]
      : undefined

    store.setDadosContrato({
      contrato_id: contrato.id,
      cliente_dados: clienteDados,
      ...(parteContrariaDados ? { parte_contraria_dados: parteContrariaDados } : {}),
      ...inputData.ctxExtras,
    })

    store.setContratoJaCriado(true)
    store.setEtapaAtual(0)

    setHidratado(true)
  }, [dados])

  if (!dados.hidratacao || !hidratado) {
    return null
  }

  return <FormularioContainer modo="pacote" />
}
