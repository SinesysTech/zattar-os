import { createServiceClient } from '@/lib/supabase/service-client';

export interface AtividadeLog {
  id: number;
  tipoEntidade: string;
  entidadeId: number;
  tipoEvento: string;
  usuarioQueExecutouId: number;
  responsavelAnteriorId: number | null;
  responsavelNovoId: number | null;
  dadosEvento: Record<string, unknown> | null;
  createdAt: string;
  nomeResponsavelAnterior: string | null;
  nomeResponsavelNovo: string | null;
}

/**
 * Busca atividades de negócio do usuário a partir da tabela logs_alteracao.
 * Faz LEFT JOIN com usuarios para resolver nomes dos responsáveis.
 */
export async function buscarAtividadesUsuario(
  usuarioId: number,
  limite: number = 20,
  offset: number = 0
): Promise<AtividadeLog[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('buscar_atividades_usuario', {
      p_usuario_id: usuarioId,
      p_limite: limite,
      p_offset: offset,
    });

    if (error) {
      // Fallback: se a RPC não existir, usar query direta
      if (error.code === '42883' || error.message?.includes('function')) {
        return buscarAtividadesUsuarioFallback(usuarioId, limite, offset);
      }
      console.error('Erro ao buscar atividades do usuário:', error);
      return [];
    }

    if (!data) return [];

    return (data as Array<Record<string, unknown>>).map(mapearAtividade);
  } catch (error) {
    console.error('Erro ao buscar atividades do usuário:', error);
    return [];
  }
}

/**
 * Fallback usando query direta quando a RPC não está disponível.
 * Busca logs_alteracao e faz joins manuais com usuarios.
 */
async function buscarAtividadesUsuarioFallback(
  usuarioId: number,
  limite: number,
  offset: number
): Promise<AtividadeLog[]> {
  const supabase = createServiceClient();

  try {
    const { data: logs, error } = await supabase
      .from('logs_alteracao')
      .select('id, tipo_entidade, entidade_id, tipo_evento, usuario_que_executou_id, responsavel_anterior_id, responsavel_novo_id, dados_evento, created_at')
      .eq('usuario_que_executou_id', usuarioId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1);

    if (error) {
      console.error('Erro ao buscar atividades (fallback):', error);
      return [];
    }

    if (!logs || logs.length === 0) return [];

    // Coletar IDs únicos de responsáveis para resolver nomes
    const responsavelIds = new Set<number>();
    for (const log of logs) {
      if (log.responsavel_anterior_id) responsavelIds.add(log.responsavel_anterior_id);
      if (log.responsavel_novo_id) responsavelIds.add(log.responsavel_novo_id);
    }

    // Buscar nomes dos responsáveis
    let nomesMap = new Map<number, string>();
    if (responsavelIds.size > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome_exibicao')
        .in('id', Array.from(responsavelIds));

      if (usuarios) {
        nomesMap = new Map(usuarios.map((u) => [u.id, u.nome_exibicao]));
      }
    }

    return logs.map((log) => ({
      id: log.id,
      tipoEntidade: log.tipo_entidade,
      entidadeId: log.entidade_id,
      tipoEvento: log.tipo_evento,
      usuarioQueExecutouId: log.usuario_que_executou_id,
      responsavelAnteriorId: log.responsavel_anterior_id,
      responsavelNovoId: log.responsavel_novo_id,
      dadosEvento: log.dados_evento as Record<string, unknown> | null,
      createdAt: log.created_at,
      nomeResponsavelAnterior: log.responsavel_anterior_id
        ? nomesMap.get(log.responsavel_anterior_id) ?? null
        : null,
      nomeResponsavelNovo: log.responsavel_novo_id
        ? nomesMap.get(log.responsavel_novo_id) ?? null
        : null,
    }));
  } catch (error) {
    console.error('Erro ao buscar atividades (fallback):', error);
    return [];
  }
}

/**
 * Conta total de atividades do usuário para suporte ao "Carregar mais".
 */
export async function contarAtividadesUsuario(
  usuarioId: number
): Promise<number> {
  const supabase = createServiceClient();

  try {
    const { count, error } = await supabase
      .from('logs_alteracao')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_que_executou_id', usuarioId);

    if (error) {
      console.error('Erro ao contar atividades do usuário:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Erro ao contar atividades do usuário:', error);
    return 0;
  }
}

/**
 * Mapeia o resultado da RPC para a interface AtividadeLog
 */
function mapearAtividade(row: Record<string, unknown>): AtividadeLog {
  return {
    id: row.id as number,
    tipoEntidade: row.tipo_entidade as string,
    entidadeId: row.entidade_id as number,
    tipoEvento: row.tipo_evento as string,
    usuarioQueExecutouId: row.usuario_que_executou_id as number,
    responsavelAnteriorId: (row.responsavel_anterior_id as number) ?? null,
    responsavelNovoId: (row.responsavel_novo_id as number) ?? null,
    dadosEvento: (row.dados_evento as Record<string, unknown>) ?? null,
    createdAt: row.created_at as string,
    nomeResponsavelAnterior: (row.nome_responsavel_anterior as string) ?? null,
    nomeResponsavelNovo: (row.nome_responsavel_novo as string) ?? null,
  };
}
