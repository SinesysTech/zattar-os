import type { GrauProcesso } from './common';
import { StatusProcesso } from './common';

/**
 * Origem do processo no acervo.
 * - `acervo_geral`: Processos ativos ou em andamento.
 * - `arquivado`: Processos que foram arquivados.
 */
export type OrigemAcervo = 'acervo_geral' | 'arquivado';

/**
 * Representa um registro de processo no acervo do sistema, contendo
 * informações detalhadas sobre o processo judicial.
 */
export interface Acervo {
  id: number;
  id_pje: number;
  advogado_id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauProcesso;
  numero_processo: string;
  numero: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  segredo_justica: boolean;
  status: StatusProcesso;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string; // ISO timestamp
  juizo_digital: boolean;
  data_arquivamento: string | null; // ISO timestamp
  data_proxima_audiencia: string | null; // ISO timestamp
  tem_associacao: boolean;
  responsavel_id: number | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Representa um item de resultado quando os processos são agrupados
 * por um critério específico (e.g., por TRT, por status).
 */
export interface AgrupamentoAcervo {
  grupo: string;
  quantidade: number;
  processos?: Acervo[]; // Opcional: pode incluir os processos do grupo
}

/**
 * Contém metadados de uma instância específica de um processo,
 * representando sua passagem por um determinado grau de jurisdição.
 */
export interface ProcessoInstancia {
  id: number;
  grau: GrauProcesso;
  origem: OrigemAcervo;
  trt: string;
  data_autuacao: string;
  status: StatusProcesso; // Adicionado
  updated_at: string;
  is_grau_atual: boolean; // True se esta é a instância do grau mais recente
}

/**
 * Visão unificada de um processo que pode ter múltiplas instâncias
 * (e.g., 1º grau, 2º grau). Agrega dados da instância principal com
 * um resumo das demais.
 */
export interface ProcessoUnificado extends Omit<Acervo, 'id' | 'grau' | 'origem'> {
  id: number; // ID da instância principal (grau atual)
  grau_atual: GrauProcesso;
  status_geral: StatusProcesso; // Adicionado
  instances: ProcessoInstancia[];
  graus_ativos: GrauProcesso[];
}
