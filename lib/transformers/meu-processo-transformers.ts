/**
 * Transformadores de dados do Sinesys para formato legado (N8N)
 * 
 * Converte as respostas da API Sinesys para o formato esperado
 * pelo app "Meu Processo" (compatibilidade retroativa).
 */

import {
  SinesysProcesso,
  SinesysAudiencia,
  SinesysContrato,
  SinesysAcordo,
  SinesysInstancia,
  SinesysTimelineItem,
  LegacyProcessoItem,
  LegacyAudiencia,
  LegacyContrato,
  LegacyPagamento,
  LegacyInstancia,
  LegacyMovimento,
  LegacyConsultaCPFResponse,
  SinesysProcessoResponse,
  SinesysAudienciasResponse,
  SinesysContratosResponse,
  SinesysAcordosResponse,
} from '@/lib/types/meu-processo-types';

// =============================================================================
// TRANSFORMADORES DE PROCESSOS
// =============================================================================

/**
 * Extrai o estado da jurisdição a partir do nome do tribunal
 */
function extrairEstado(tribunal: string): string {
  const match = tribunal.match(/\((.*?)\)/);
  if (match && match[1]) {
    // Remove números e mantém apenas as letras (sigla do estado)
    return match[1].replace(/\d+ª\s*Região\s*/, '').trim();
  }
  return '';
}

/**
 * Extrai o município a partir do nome da vara
 */
