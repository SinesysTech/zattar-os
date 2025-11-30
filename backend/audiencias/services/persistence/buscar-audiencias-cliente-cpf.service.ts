/**
 * Serviço de persistência para buscar audiências de cliente por CPF
 * Faz JOIN entre audiencias, processo_partes e clientes
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { AudienciaClienteCpfRow } from '@/backend/types/audiencias/audiencias-cliente-cpf.types';

/**
 * Resultado da busca de audiências por CPF
 */
export interface BuscarAudienciasPorCpfResult {
  cliente: {
    id: number;
    nome: string;
    cpf: string;
  } | null;
  audiencias: AudienciaClienteCpfRow[];
}

/**
 * Busca todas as audiências de um cliente pelo CPF
 *
 * @param cpf - CPF do cliente (com ou sem formatação)
 * @returns Dados do cliente e lista de audiências
 */
export async function buscarAudienciasPorCpf(
  cpf: string
): Promise<BuscarAudienciasPorCpfResult> {
  const supabase = createServiceClient();

  // Normalizar CPF (remover formatação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  console.log('🔍 [BuscarAudienciasCPF] Buscando audiências para CPF:', cpfNormalizado);

  // Buscar cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('cpf', cpfNormalizado)
    .eq('ativo', true)
    .single();

  if (errorCliente || !cliente) {
    console.log('ℹ️ [BuscarAudienciasCPF] Cliente não encontrado:', cpfNormalizado);
    return { cliente: null, audiencias: [] };
  }

  // Buscar processo_partes do cliente
  const { data: participacoes, error: errorPart } = await supabase
    .from('processo_partes')
    .select('processo_id, tipo_parte, polo')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', cliente.id);

  if (errorPart || !participacoes || participacoes.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma participação encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Buscar audiências dos processos
  const processoIds = participacoes.map(p => p.processo_id);

  const { data: audienciasData, error: errorAudiencias } = await supabase
    .from('audiencias')
    .select(`
      id,
      id_pje,
      numero_processo,
      trt,
      grau,
      data_inicio,
      data_fim,
      hora_inicio,
      hora_fim,
      status,
      status_descricao,
      modalidade,
      url_audiencia_virtual,
      endereco_presencial,
      presenca_hibrida,
      polo_ativo_nome,
      polo_passivo_nome,
      segredo_justica,
      observacoes,
      sala_audiencia_nome,
      processo_id,
      tipo_audiencia:tipo_audiencia_id(descricao),
      orgao_julgador:orgao_julgador_id(descricao),
      classe_judicial:classe_judicial_id(descricao)
    `)
    .in('processo_id', processoIds)
    .order('data_inicio', { ascending: true });

  if (errorAudiencias) {
    console.error('❌ [BuscarAudienciasCPF] Erro ao buscar audiências:', errorAudiencias);
    throw new Error(`Erro ao buscar audiências: ${errorAudiencias.message}`);
  }

  if (!audienciasData || audienciasData.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma audiência encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Mapear para formato esperado
  const audiencias: AudienciaClienteCpfRow[] = audienciasData.map(aud => {
    const participacao = participacoes.find(p => p.processo_id === aud.processo_id);

    return {
      audiencia_id: aud.id,
      id_pje: aud.id_pje,
      numero_processo: aud.numero_processo,
      trt: aud.trt,
      grau: aud.grau as 'primeiro_grau' | 'segundo_grau',
      data_inicio: aud.data_inicio,
      data_fim: aud.data_fim,
      hora_inicio: aud.hora_inicio,
      hora_fim: aud.hora_fim,
      status: aud.status,
      status_descricao: aud.status_descricao,
      modalidade: aud.modalidade as 'virtual' | 'presencial' | 'hibrida' | null,
      url_audiencia_virtual: aud.url_audiencia_virtual,
      endereco_presencial: aud.endereco_presencial as Record<string, unknown> | null,
      presenca_hibrida: aud.presenca_hibrida as 'advogado' | 'cliente' | null,
      polo_ativo_nome: aud.polo_ativo_nome,
      polo_passivo_nome: aud.polo_passivo_nome,
      segredo_justica: aud.segredo_justica,
      observacoes: aud.observacoes,
      tipo_audiencia_descricao: (aud.tipo_audiencia as unknown as { descricao: string } | null)?.descricao || null,
      orgao_julgador_descricao: (aud.orgao_julgador as unknown as { descricao: string } | null)?.descricao || null,
      sala_audiencia_nome: aud.sala_audiencia_nome,
      classe_judicial_descricao: (aud.classe_judicial as unknown as { descricao: string } | null)?.descricao || null,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      cpf: cliente.cpf,
      tipo_parte: participacao?.tipo_parte || 'OUTRO',
      polo: participacao?.polo || 'NEUTRO',
    };
  });

  console.log(`✅ [BuscarAudienciasCPF] Encontradas ${audiencias.length} audiências para ${cliente.nome}`);

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
    },
    audiencias,
  };
}
