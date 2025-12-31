import { createServiceClient } from '@/lib/supabase/service-client';

export interface AuthLogEntry {
  timestamp: string;
  eventType: 'user_signedin' | 'user_signedout' | 'token_refreshed' | 'other';
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Busca logs de autenticação do usuário a partir da tabela auth.audit_log_entries
 */
export async function buscarAuthLogsPorUsuario(
  authUserId: string,
  limite: number = 50
): Promise<AuthLogEntry[]> {
  const supabase = createServiceClient();

  try {
    // Query na tabela de audit logs do Supabase Auth (schema auth)
    // Seleciona colunas corretas: created_at, action, ip_address, user_agent
    const { data, error } = await supabase
      .schema('auth')
      .from('audit_log_entries')
      .select('created_at, action, ip_address, user_agent')
      .eq('user_id', authUserId)
      .in('action', ['user_signedin', 'user_signedout', 'token_refreshed'])
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('Erro ao buscar logs de autenticação:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Mapear dados para o formato esperado
    // Campos vêm diretamente da tabela: action, ip_address, user_agent
    return data.map((entry) => ({
      timestamp: entry.created_at,
      eventType: parseEventType(entry.action),
      ipAddress: entry.ip_address || null,
      userAgent: entry.user_agent || null,
    }));
  } catch (error) {
    console.error('Erro ao buscar logs de autenticação:', error);
    return [];
  }
}

/**
 * Parse do tipo de evento
 */
function parseEventType(action: string | undefined): AuthLogEntry['eventType'] {
  switch (action) {
    case 'user_signedin':
      return 'user_signedin';
    case 'user_signedout':
      return 'user_signedout';
    case 'token_refreshed':
      return 'token_refreshed';
    default:
      return 'other';
  }
}