function extrairMunicipio(vara?: string): string {
  if (!vara) return '';
  
  // Padrões comuns: "1ª Vara do Trabalho de Belo Horizonte"
  const match = vara.match(/de\s+(.+?)$/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return '';
}

/**
 * Transforma timeline do Sinesys em movimentos legados
 */
function transformTimelineParaMovimentos(
  timeline: SinesysTimelineItem[]
): LegacyMovimento[] {
  return timeline.map((item) => ({
    dataMovimento: item.data,
    tipoMovimento: item.evento,
    complemento: item.descricao || undefined,
  }));
}

/**
 * Transforma instância do Sinesys para formato legado
 */
function transformInstancia(
  instancia: SinesysInstancia | null
): LegacyInstancia | null {
  if (!instancia) return null;

  return {
    dataAjuizamento: instancia.data_inicio,
    movimentos: [], // Timeline não é agrupada por instância no Sinesys
  };
}

/**
 * Transforma um processo do Sinesys para formato legado
 */
export function transformProcessoSinesysParaLegacy(
  processo: SinesysProcesso
): LegacyProcessoItem {
  // Se processo está com sigilo ou indisponível
  if (processo.sigilo) {
    return {
      result: 'Processo sob sigilo',
    };
  }

  if (processo.timeline_status === 'indisponivel') {
    return {
      result: 'Timeline do processo não disponível no momento',
    };
  }

  const parteAutora = processo.partes?.polo_ativo || 
    (processo.papel_cliente === 'Reclamante' || processo.papel_cliente === 'Autor' 
      ? processo.partes?.polo_ativo || '' 
      : processo.parte_contraria);

  const parteRe = processo.partes?.polo_passivo || 
    (processo.papel_cliente === 'Reclamado' || processo.papel_cliente === 'Réu'
      ? processo.partes?.polo_passivo || ''
      : processo.parte_contraria);

  return {
    processo: {
      parteAutora: parteAutora || '',
      parteRe: parteRe || '',
      tribunal: processo.tribunal,
      numero: processo.numero,
      valorDaCausa: processo.valor_causa || '',
      jurisdicaoEstado: extrairEstado(processo.tribunal),
      jurisdicaoMunicipio: extrairMunicipio(processo.vara),
      instancias: {
        primeirograu: transformInstancia(processo.instancias.primeiro_grau),
        segundograu: transformInstancia(processo.instancias.segundo_grau),
        terceirograu: null,
      },
    },
  };
}

/**
 * Transforma lista de processos do Sinesys para formato legado
 */
export function transformProcessosSinesysParaLegacy(
  response: SinesysProcessoResponse
): LegacyProcessoItem[] {
  if (!response.success || !response.data.processos) {
    return [];
  }

  return response.data.processos.map(transformProcessoSinesysParaLegacy);
}

// =============================================================================
// TRANSFORMADORES DE AUDIÊNCIAS
// =============================================================================

/**
 * Transforma uma audiência do Sinesys para formato legado
 */
export function transformAudienciaSinesysParaLegacy(
  audiencia: SinesysAudiencia,
  clienteNome: string
): LegacyAudiencia {
  // Combinar data e horário
  const dataHora = `${audiencia.data} ${audiencia.horario.split(' - ')[0]}`;

  // Determinar local/link
  let localLink: string | null = null;
  if (audiencia.local.tipo === 'virtual' && audiencia.local.url_virtual) {
    localLink = audiencia.local.url_virtual;
  }

  return {
    data_hora: dataHora,
    polo_ativo: audiencia.partes.polo_ativo,
    polo_passivo: audiencia.partes.polo_passivo,
    numero_processo: audiencia.numero_processo,
    modalidade: audiencia.modalidade,
    local_link: localLink,
    status: audiencia.status,
    orgao_julgador: audiencia.vara || audiencia.tribunal,
    tipo: audiencia.tipo,
    sala: audiencia.local.sala || '',
    advogado: audiencia.advogado || '',
    detalhes: audiencia.observacoes || null,
    cliente_nome: clienteNome,
  };
}

/**
 * Transforma lista de audiências do Sinesys para formato legado
 */
export function transformAudienciasSinesysParaLegacy(
  response: SinesysAudienciasResponse
): LegacyAudiencia[] {
  if (!response.success || !response.data.audiencias) {
    return [];
  }

  const clienteNome = response.data.cliente.nome;

  return response.data.audiencias.map((audiencia) =>
    transformAudienciaSinesysParaLegacy(audiencia, clienteNome)
  );
}

// =============================================================================
// TRANSFORMADORES DE CONTRATOS
// =============================================================================

/**
 * Transforma um contrato do Sinesys para formato legado
 */
export function transformContratoSinesysParaLegacy(
  contrato: SinesysContrato
): LegacyContrato {
  return {
    cliente_nome: contrato.cliente_nome,
    cliente_cpf: contrato.cliente_cpf || '',
    parte_contraria: contrato.parte_contraria || '',
    processo_tipo_nome: contrato.processo_tipo_nome || '',
    data_admissao: contrato.data_admissao || '',
    data_rescisao: contrato.data_rescisao || '',
    data_assinou_contrato: contrato.data_assinou_contrato || '',
    estagio: contrato.estagio || contrato.status,
    data_estagio: contrato.data_estagio || '',
    numero_processo: contrato.processo_numero || '',
  };
}

/**
 * Transforma lista de contratos do Sinesys para formato legado
 */
export function transformContratosSinesysParaLegacy(
  response: SinesysContratosResponse
): LegacyContrato[] | string {
  if (!response.success) {
    return 'Contratos não disponíveis no momento';
  }

  if (!response.data.contratos || response.data.contratos.length === 0) {
    return 'Nenhum contrato encontrado';
  }

  return response.data.contratos.map(transformContratoSinesysParaLegacy);
}

// =============================================================================
// TRANSFORMADORES DE ACORDOS/CONDENAÇÕES
// =============================================================================

/**
 * Formata valor para string com 2 casas decimais
 */
function formatarValor(valor: number): string {
  return valor.toFixed(2);
}

/**
 * Transforma um acordo do Sinesys em múltiplas parcelas legadas
 * (N8N retorna uma linha por parcela)
 */
export function transformAcordoSinesysParaLegacy(
  acordo: SinesysAcordo
): LegacyPagamento[] {
  const parteAutora = acordo.parte_autora || '';
  const parteContraria = acordo.parte_contraria || '';
  const numeroProcesso = acordo.numero_processo || '';
  const dataHomologacao = acordo.data_homologacao || '';
  const tipoPagamento = acordo.tipo === 'acordo' ? 'Acordo' : 'Condenação';
  const formaPagamento = acordo.forma_pagamento || '';
  const modalidadePagamento = acordo.modalidade_pagamento || '';
  const valorBruto = formatarValor(acordo.valor_bruto || acordo.valor_total);
  const valorLiquido = formatarValor(acordo.valor_liquido || acordo.valor_total);

  // Criar uma linha para cada parcela
  return acordo.parcelas.map((parcela) => ({
    numero_processo: numeroProcesso,
    parte_autora: parteAutora,
    parte_contraria: parteContraria,
    data_homologacao: dataHomologacao,
    tipo_pagamento: tipoPagamento,
    forma_pagamento: formaPagamento,
    modalidade_pagamento: modalidadePagamento,
    valor_bruto: valorBruto,
    valor_liquido: valorLiquido,
    quantidade_parcelas: acordo.quantidade_parcelas,
    parcela_numero: parcela.numero,
    data_vencimento: parcela.data_vencimento || '',
    valor_liquido_parcela: formatarValor(parcela.valor_liquido || parcela.valor),
    repassado_cliente: parcela.repassado_cliente ? 'Y' : 'N',
    data_repassado_cliente: parcela.data_repassado_cliente || '',
  }));
}

/**
 * Transforma lista de acordos do Sinesys para formato legado
 */
export function transformAcordosSinesysParaLegacy(
  response: SinesysAcordosResponse
): LegacyPagamento[] {
  if (!response.success || !response.data.acordos) {
    return [];
  }

  // Mapear cada acordo para suas parcelas e achatar o array
  return response.data.acordos.flatMap(transformAcordoSinesysParaLegacy);
}

// =============================================================================
// TRANSFORMADOR AGREGADO
// =============================================================================

export interface DadosClienteSinesys {
  processos: SinesysProcessoResponse | { success: false; error: string };
  audiencias: SinesysAudienciasResponse | { success: false; error: string };
  contratos: SinesysContratosResponse | { success: false; error: string };
  acordos?: SinesysAcordosResponse | { success: false; error: string };
}

/**
 * Transforma todos os dados do cliente para o formato legado
 * 
 * Este é o transformador principal que converte todas as respostas
 * do Sinesys para o formato esperado pelo app "Meu Processo"
 */
export function transformDadosClienteParaLegacy(
  dados: DadosClienteSinesys
): LegacyConsultaCPFResponse {
  // Processos
  const processos =
    'success' in dados.processos && dados.processos.success
      ? transformProcessosSinesysParaLegacy(dados.processos)
      : [];

  // Audiências
  const audiencias =
    'success' in dados.audiencias && dados.audiencias.success
      ? transformAudienciasSinesysParaLegacy(dados.audiencias)
      : [];

  // Contratos
  const contratos =
    'success' in dados.contratos && dados.contratos.success
      ? transformContratosSinesysParaLegacy(dados.contratos)
      : 'Contratos não disponíveis';

  // Acordos/Condenações
  const acordos_condenacoes =
    dados.acordos && 'success' in dados.acordos && dados.acordos.success
      ? transformAcordosSinesysParaLegacy(dados.acordos)
      : [];

  // Mensagem de erro se todos falharam
  let message: string | undefined;
  if (processos.length === 0 && audiencias.length === 0) {
    message = 'Não foram encontrados dados para este CPF';
  }

  return {
    processos,
    audiencias,
    contratos,
    acordos_condenacoes,
    message,
  };
}
