// Serviço de aplicação para buscar agendamento por ID

import { buscarAgendamentoPorId as buscarAgendamentoPorIdPersistence } from '../persistence/agendamento-persistence.service';
import type { Agendamento } from '../../types/agendamentos-types';

/**
 * Busca um agendamento por ID
 */
export async function buscarAgendamento(id: number): Promise<Agendamento | null> {
  return await buscarAgendamentoPorIdPersistence(id);
}

