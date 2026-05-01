// Serviço para calcular próxima execução de agendamentos
// Horários são interpretados como America/Sao_Paulo (UTC-3, sem horário de verão desde 2019)

import type { Periodicidade } from '../../types/agendamentos-types';

// Brasil permanece UTC-3 desde a abolição do horário de verão em 2019
const BRASILIA_OFFSET_HOURS = 3;

/**
 * Retorna uma Date cujos campos getUTC* correspondem ao dia/hora em Brasília.
 * Permite usar aritmética UTC para operar sobre datas no calendário brasileiro.
 */
function emFusoBrasilia(data: Date): Date {
  return new Date(data.getTime() - BRASILIA_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Define o horário de uma data interpretando horas/minutos como Brasília (UTC-3),
 * convertendo para UTC via setUTCHours. O JavaScript normaliza overflow de dia
 * automaticamente (ex: hora 26 → hora 2 do dia seguinte em UTC).
 */
function comHorarioBrasilia(base: Date, horas: number, minutos: number): Date {
  const result = new Date(base);
  result.setUTCHours(horas + BRASILIA_OFFSET_HOURS, minutos, 0, 0);
  return result;
}

/**
 * Converte "HH:mm" para { horas, minutos }. Lança se formato inválido.
 */
function parseHorario(horario: string): { horas: number; minutos: number } {
  const m = horario.match(/^(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Formato de horário inválido: ${horario}. Use HH:mm`);
  const horas = parseInt(m[1], 10);
  const minutos = parseInt(m[2], 10);
  if (horas > 23 || minutos > 59) throw new Error(`Horário inválido: ${horario}`);
  return { horas, minutos };
}

/**
 * Calcula a próxima execução baseado em periodicidade, dias_intervalo e horário.
 *
 * @param periodicidade - 'diario', 'a_cada_N_dias' ou 'a_cada_N_horas'
 * @param dias_intervalo - Dias (a_cada_N_dias) ou horas (a_cada_N_horas) do intervalo
 * @param horario - HH:mm em America/Sao_Paulo (ignorado para a_cada_N_horas)
 * @param referencia - Data/hora de referência (default: now())
 * @param janela - Janela de execução para a_cada_N_horas ({ inicio: 'HH:mm', fim: 'HH:mm' }, Brasília)
 *                 Fora da janela, proxima_execucao pula para inicio do dia seguinte
 * @returns Timestamp ISO da próxima execução (em UTC)
 */
export function calcularProximaExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string,
  referencia: Date = new Date(),
  janela?: { inicio: string; fim: string }
): string {
  if (periodicidade === 'a_cada_N_horas') {
    const horas = dias_intervalo && dias_intervalo > 0 ? dias_intervalo : 1;
    const candidata = new Date(referencia.getTime() + horas * 60 * 60 * 1000);
    candidata.setSeconds(0, 0);

    if (!janela) return candidata.toISOString();

    // Verificar se candidata está dentro da janela (em Brasília)
    const candidataBrasilia = emFusoBrasilia(candidata);
    const { horas: hInicio, minutos: mInicio } = parseHorario(janela.inicio);
    const { horas: hFim, minutos: mFim } = parseHorario(janela.fim);

    const minutosCandidata =
      candidataBrasilia.getUTCHours() * 60 + candidataBrasilia.getUTCMinutes();
    const minutosFim = hFim * 60 + mFim;

    if (minutosCandidata <= minutosFim) {
      return candidata.toISOString();
    }

    // Após o fim da janela: pula para inicio do dia seguinte (em Brasília)
    const diaSegBrasilia = new Date(candidataBrasilia);
    diaSegBrasilia.setUTCDate(diaSegBrasilia.getUTCDate() + 1);
    return comHorarioBrasilia(diaSegBrasilia, hInicio, mInicio).toISOString();
  }

  const { horas, minutos } = parseHorario(horario);
  const refBrasilia = emFusoBrasilia(referencia);

  if (periodicidade === 'diario') {
    const proxima = new Date(refBrasilia);
    proxima.setUTCDate(proxima.getUTCDate() + 1);
    return comHorarioBrasilia(proxima, horas, minutos).toISOString();
  }

  if (periodicidade === 'a_cada_N_dias') {
    if (!dias_intervalo || dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
    const proxima = new Date(refBrasilia);
    proxima.setUTCDate(proxima.getUTCDate() + dias_intervalo);
    return comHorarioBrasilia(proxima, horas, minutos).toISOString();
  }

  throw new Error(`Periodicidade inválida: ${periodicidade}`);
}

/**
 * Recalcula próxima execução após uma execução concluída.
 * Aceita janela opcional para respeitar horário comercial em schedules horários.
 */
export function recalcularProximaExecucaoAposExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string,
  janela?: { inicio: string; fim: string }
): string {
  return calcularProximaExecucao(periodicidade, dias_intervalo, horario, new Date(), janela);
}
