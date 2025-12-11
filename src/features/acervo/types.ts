/**
 * Types for Acervo Feature
 * Consolidates types from backend/types/acervo/
 */

import { z } from 'zod';
import { StatusProcesso } from '@/features/processos/domain';
import type { TimelineItemEnriquecido } from '@/lib/api/pje-trt/types';

// Re-export timeline types for convenience
export type { TimelineItemEnriquecido };

// ============================================================================
// Domain Types
// ============================================================================

export type OrigemAcervo = 'acervo_geral' | 'arquivado';
export type GrauAcervo = 'primeiro_grau' | 'segundo_grau';

export interface Acervo {
  id: number;
  id_pje: number;
  advogado_id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
  numero: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  segredo_justica: boolean;
  status: StatusProcesso;
  codigo_status_processo?: string;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string;
  juizo_digital: boolean;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  tem_associacao: boolean;
  responsavel_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessoInstancia {
  id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  data_autuacao: string;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
}

export interface ProcessoUnificado {
  numero_processo: string;
  trt: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  segredo_justica: boolean;
  responsavel_id: number | null;
  tem_associacao: boolean;
  instancias: ProcessoInstancia[];
  data_autuacao_mais_antiga: string;
  data_proxima_audiencia: string | null;
}

export interface AgrupamentoAcervo {
  grupo: string;
  quantidade: number;
  processos?: Acervo[];
}

// ============================================================================
// Service Params & Results
// ============================================================================

export type OrdenarPorAcervo =
  | 'data_autuacao'
  | 'data_arquivamento'
  | 'data_proxima_audiencia'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'descricao_orgao_julgador'
  | 'classe_judicial'
  | 'created_at'
  | 'updated_at';

export type AgruparPorAcervo =
  | 'trt'
  | 'grau'
  | 'origem'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao';

export type OrdemAcervo = 'asc' | 'desc';

export interface ListarAcervoParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  origem?: OrigemAcervo;
  trt?: string;
  grau?: GrauAcervo;

  // Filtros de responsável
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;

  // Busca textual
  busca?: string;

  // Filtros específicos
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;

  // Filtros booleanos
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;
  tem_proxima_audiencia?: boolean;

  // Filtros de data
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;

  // Ordenação
  ordenar_por?: OrdenarPorAcervo;
  ordem?: OrdemAcervo;

  // Agrupamento
  agrupar_por?: AgruparPorAcervo;
  incluir_contagem?: boolean;

  // Unificação
  unified?: boolean;
}

