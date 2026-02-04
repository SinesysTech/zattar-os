import { createClient } from '@/lib/supabase/client';

export interface LogAlteracao {
  id: number;
  tipo_entidade: string;
  entidade_id: number;
  tipo_evento: string;
  usuario_que_executou_id: number;
  responsavel_anterior_id?: number;
  responsavel_novo_id?: number;
  dados_evento: Record<string, unknown>;
  created_at: string;
  usuario?: {
    nome: string;
    email: string;
  };
  responsavel_anterior?: {
    nome: string;
  };
  responsavel_novo?: {
    nome: string;
  };
}

export class AuditLogService {
  private supabase = createClient();

  async getLogs(entityType: string, entityId: number): Promise<LogAlteracao[]> {
    const { data, error } = await this.supabase
      .from('logs_alteracao')
      .select(`
        *,
        usuario:usuario_que_executou_id(nome, email),
        responsavel_anterior:responsavel_anterior_id(nome),
        responsavel_novo:responsavel_novo_id(nome)
      `)
      .eq('tipo_entidade', entityType)
      .eq('entidade_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }

    return data as LogAlteracao[];
  }
}

export const auditLogService = new AuditLogService();
