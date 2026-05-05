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

interface UltimoLoginRow {
  user_id: string;
  last_sign_in_at: string | null;
}

/**
 * Busca o `last_sign_in_at` de auth.users para um conjunto de auth_user_ids.
 * Retorna um Map<auth_user_id, ISO timestamp | null>. Resolução em uma única
 * chamada RPC (sem N+1).
 */
export async function buscarUltimosLoginsPorAuthUsers(
  authUserIds: string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  if (authUserIds.length === 0) {
    return result;
  }

  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('get_users_last_sign_in', {
      p_auth_user_ids: authUserIds,
    });

    if (error) {
      console.error('Erro ao buscar últimos logins:', error);
      return result;
    }

    if (!data) {
      return result;
    }

    for (const row of data as UltimoLoginRow[]) {
      result.set(row.user_id, row.last_sign_in_at ?? null);
    }
  } catch (error) {
    console.error('Erro ao buscar últimos logins:', error);
  }

  return result;
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
