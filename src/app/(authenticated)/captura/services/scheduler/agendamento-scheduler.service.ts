// Serviço principal do scheduler para executar agendamentos automaticamente

import { clamarAgendamentosParaExecutar } from '../persistence/agendamento-persistence.service';
import { executarAgendamento } from './executar-agendamento.service';

/**
 * Executa o scheduler: reivindica atomicamente agendamentos prontos e os executa.
 * O lock contra execuções duplicadas é feito no banco via FOR UPDATE SKIP LOCKED
 * (ver função clamar_agendamentos_para_executar no Supabase), eliminando a necessidade
 * de lock in-memory que não funciona em ambientes serverless multi-instância.
 */
export async function executarScheduler(): Promise<void> {
  console.log('[Scheduler] Iniciando verificação de agendamentos...');

  try {
    const agendamentos = await clamarAgendamentosParaExecutar();

    if (agendamentos.length === 0) {
      console.log('[Scheduler] Nenhum agendamento pronto para execução');
      return;
    }

    console.log(`[Scheduler] ${agendamentos.length} agendamento(s) reivindicado(s) para execução`);

    for (const agendamento of agendamentos) {
      try {
        console.log(`[Scheduler] Executando agendamento ID ${agendamento.id} (${agendamento.tipo_captura})`);
        await executarAgendamento(agendamento, true);
        console.log(`[Scheduler] Agendamento ID ${agendamento.id} executado com sucesso`);
      } catch (error) {
        console.error(`[Scheduler] Erro ao executar agendamento ID ${agendamento.id}:`, error);
      }
    }

    console.log(`[Scheduler] Processamento concluído. ${agendamentos.length} agendamento(s) processado(s)`);
  } catch (error) {
    console.error('[Scheduler] Erro ao executar scheduler:', error);
    throw error;
  }
}

