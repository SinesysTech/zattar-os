// Serviço de listagem de clientes
// Gerencia a lógica de negócio para listar clientes com filtros e paginação

import {
  listarClientes as listarClientesDb,
  listarClientesComEndereco as listarClientesComEnderecoDb,
  listarClientesComEnderecoEProcessos as listarClientesComEnderecoEProcessosDb,
} from '../persistence/cliente-persistence.service';
import type {
  ListarClientesParams,
  ListarClientesResult,
} from '@/backend/types/partes/clientes-types';

/**
 * Parâmetros estendidos para incluir endereços e processos
 */
export interface ObterClientesParams extends ListarClientesParams {
  incluir_endereco?: boolean;
  incluir_processos?: boolean;
}

/**
 * Lista clientes com filtros e paginação
 *
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de clientes
 * 4. Se incluir_endereco=true, popula dados de endereço via JOIN
 * 5. Se incluir_processos=true, busca processos relacionados via processo_partes
 */
export async function obterClientes(
  params: ObterClientesParams = {}
): Promise<ListarClientesResult> {
  const { incluir_endereco, incluir_processos, ...listParams } = params;

  // Se precisar incluir processos, usar a função que busca ambos
  if (incluir_processos) {
    return listarClientesComEnderecoEProcessosDb(listParams);
  }

  if (incluir_endereco) {
    return listarClientesComEnderecoDb(listParams);
  }

  return listarClientesDb(listParams);
}

