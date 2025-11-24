// Serviço de listagem de clientes
// Gerencia a lógica de negócio para listar clientes com filtros e paginação

import {
  listarClientes as listarClientesDb,
  listarClientesComEndereco as listarClientesComEnderecoDb,
} from '../persistence/cliente-persistence.service';
import type {
  ListarClientesParams,
  ListarClientesResult,
} from '@/backend/types/partes/clientes-types';

/**
 * Parâmetros estendidos para incluir endereços
 */
export interface ObterClientesParams extends ListarClientesParams {
  incluir_endereco?: boolean;
}

/**
 * Lista clientes com filtros e paginação
 *
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de clientes
 * 4. Se incluir_endereco=true, popula dados de endereço via JOIN
 */
export async function obterClientes(
  params: ObterClientesParams = {}
): Promise<ListarClientesResult> {
  const { incluir_endereco, ...listParams } = params;

  if (incluir_endereco) {
    return listarClientesComEnderecoDb(listParams);
  }

  return listarClientesDb(listParams);
}

