// Serviço de listagem de usuários
// Gerencia a lógica de negócio para listar usuários com filtros e paginação

import {
  listarUsuarios as listarUsuariosDb,
  type ListarUsuariosParams,
  type ListarUsuariosResult,
} from '../persistence/usuario-persistence.service';

/**
 * Lista usuários com filtros e paginação
 * 
 * Fluxo:
 * 1. Aplica filtros de busca, status, OAB, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de usuários
 */
export async function obterUsuarios(
  params: ListarUsuariosParams = {}
): Promise<ListarUsuariosResult> {
  return listarUsuariosDb(params);
}

