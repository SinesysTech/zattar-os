// Serviço para gerenciar processos associados aos contratos

import {
  adicionarProcessoAoContrato,
  removerProcessoDoContrato,
  listarProcessosDoContrato,
  type OperacaoContratoProcessoResult,
  type ListarContratoProcessosParams,
  type ListarContratoProcessosResult,
} from '../persistence/contrato-processo-persistence.service';

/**
 * Adiciona um processo ao contrato
 */
export async function associarProcessoAoContrato(
  contratoId: number,
  processoId: number
): Promise<OperacaoContratoProcessoResult> {
  return adicionarProcessoAoContrato(contratoId, processoId);
}

/**
 * Remove um processo do contrato
 */
export async function desassociarProcessoDoContrato(
  contratoId: number,
  processoId: number
): Promise<OperacaoContratoProcessoResult> {
  return removerProcessoDoContrato(contratoId, processoId);
}

/**
 * Lista processos associados a um contrato
 */
export async function obterProcessosDoContrato(
  params: ListarContratoProcessosParams
): Promise<ListarContratoProcessosResult> {
  return listarProcessosDoContrato(params);
}

