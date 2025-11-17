// Serviço de busca de contrato
// Gerencia a lógica de negócio para buscar contratos por diferentes critérios

import {
  buscarContratoPorId,
  type Contrato,
} from '../persistence/contrato-persistence.service';

/**
 * Busca um contrato por ID
 */
export async function obterContratoPorId(id: number): Promise<Contrato | null> {
  return buscarContratoPorId(id);
}

