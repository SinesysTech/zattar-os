// Serviço para calcular próxima execução de agendamentos

import type { Periodicidade } from '../../types/agendamentos-types';

/**
 * Calcula a próxima execução baseado em periodicidade, dias_intervalo e horário
 * 
 * @param periodicidade - Tipo de periodicidade ('diario' ou 'a_cada_N_dias')
 * @param dias_intervalo - Número de dias (usado quando periodicidade = 'a_cada_N_dias')
 * @param horario - Horário no formato HH:mm
 * @param referencia - Data/hora de referência (default: now())
 * @returns Timestamp ISO da próxima execução
 */
export function calcularProximaExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string, // HH:mm
  referencia: Date = new Date()
): string {
  // Validar formato de horário
  const horarioMatch = horario.match(/^(\d{2}):(\d{2})$/);
  if (!horarioMatch) {
    throw new Error(`Formato de horário inválido: ${horario}. Use formato HH:mm`);
  }

  const [, horasStr, minutosStr] = horarioMatch;
  const horas = parseInt(horasStr, 10);
  const minutos = parseInt(minutosStr, 10);

  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
    throw new Error(`Horário inválido: ${horario}. Horas devem estar entre 00-23 e minutos entre 00-59`);
  }

  const proximaExecucao = new Date(referencia);

  if (periodicidade === 'diario') {
    // Diário: sempre amanhã no horário especificado
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);
    proximaExecucao.setHours(horas, minutos, 0, 0);
  } else if (periodicidade === 'a_cada_N_dias') {
    if (!dias_intervalo || dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
    
    // A cada N dias: sempre hoje + N dias no horário especificado
    proximaExecucao.setDate(proximaExecucao.getDate() + dias_intervalo);
    proximaExecucao.setHours(horas, minutos, 0, 0);
  }

  return proximaExecucao.toISOString();
}

/**
 * Recalcula próxima execução após uma execução
 * Usa a data/hora atual como referência e adiciona o intervalo
 */
export function recalcularProximaExecucaoAposExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string
): string {
  const agora = new Date();
  
  if (periodicidade === 'diario') {
    // Próxima execução: amanhã no horário especificado
    const proxima = new Date(agora);
    proxima.setDate(proxima.getDate() + 1);
    const [horas, minutos] = horario.split(':').map(Number);
    proxima.setHours(horas, minutos, 0, 0);
    return proxima.toISOString();
  } else if (periodicidade === 'a_cada_N_dias') {
    if (!dias_intervalo || dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
    
    // Próxima execução: hoje + N dias no horário especificado
    const proxima = new Date(agora);
    proxima.setDate(proxima.getDate() + dias_intervalo);
    const [horas, minutos] = horario.split(':').map(Number);
    proxima.setHours(horas, minutos, 0, 0);
    return proxima.toISOString();
  }

  throw new Error(`Periodicidade inválida: ${periodicidade}`);
}