export interface ListarAcervoResult {
  processos: Acervo[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ListarAcervoAgrupadoResult {
  agrupamentos: AgrupamentoAcervo[];
  total: number;
}

export interface ListarAcervoUnificadoResult {
  processos: ProcessoUnificado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ============================================================================
// Timeline Types (for CPF-based queries)
// ============================================================================

export interface ProcessoClienteCpfRow {
  cpf: string;
  cliente_nome: string;
  cliente_id: number;
  tipo_parte: string;
  polo: string;
  parte_principal: boolean;
  processo_id: number;
  id_pje: string;
  advogado_id: number;
  numero_processo: string;
  trt: string;
  grau: GrauAcervo;
  classe_judicial: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  descricao_orgao_julgador: string;
  codigo_status_processo: string;
  origem: OrigemAcervo;
  data_autuacao: string;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  segredo_justica: boolean;
  timeline_mongodb_id: string | null;
}

export interface ClienteRespostaIA {
  nome: string;
  cpf: string;
}

export interface ResumoProcessosIA {
  total_processos: number;
  com_audiencia_proxima: number;
}

export interface InstanciaProcessoIA {
  vara: string | undefined;
  data_inicio: string;
  proxima_audiencia: string | null;
}

export interface TimelineItemIA {
  data: string;
  evento: string;
  descricao: string;
  tem_documento: boolean;
}

export interface UltimaMovimentacaoIA {
  data: string;
  evento: string;
}

export type TimelineStatus = 'disponivel' | 'sincronizando' | 'indisponivel' | 'erro';

export interface ProcessoRespostaIA {
  numero: string;
  tipo: string;
  papel_cliente: string;
  parte_contraria: string;
  tribunal: string;
  sigilo: boolean;
  instancias: {
    primeiro_grau: InstanciaProcessoIA | null;
    segundo_grau: InstanciaProcessoIA | null;
  };
  timeline?: TimelineItemIA[];
  timeline_status: TimelineStatus;
  timeline_mensagem?: string;
  ultima_movimentacao?: UltimaMovimentacaoIA | null;
}

export interface ProcessosClienteCpfSuccessResponse {
  success: true;
  data: {
    cliente: ClienteRespostaIA;
    resumo: ResumoProcessosIA;
    processos: ProcessoRespostaIA[];
  };
}

export interface ProcessosClienteCpfErrorResponse {
  success: false;
  error: string;
}

export type ProcessosClienteCpfResponse =
  | ProcessosClienteCpfSuccessResponse
  | ProcessosClienteCpfErrorResponse;

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const listarAcervoParamsSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(2000).optional(),
  origem: z.enum(['acervo_geral', 'arquivado']).optional(),
  trt: z.string().optional(),
  grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
  responsavel_id: z.union([z.number(), z.literal('null')]).optional(),
  sem_responsavel: z.boolean().optional(),
  busca: z.string().optional(),
  numero_processo: z.string().optional(),
  nome_parte_autora: z.string().optional(),
  nome_parte_re: z.string().optional(),
  descricao_orgao_julgador: z.string().optional(),
  classe_judicial: z.string().optional(),
  codigo_status_processo: z.string().optional(),
  segredo_justica: z.boolean().optional(),
  juizo_digital: z.boolean().optional(),
  tem_associacao: z.boolean().optional(),
  tem_proxima_audiencia: z.boolean().optional(),
  data_autuacao_inicio: z.string().optional(),
  data_autuacao_fim: z.string().optional(),
  data_arquivamento_inicio: z.string().optional(),
  data_arquivamento_fim: z.string().optional(),
  data_proxima_audiencia_inicio: z.string().optional(),
  data_proxima_audiencia_fim: z.string().optional(),
  ordenar_por: z.enum([
    'data_autuacao',
    'data_arquivamento',
    'data_proxima_audiencia',
    'numero_processo',
    'nome_parte_autora',
    'nome_parte_re',
    'descricao_orgao_julgador',
    'classe_judicial',
    'created_at',
    'updated_at',
  ]).optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
  agrupar_por: z.enum([
    'trt',
    'grau',
    'origem',
    'responsavel_id',
    'classe_judicial',
    'codigo_status_processo',
    'orgao_julgador',
    'mes_autuacao',
    'ano_autuacao',
  ]).optional(),
  incluir_contagem: z.boolean().optional(),
  unified: z.boolean().optional(),
});

export const atribuirResponsavelSchema = z.object({
  processoIds: z.array(z.number()).min(1),
  responsavelId: z.number().nullable(),
});

// ============================================================================
// Processos Cliente CPF Types
// ============================================================================

export interface InstanciaInfo {
  numero_processo: string;
  classe_judicial: string;
  orgao_julgador: string;
  data_autuacao?: string;
  valor_causa?: number;
  segredo_justica?: boolean;
}

export interface ProcessoClienteCPF {
  numero_processo: string;
  classe_judicial: string;
  tipo_parte: string;
  trt: string;
  grau: string;
  origem: string;
  segredo_justica: boolean;
  cpf?: string;
  cliente_nome?: string;

  // Consolidated data
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  data_autuacao?: string;
  codigo_status_processo?: string;
  status?: string;
  responsavel_id?: number;

  // Instances
  instancias: {
    primeiro_grau?: InstanciaInfo;
    segundo_grau?: InstanciaInfo;
    tst?: InstanciaInfo;
  };

  // Timeline
  timeline?: TimelineItemIA[];
  timeline_status?: TimelineStatus;
  timeline_ultimo_update?: string;

  // Internal flags
  tem_timeline?: boolean;
  tem_detalhes?: boolean;
}

export interface BuscarProcessosClienteCPFParams {
  cpf: string;
  timeline?: boolean;
  timelineMensagem?: string;
  timelineStatus?: TimelineStatus;
}
