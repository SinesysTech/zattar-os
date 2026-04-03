// Serviço de aplicação para criar agendamento

import { criarAgendamento as criarAgendamentoPersistence } from '../persistence/agendamento-persistence.service';
import { calcularProximaExecucao } from './calcular-proxima-execucao.service';
import type { CriarAgendamentoParams, Agendamento } from '../../types/agendamentos-types';

/**
 * Cria um novo agendamento e calcula a próxima execução
 */
export async function criarAgendamento(
  params: CriarAgendamentoParams
): Promise<Agendamento> {
  // Validar periodicidade e dias_intervalo
  if (params.periodicidade === 'a_cada_N_dias') {
    if (!params.dias_intervalo || params.dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
  }

  // Calcular próxima execução
  const proximaExecucao = calcularProximaExecucao(
    params.periodicidade,
    params.dias_intervalo || null,
    params.horario
  );

  // Criar agendamento com próxima execução calculada
  // Usar type assertion para incluir proxima_execucao
  const agendamento = await criarAgendamentoPersistence({
    ...params,
    proxima_execucao: proximaExecucao,
  } as CriarAgendamentoParams & { proxima_execucao?: string });

  return agendamento;
}

