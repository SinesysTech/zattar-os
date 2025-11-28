// Serviço para criar nova audiência manualmente

import { createClient } from '@/backend/utils/supabase/server-client';
import type { CriarAudienciaParams } from '@/backend/types/audiencias/types';

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

  // 2. Validar tipo de audiência se fornecido
  if (params.tipo_audiencia_id) {
    const { error: tipoError } = await supabase
      .from('tipo_audiencia')
      .select('id')
      .eq('id', params.tipo_audiencia_id)
      .single();

    if (tipoError) {
      throw new Error('Tipo de audiência não encontrado');
    }
  }

  // 3. Buscar dados da sala de audiência (se fornecido)
  let salaData = null;
  if (params.sala_audiencia_id) {
    const { data: sala, error: salaError } = await supabase
      .from('sala_audiencia')
      .select('id_pje, nome')
      .eq('id', params.sala_audiencia_id)
      .single();

    if (salaError || !sala) {
      throw new Error('Sala de audiência não encontrada');
    }
    salaData = sala;
  }

  // 4. Preparar dados da audiência
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

    // Tipo de audiência (normalizado - dados vêm via JOIN)
    tipo_audiencia_id: params.tipo_audiencia_id || null,
    // modalidade é calculada automaticamente pelo trigger baseado em url_audiencia_virtual, tipo_audiencia e endereco_presencial

    // Dados da sala de audiência (normalizados e desnormalizados)
    sala_audiencia_id: params.sala_audiencia_id || null,
    sala_audiencia_nome: salaData?.nome || null,

    // URL ou endereço conforme tipo
    url_audiencia_virtual: params.url_audiencia_virtual || null,
    endereco_presencial: params.endereco_presencial || null,

    // Campos opcionais
    observacoes: params.observacoes || null,
    responsavel_id: params.responsavel_id || null,
  };

  // 5. Inserir audiência
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
