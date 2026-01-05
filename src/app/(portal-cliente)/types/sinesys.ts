/**
 * Tipos para o Portal do Cliente (meu-processo)
 * Formato específico para dados exibidos no portal público
 */

/**
 * Dados do local da audiência para exibição
 */
export interface LocalAudienciaSinesys {
  url_virtual?: string | null;
  endereco?: string | null;
  sala?: string | null;
}

/**
 * Partes do processo para exibição
 */
export interface PartesAudienciaSinesys {
  polo_ativo?: string | null;
  polo_passivo?: string | null;
}

/**
 * Tipo de audiência para o Portal do Cliente
 * Formato simplificado para exibição pública
 */
export interface AudienciaSinesys {
  id: number;
  numero_processo: string;
  vara?: string | null;
  tipo?: string | null;
  data: string;
  horario?: string | null;
  modalidade?: string | null;
  status: string;
  observacoes?: string | null;
  local?: LocalAudienciaSinesys | null;
  partes?: PartesAudienciaSinesys | null;
}

/**
 * Item da timeline de movimentações do processo
 */
export interface TimelineItem {
  data: string;
  evento: string;
  descricao?: string;
  tem_documento?: boolean;
}

/**
 * Parte de um processo/contrato
 */
export interface PartePessoa {
  nome: string;
}

export interface ContratoParteSinesys {
  tipoEntidade: 'cliente' | 'parte_contraria';
  papelContratual: 'autora' | 're';
  nome: string;
}

/**
 * Contrato para exibição no Portal do Cliente
 */
export interface ContratoSinesys {
  id?: number;
  papelClienteNoContrato: 'autora' | 're';
  partes?: ContratoParteSinesys[];
  tipoContrato?: string | null;
  cadastradoEm?: string | null;
  status?: string | null;
}

/**
 * Acordo ou condenação para exibição no Portal do Cliente
 */
export interface AcordoCondenacaoSinesys {
  processoId: number;
  tipo: string;
  direcao: string;
  valorTotal: string | number;
  honorariosSucumbenciaisTotal: string | number;
  parcelasPagas?: number;
  numeroParcelas: number;
  dataVencimentoPrimeiraParcela: string;
  status: string;
}

/**
 * Partes de um processo
 */
export interface PartesSinesys {
  polo_ativo?: string;
  polo_passivo?: string;
}

/**
 * Processo para exibição no Portal do Cliente
 */
export interface ProcessoSinesys {
  numero?: string;
  tribunal: string;
  vara?: string;
  valor_causa?: number;
  timeline_status?: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PENDENTE' | 'ERRO' | 'DESATUALIZADO';
  partes?: PartesSinesys;
  timeline?: TimelineItem[];
}
