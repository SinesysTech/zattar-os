"use server"

import { cookies } from "next/headers"
// Import directly from service — barrel does not export service (server-only deps)
import { buscarClientePorCPF } from "@/app/(authenticated)/partes/service"
import type { PerfilPortal } from "./domain"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatarTelefone(ddd: string | null, numero: string | null): string | null {
  if (!ddd || !numero) return null
  return `(${ddd}) ${numero}`
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function actionObterPerfilPortal(): Promise<{
  success: boolean
  data?: PerfilPortal
  error?: string
}> {
  const cookieStore = await cookies()
  const sessionRaw = cookieStore.get("portal-cpf-session")?.value

  if (!sessionRaw) {
    return { success: false, error: "Sessao nao encontrada. Faca login novamente." }
  }

  let session: { cpf: string; nome: string }
  try {
    session = JSON.parse(sessionRaw)
  } catch {
    return { success: false, error: "Sessao invalida. Faca login novamente." }
  }

  if (!session.cpf) {
    return { success: false, error: "CPF nao encontrado na sessao." }
  }

  const result = await buscarClientePorCPF(session.cpf)

  if (!result.success) {
    return { success: false, error: result.error.message ?? "Erro ao buscar dados do perfil." }
  }

  if (!result.data) {
    return { success: false, error: "Cadastro nao encontrado para este CPF." }
  }

  const cliente = result.data

  // Only PF clients have CPF-based portal access
  if (cliente.tipo_pessoa !== "pf") {
    return { success: false, error: "Tipo de cadastro incompativel com o portal." }
  }

  const endereco = cliente.endereco
  const enderecoPortal = endereco
    ? {
        logradouro: endereco.logradouro ?? "",
        numero: endereco.numero ?? "",
        complemento: endereco.complemento ?? null,
        bairro: endereco.bairro ?? "",
        cidade: endereco.municipio ?? "",
        estado: endereco.estado_sigla ?? "",
        cep: endereco.cep ?? "",
      }
    : null

  const perfil: PerfilPortal = {
    nome: cliente.nome,
    cpf: cliente.cpf,
    email: cliente.emails?.[0] ?? null,
    celular: formatarTelefone(cliente.ddd_celular, cliente.numero_celular),
    telefoneResidencial: formatarTelefone(cliente.ddd_residencial, cliente.numero_residencial),
    dataNascimento: cliente.data_nascimento,
    estadoCivil: cliente.estado_civil,
    rg: cliente.rg,
    endereco: enderecoPortal,
    totalProcessos: cliente.processos_relacionados?.length ?? 0,
  }

  return { success: true, data: perfil }
}
