/**
 * Serviço de persistência para buscar processos de cliente por CPF
 * Acessa a VIEW materializada processos_cliente_por_cpf
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ProcessoClienteCpfRow } from '@/backend/types/acervo/processos-cliente-cpf.types';

/**
 * Resultado da busca de processos por CPF
 */
export interface BuscarProcessosPorCpfResult {
  cliente: {
    id: number;
    nome: string;
    cpf: string;
  } | null;
  processos: ProcessoClienteCpfRow[];
}

/**
 * Busca todos os processos de um cliente pelo CPF
 *
 * IMPORTANTE: Usa JOIN direto em vez de VIEW materializada para garantir
 * dados em tempo real. Isso é necessário porque o campo `timeline_mongodb_id`
 * é atualizado após a captura da timeline, e a VIEW materializada não reflete
 * essas mudanças até ser feito um REFRESH manual.
 *
 * @param cpf - CPF do cliente (com ou sem formatação)
 * @returns Dados do cliente e lista de processos
 */
export async function buscarProcessosPorCpf(
  cpf: string
): Promise<BuscarProcessosPorCpfResult> {
  // Normalizar CPF (remover formatação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  console.log('🔍 [BuscarProcessosCPF] Buscando processos para CPF (JOIN direto):', cpfNormalizado);

  // Sempre usar JOIN direto para ter dados em tempo real
  // A VIEW materializada não reflete mudanças em timeline_mongodb_id até REFRESH
  return buscarProcessosPorCpfManual(cpfNormalizado);
}

/**
 * Busca processos por CPF fazendo JOIN manual (fallback se VIEW não existir)
 */
async function buscarProcessosPorCpfManual(
  cpf: string
): Promise<BuscarProcessosPorCpfResult> {
  const supabase = createServiceClient();

  // Buscar cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('cpf', cpf)
    .eq('ativo', true)
    .single();

  if (errorCliente || !cliente) {
    console.log('ℹ️ [BuscarProcessosCPF] Cliente não encontrado:', cpf);
    return { cliente: null, processos: [] };
  }

  // Buscar processo_partes do cliente
  const { data: participacoes, error: errorPart } = await supabase
    .from('processo_partes')
    .select('processo_id, tipo_parte, polo, principal')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', cliente.id);

  if (errorPart || !participacoes || participacoes.length === 0) {
    console.log('ℹ️ [BuscarProcessosCPF] Nenhuma participação encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      processos: [],
    };
  }

  // Buscar processos
  const processoIds = participacoes.map(p => p.processo_id);

  const { data: acervoData, error: errorAcervo } = await supabase
    .from('acervo')
    .select(`
      id,
      id_pje,
      advogado_id,
      numero_processo,
      trt,
      grau,
      classe_judicial,
      nome_parte_autora,
      nome_parte_re,
      descricao_orgao_julgador,
      codigo_status_processo,
      origem,
      data_autuacao,
      data_arquivamento,
      data_proxima_audiencia,
      segredo_justica,
      timeline_mongodb_id
    `)
    .in('id', processoIds);

  if (errorAcervo || !acervoData) {
    console.error('❌ [BuscarProcessosCPF] Erro ao buscar acervo:', errorAcervo);
    throw new Error(`Erro ao buscar processos: ${errorAcervo?.message}`);
  }

  // Mapear para formato da VIEW
  const processos: ProcessoClienteCpfRow[] = acervoData.map(processo => {
    const participacao = participacoes.find(p => p.processo_id === processo.id);

    return {
      cpf: cliente.cpf,
      cliente_nome: cliente.nome,
      cliente_id: cliente.id,
      tipo_parte: participacao?.tipo_parte || 'OUTRO',
      polo: participacao?.polo || 'NEUTRO',
      parte_principal: participacao?.principal || false,
      processo_id: processo.id,
      id_pje: processo.id_pje,
      advogado_id: processo.advogado_id,
      numero_processo: processo.numero_processo,
      trt: processo.trt,
      grau: processo.grau as 'primeiro_grau' | 'segundo_grau',
      classe_judicial: processo.classe_judicial,
      nome_parte_autora: processo.nome_parte_autora,
      nome_parte_re: processo.nome_parte_re,
      descricao_orgao_julgador: processo.descricao_orgao_julgador,
      codigo_status_processo: processo.codigo_status_processo,
      origem: processo.origem as 'acervo_geral' | 'arquivado',
      data_autuacao: processo.data_autuacao,
      data_arquivamento: processo.data_arquivamento,
      data_proxima_audiencia: processo.data_proxima_audiencia,
      segredo_justica: processo.segredo_justica,
      timeline_mongodb_id: processo.timeline_mongodb_id,
    };
  });

  console.log(`✅ [BuscarProcessosCPF] Encontrados ${processos.length} processos via JOIN manual`);

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
    },
    processos,
  };
}

/**
 * Atualiza a VIEW materializada (refresh)
 */
export async function refreshViewProcessosClienteCpf(): Promise<void> {
  const supabase = createServiceClient();

  console.log('🔄 [BuscarProcessosCPF] Atualizando VIEW materializada...');

  const { error } = await supabase.rpc('refresh_processos_cliente_por_cpf');

  if (error) {
    console.error('❌ [BuscarProcessosCPF] Erro ao atualizar VIEW:', error);
    throw new Error(`Erro ao atualizar VIEW: ${error.message}`);
  }

  console.log('✅ [BuscarProcessosCPF] VIEW atualizada com sucesso');
}
