import { createServiceClient } from '@/lib/supabase/service-client';

interface AuthSessionRow {
  created_at: string;
  event_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuthLogEntry {
  timestamp: string;
  eventType: 'user_signedin' | 'user_signedout' | 'token_refreshed' | 'other';
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Busca sessões de autenticação do usuário via RPC SQL (SECURITY DEFINER).
 * Cada sessão representa um login realizado.
 */
export async function buscarAuthLogsPorUsuario(
  authUserId: string,
  limite: number = 50
): Promise<AuthLogEntry[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('get_user_auth_sessions', {
      p_user_id: authUserId,
      p_limit: limite,
    });

    if (error) {
      console.error('Erro ao buscar sessões de autenticação:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((session: AuthSessionRow) => ({
      timestamp: session.created_at,
      eventType: parseEventType(session.event_type),
      ipAddress: session.ip_address || null,
      userAgent: session.user_agent || null,
    }));
  } catch (error) {
    console.error('Erro ao buscar sessões de autenticação:', error);
    return [];
  }
}

/**
 * Parse do tipo de evento
 */
function parseEventType(eventType: string | null | undefined): AuthLogEntry['eventType'] {
  switch (eventType) {
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
