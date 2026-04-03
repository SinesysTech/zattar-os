import { createServiceClient } from '@/lib/supabase/service-client';

export interface AtividadeEstatisticas {
  processos: number;
  audiencias: number;
  pendentes: number;
  contratos: number;
}

/**
 * Busca estatísticas de atividades atribuídas ao usuário
 */
export async function buscarEstatisticasAtividades(
  usuarioId: number
): Promise<AtividadeEstatisticas> {
  const supabase = createServiceClient();

  try {
    // Buscar contagens em paralelo
    // Processos usa RPC count_processos_unicos para contar por numero_processo distinto
    const [processosRes, audienciasRes, pendentesRes, contratosRes] = await Promise.all([
      supabase.rpc('count_processos_unicos', {
        p_responsavel_id: usuarioId,
        p_origem: null,
        p_data_inicio: null,
        p_data_fim: null,
      }),
      supabase
        .from('audiencias')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', usuarioId),
      supabase
        .from('expedientes')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', usuarioId),
      supabase
        .from('contratos')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', usuarioId),
    ]);

    return {
      processos: (processosRes.data as number) ?? 0,
      audiencias: audienciasRes.count ?? 0,
      pendentes: pendentesRes.count ?? 0,
      contratos: contratosRes.count ?? 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de atividades:', error);
    return {
      processos: 0,
      audiencias: 0,
      pendentes: 0,
      contratos: 0,
    };
  }
}

/**
 * Busca processos atribuídos ao usuário
 */
export async function buscarProcessosAtribuidos(
  usuarioId: number,
  limite: number = 10
) {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('acervo')
      .select('id, numero_processo, nome_parte_autora, nome_parte_re, codigo_status_processo, created_at')
      .eq('responsavel_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos atribuídos:', error);
    return [];
  }
}

/**
 * Busca audiências atribuídas ao usuário
 */
export async function buscarAudienciasAtribuidas(
  usuarioId: number,
  limite: number = 10
) {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('audiencias')
      .select('id, tipo_audiencia_id, data_inicio, data_fim, sala_audiencia_nome, processo_id, created_at')
      .eq('responsavel_id', usuarioId)
      .order('data_inicio', { ascending: false })
      .limit(limite);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar audiências atribuídas:', error);
    return [];
  }
}

/**
 * Busca pendentes atribuídos ao usuário
 */
export async function buscarPendentesAtribuidos(
  usuarioId: number,
  limite: number = 10
) {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('expedientes')
      .select('id, numero, descricao_arquivos, data_prazo_legal_parte, baixado_em, created_at')
      .eq('responsavel_id', usuarioId)
      .order('data_prazo_legal_parte', { ascending: true })
      .limit(limite);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pendentes atribuídos:', error);
    return [];
  }
}

/**
 * Busca contratos atribuídos ao usuário
 */
export async function buscarContratosAtribuidos(
  usuarioId: number,
  limite: number = 10
) {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('id, cliente_id, tipo_contrato, tipo_cobranca, status, created_at')
      .eq('responsavel_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contratos atribuídos:', error);
    return [];
  }
}
