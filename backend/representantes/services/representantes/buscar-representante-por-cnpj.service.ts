// Serviço de busca de representante por CNPJ
// Camada de lógica de negócio com validações

import { buscarRepresentantePorCNPJ as buscarRepresentantePorCNPJPersistence } from '../representantes-persistence.service';
import type { Representante } from '@/backend/types/representantes/representantes-types';

/**
 * Busca um representante pelo CNPJ
 *
 * NOTA: Representantes são sempre pessoas físicas (advogados), portanto não possuem CNPJ.
 * Esta função sempre retorna null e existe apenas para manter consistência de interface com outras entidades.
 *
 * @param cnpj - CNPJ (ignorado)
 * @returns Sempre retorna null
 */
export async function buscarRepresentantePorCNPJ(cnpj: string): Promise<Representante | null> {
  // Representantes são sempre PF, não têm CNPJ
  return await buscarRepresentantePorCNPJPersistence(cnpj);
}
