// Serviço para criar nova audiência manualmente

import { createClient } from '@/lib/server';

/**
 * Parâmetros para criar uma nova audiência
 */
export interface CriarAudienciaParams {
  processo_id: number;
  advogado_id: number;
  data_inicio: string; // ISO timestamp
  data_fim: string; // ISO timestamp
  tipo_descricao?: string;
  tipo_is_virtual?: boolean;
  sala_audiencia_nome?: string;
  url_audiencia_virtual?: string;
  observacoes?: string;
  responsavel_id?: number;
}

/**
 * Cria uma nova audiência manualmente
 */
export async function criarAudiencia(params: CriarAudienciaParams): Promise<number> {
  const supabase = await createClient();

  // 1. Buscar dados do processo para preencher campos obrigatórios
  const { data: processo, error: processoError } = await supabase
    .from('acervo')
    .select('numero_processo, trt, grau, polo_ativo_nome, polo_passivo_nome, orgao_julgador_id')
    .eq('id', params.processo_id)
    .single();

  if (processoError || !processo) {
    throw new Error('Processo não encontrado');
  }

  // 2. Preparar dados da audiência
  const audienciaData = {
    // IDs e relações
    id_pje: 0, // Audiências manuais terão id_pje = 0
    advogado_id: params.advogado_id,
    processo_id: params.processo_id,
    orgao_julgador_id: processo.orgao_julgador_id,

    // Dados do processo
    trt: processo.trt,
    grau: processo.grau,
    numero_processo: processo.numero_processo,
    polo_ativo_nome: processo.polo_ativo_nome,
    polo_passivo_nome: processo.polo_passivo_nome,

    // Dados da audiência
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    status: 'M', // M = Marcada (padrão para audiências manuais)
    status_descricao: 'Marcada',
    designada: true,
    em_andamento: false,
    documento_ativo: false,

    // Tipo e local
    tipo_descricao: params.tipo_descricao || 'Audiência Manual',
    tipo_is_virtual: params.tipo_is_virtual ?? false,
    sala_audiencia_nome: params.sala_audiencia_nome || null,

    // Campos opcionais
    url_audiencia_virtual: params.url_audiencia_virtual || null,
    observacoes: params.observacoes || null,
    responsavel_id: params.responsavel_id || null,
  };

  // 3. Inserir audiência
  const { data: audiencia, error: insertError } = await supabase
    .from('audiencias')
    .insert(audienciaData)
    .select('id')
    .single();

  if (insertError) {
    console.error('Erro ao criar audiência:', insertError);
    throw new Error(`Erro ao criar audiência: ${insertError.message}`);
  }

  if (!audiencia) {
    throw new Error('Erro ao criar audiência: nenhum ID retornado');
  }

  return audiencia.id;
}
