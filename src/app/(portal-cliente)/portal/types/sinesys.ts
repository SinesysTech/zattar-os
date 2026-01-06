/**
 * Tipos para integração com API Sinesys no Portal do Cliente
 */

/**
 * Processo retornado pela API Sinesys
 */
export interface ProcessoSinesys {
  numero: string;
  classe?: string;
  tribunal?: string;
  vara?: string;
  status?: string;
  timeline_status?: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PENDENTE' | 'ERRO' | 'DESATUALIZADO';
  valor_causa?: number;
  data_distribuicao?: string;
  partes?: {
    polo_ativo?: string;
    polo_passivo?: string;
  };
  timeline?: TimelineItem[];
}

/**
 * Audiência retornada pela API Sinesys
 */
export interface AudienciaSinesys {
  id: number | string;
  numero_processo?: string;
  data: string;
  horario?: string;
  status: 'AGENDADA' | 'REDESIGNADA' | 'REALIZADA' | 'CANCELADA' | 'SUSPENSA' | 'NAO_REALIZADA';
  tipo?: string;
  local?: string | {
    url_virtual?: string;
    endereco?: string;
    sala?: string;
  };
  observacoes?: string;
  vara?: string;
  modalidade?: string;
  partes?: {
    polo_ativo?: string;
    polo_passivo?: string;
  };
}

/**
 * Contrato retornado pela API Sinesys
 */
export interface ContratoSinesys {
  id: number | string;
  numero?: string;
  tipoContrato?: string;
  status?: string;
  dataAssinatura?: string;
  dataInicio?: string;
  dataFim?: string;
  cadastradoEm?: string;
  valorTotal?: number;
  papelClienteNoContrato?: 'autora' | 're';
  partes?: Array<{
    nome: string;
    papelContratual: 'autora' | 're';
  }>;
}

/**
 * Acordo/Condenação retornado pela API Sinesys (para pagamentos)
 */
export interface AcordoCondenacaoSinesys {
  id: number | string;
  numero_processo?: string;
  processoId?: number | string;
  tipo: 'acordo' | 'condenacao';
  status?: string;
  direcao?: string;
  valor_total?: number;
  valorTotal?: number;
  valor_pago?: number;
  honorariosSucumbenciaisTotal?: number;
  parcelasPagas?: number;
  numeroParcelas?: number;
  data_acordo?: string;
  data_vencimento?: string;
  dataVencimentoPrimeiraParcela?: string;
  parcelas?: Array<{
    numero: number;
    valor: number;
    data_vencimento: string;
    status: 'paga' | 'pendente' | 'vencida';
  }>;
}

/**
 * Item da timeline de um processo
 */
export interface TimelineItem {
  data: string;
  evento: string;
  descricao?: string;
  tipo?: 'movimentacao' | 'audiencia' | 'documento' | 'decisao';
  tem_documento?: boolean;
}
