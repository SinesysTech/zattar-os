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

  async listDifyApps(): Promise<Result<any[], Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ok(data || []);
    } catch (error: any) {
      return err(new Error(`Erro ao listar apps Dify: ${error.message}`));
    }
  }

  async getDifyApp(id: string): Promise<Result<any | null, Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_apps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return ok(data);
    } catch (error: any) {
      return err(new Error(`Erro ao buscar app Dify: ${error.message}`));
    }
  }

  async getActiveDifyApp(type?: string): Promise<Result<any | null, Error>> {
    const supabase = await createClient();
    try {
      let query = supabase
        .from('dify_apps')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('app_type', type);
      }

      // Pega o primeiro ativo encontrado
      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;
      return ok(data);
    } catch (error: any) {
      return err(new Error(`Erro ao buscar app Dify ativo: ${error.message}`));
    }
  }

  async createDifyApp(data: { name: string; api_url: string; api_key: string; app_type: string; is_active?: boolean }): Promise<Result<any, Error>> {
    const supabase = await createClient();
    try {
      const { data: newApp, error } = await supabase
        .from('dify_apps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return ok(newApp);
    } catch (error: any) {
      return err(new Error(`Erro ao criar app Dify: ${error.message}`));
    }
  }

  async updateDifyApp(id: string, data: Partial<{ name: string; api_url: string; api_key: string; app_type: string; is_active: boolean }>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_apps')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(`Erro ao atualizar app Dify: ${error.message}`));
    }
  }

  async deleteDifyApp(id: string): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_apps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(`Erro ao deletar app Dify: ${error.message}`));
    }
  }
}

export const difyRepository = new DifyRepository();
