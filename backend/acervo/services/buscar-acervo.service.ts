// Serviço de busca de acervo
// Gerencia a lógica de negócio para buscar processos do acervo por diferentes critérios

import { buscarAcervoPorId } from './persistence/listar-acervo.service';
import type { Acervo } from '@/backend/types/acervo/types';

/**
 * Busca um processo do acervo por ID
 */
export async function obterAcervoPorId(id: number): Promise<Acervo | null> {
  return buscarAcervoPorId(id);
}

