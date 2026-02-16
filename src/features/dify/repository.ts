import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { DifyExecucaoWorkflow, DifyExecucaoRow } from './domain';
import { converterParaDifyExecucao } from './domain';

// ---------------------------------------------------------------------------
// DifyRepository
// ---------------------------------------------------------------------------

export class DifyRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Salva uma execução de workflow para auditoria.
   */
  async salvarExecucao(
    execucao: DifyExecucaoWorkflow,
    usuarioId: number
  ): Promise<void> {
    try {
      await this.supabase.from('dify_execucoes').insert({
        workflow_run_id: execucao.workflowRunId,
        workflow_id: execucao.workflowId || null,
        task_id: execucao.taskId || null,
        status: execucao.status,
        inputs: execucao.inputs,
        outputs: execucao.outputs,
        error: execucao.erro,
        total_tokens: execucao.totalTokens,
        elapsed_time: execucao.tempoDecorrido,
        total_steps: execucao.totalPassos,
        usuario_id: usuarioId,
        finished_at: execucao.finalizadoEm
          ? new Date(execucao.finalizadoEm * 1000).toISOString()
          : null,
      });
    } catch (error) {
      console.error('[Dify] Erro ao salvar execução:', error);
    }
  }

  /**
   * Atualiza o status de uma execução.
   */
  async atualizarStatusExecucao(
    workflowRunId: string,
    status: string,
    outputs?: Record<string, unknown>,
    error?: string | null
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { status };
      if (outputs) updateData.outputs = outputs;
      if (error !== undefined) updateData.error = error;
      if (status === 'succeeded' || status === 'failed' || status === 'stopped') {
        updateData.finished_at = new Date().toISOString();
      }

      await this.supabase
        .from('dify_execucoes')
        .update(updateData)
        .eq('workflow_run_id', workflowRunId);
    } catch (error) {
      console.error('[Dify] Erro ao atualizar execução:', error);
    }
  }

  /**
   * Lista execuções de workflow do usuário.
   */
  async listarExecucoes(
    usuarioId: number,
    limite = 20,
    offset = 0
  ): Promise<{ data: DifyExecucaoWorkflow[]; total: number }> {
    try {
      const { data, count, error } = await this.supabase
        .from('dify_execucoes')
        .select('*', { count: 'exact' })
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limite - 1);

      if (error) {
        console.error('[Dify] Erro ao listar execuções:', error);
        return { data: [], total: 0 };
      }

      return {
        data: (data as DifyExecucaoRow[]).map(converterParaDifyExecucao),
        total: count || 0,
      };
    } catch {
      return { data: [], total: 0 };
    }
  }

  /**
   * Salva ou atualiza mapeamento de conversa.
   */
  async salvarConversa(
    conversationId: string,
    appKey: string,
    usuarioId: number,
    nome?: string
  ): Promise<void> {
    try {
      await this.supabase.from('dify_conversas').upsert(
        {
          conversation_id: conversationId,
          app_key: appKey,
          usuario_id: usuarioId,
          nome: nome || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'conversation_id' }
      );
    } catch (error) {
      console.error('[Dify] Erro ao salvar conversa:', error);
    }
  }

  /**
   * Lista conversas persistidas do usuário.
   */
  async listarConversas(
    usuarioId: number,
    limite = 20
  ): Promise<Array<{ conversationId: string; appKey: string; nome: string | null; atualizadoEm: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('dify_conversas')
        .select('conversation_id, app_key, nome, updated_at')
        .eq('usuario_id', usuarioId)
        .order('updated_at', { ascending: false })
        .limit(limite);

      if (error) return [];

      return (data || []).map((row) => ({
        conversationId: row.conversation_id,
        appKey: row.app_key,
        nome: row.nome,
        atualizadoEm: row.updated_at,
      }));
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createDifyRepository(): Promise<DifyRepository> {
  const supabase = await createClient();
  return new DifyRepository(supabase);
}
