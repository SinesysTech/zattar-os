// Serviço de listagem de assistentes
// Gerencia a lógica de negócio para listar assistentes com filtros e paginação

import {
  listarAssistentes as listarAssistentesDb,
  type ListarAssistentesParams,
  type ListarAssistentesResult,
} from './assistente-persistence.service';

/**
 * Lista assistentes com filtros e paginação
 *
 * Fluxo:
 * 1. Valida parâmetros de entrada
 * 2. Chama serviço de persistência para buscar dados
 * 3. Retorna dados paginados
 */
export async function listarAssistentes(
  params: ListarAssistentesParams
): Promise<ListarAssistentesResult> {
  // Validação dos parâmetros
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;

  if (pagina < 1) {
    throw new Error('Página deve ser maior ou igual a 1');
  }

  if (limite <= 0) {
    throw new Error('Limite deve ser maior que 0');
  }

  // Chama serviço de persistência
  return listarAssistentesDb({ ...params, pagina, limite });
}