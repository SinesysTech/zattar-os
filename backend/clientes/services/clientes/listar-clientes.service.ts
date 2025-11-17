// Serviço de listagem de clientes
// Gerencia a lógica de negócio para listar clientes com filtros e paginação

import {
  listarClientes as listarClientesDb,
  type ListarClientesParams,
  type ListarClientesResult,
} from '../persistence/cliente-persistence.service';

/**
 * Lista clientes com filtros e paginação
 * 
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de clientes
 */
export async function obterClientes(
  params: ListarClientesParams = {}
): Promise<ListarClientesResult> {
  return listarClientesDb(params);
}

