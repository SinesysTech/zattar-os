import { createClient } from '@/lib/supabase/server';
import { DifyConversation, DifyWorkflowExecution, StatusExecucaoDify } from './domain';
import { Result, err, ok } from 'neverthrow';

export class DifyRepository {
  async salvarExecucaoWorkflow(data: Partial<DifyWorkflowExecution>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase.from('dify_execucoes').insert(data);
      if (error) throw error;
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(`Erro ao salvar execução de workflow: ${error.message}`));
    }
  }

  async atualizarExecucaoWorkflow(workflowRunId: string, data: Partial<DifyWorkflowExecution>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_execucoes')
        .update(data)
        .eq('workflow_run_id', workflowRunId);
      if (error) throw error;
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(`Erro ao atualizar execução de workflow: ${error.message}`));
    }
  }

  async salvarConversa(data: Partial<DifyConversation> & { usuario_id: string; app_key: string; conversation_id: string }): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      // Upsert para salvar ou atualizar se já existir
      const { error } = await supabase.from('dify_conversas').upsert(data, { onConflict: 'conversation_id' });
      if (error) throw error;
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(`Erro ao salvar conversa Dify: ${error.message}`));
    }
  }

  async listarConversasUsuario(usuarioId: string): Promise<Result<DifyConversation[], Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_conversas')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return ok(data as unknown as DifyConversation[]);
    } catch (error: any) {
      return err(new Error(`Erro ao listar conversas do usuário: ${error.message}`));
    }
  }
}

export const difyRepository = new DifyRepository();
