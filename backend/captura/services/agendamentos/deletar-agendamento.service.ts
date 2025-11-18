// Serviço de aplicação para deletar agendamento

import { deletarAgendamento as deletarAgendamentoPersistence } from '../persistence/agendamento-persistence.service';

/**
 * Deleta um agendamento
 */
export async function deletarAgendamento(id: number): Promise<void> {
  await deletarAgendamentoPersistence(id);
}

