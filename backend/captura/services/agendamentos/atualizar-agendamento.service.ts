// Serviço de aplicação para atualizar agendamento

import { atualizarAgendamento as atualizarAgendamentoPersistence, buscarAgendamentoPorId } from '../persistence/agendamento-persistence.service';
import { calcularProximaExecucao } from './calcular-proxima-execucao.service';
import type { AtualizarAgendamentoParams, Agendamento } from '@/backend/types/captura/agendamentos-types';

/**
 * Atualiza um agendamento e recalcula próxima execução se necessário
 */
export async function atualizarAgendamento(
  id: number,
  params: AtualizarAgendamentoParams
): Promise<Agendamento> {
  // Buscar agendamento atual para obter valores que não estão sendo atualizados
  const atual = await buscarAgendamentoPorId(id);
  if (!atual) {
    throw new Error('Agendamento não encontrado');
  }

  // Determinar periodicidade e dias_intervalo finais
  const periodicidadeFinal = params.periodicidade ?? atual.periodicidade;
  let diasIntervaloFinal: number | null;

  if (periodicidadeFinal === 'diario') {
    diasIntervaloFinal = null;
  } else {
    // a_cada_N_dias
    if (params.dias_intervalo !== undefined) {
      diasIntervaloFinal = params.dias_intervalo;
    } else if (params.periodicidade === 'a_cada_N_dias' && atual.periodicidade === 'diario') {
      // Mudou de diario para a_cada_N_dias mas não forneceu dias_intervalo
      throw new Error('dias_intervalo é obrigatório quando periodicidade = a_cada_N_dias');
    } else {
      diasIntervaloFinal = atual.dias_intervalo;
    }
  }

  // Validar dias_intervalo
  if (periodicidadeFinal === 'a_cada_N_dias' && (!diasIntervaloFinal || diasIntervaloFinal <= 0)) {
    throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
  }

  // Se periodicidade, dias_intervalo ou horário mudaram, recalcular próxima_execucao
  const horarioFinal = params.horario ?? atual.horario;
  const precisaRecalcular =
    params.periodicidade !== undefined ||
    params.dias_intervalo !== undefined ||
    params.horario !== undefined;

  if (precisaRecalcular) {
    const proximaExecucao = calcularProximaExecucao(
      periodicidadeFinal,
      diasIntervaloFinal,
      horarioFinal
    );
    
    // Adicionar proxima_execucao aos params de atualização
    (params as AtualizarAgendamentoParams & { proxima_execucao?: string }).proxima_execucao = proximaExecucao;
  }

  return await atualizarAgendamentoPersistence(id, params);
}

