/**
 * Tipos para integração com app "Meu Processo" (cliente-facing)
 * 
 * Define as interfaces para:
 * - Respostas da API Sinesys
 * - Transformadores de dados
 * - Formato legado do webhook N8N
 */

// =============================================================================
// RESPOSTAS DO SINESYS
// =============================================================================

export interface SinesysProcessoResponse {
  success: boolean;
  data: {
    cliente: {
      nome: string;
      cpf: string;
    };
    resumo: {
      total_processos: number;
      com_audiencia_proxima: number;
    };
    processos: SinesysProcesso[];
  };
}

export interface SinesysProcesso {
  numero: string;
  tipo: string;
  papel_cliente: 'Reclamante' | 'Reclamado' | 'Autor' | 'Réu' | string;
  parte_contraria: string;
  tribunal: string;
  sigilo: boolean;
  valor_causa?: string;
  vara?: string;
  instancias: {
    primeiro_grau: SinesysInstancia | null;
    segundo_grau: SinesysInstancia | null;
  };
  timeline: SinesysTimelineItem[];
  timeline_status: 'disponivel' | 'sincronizando' | 'indisponivel';
  ultima_movimentacao?: {
    data: string;
    evento: string;
  };
  partes?: {
    polo_ativo: string;
    polo_passivo: string;
  };
}

export interface SinesysInstancia {
  vara?: string;
  data_inicio?: string;
  proxima_audiencia?: string;
  status?: string;
}

export interface SinesysTimelineItem {
  data: string;
  evento: string;
  descricao?: string;
  tem_documento: boolean;
  documento_url?: string;
}

export interface SinesysAudienciasResponse {
  success: boolean;
  data: {
    cliente: {
      nome: string;
      cpf: string;
    };
    resumo: {
      total_audiencias: number;
      futuras: number;
      realizadas: number;
      canceladas: number;
    };
    audiencias: SinesysAudiencia[];
  };
}

export interface SinesysAudiencia {
  numero_processo: string;
  tipo: string;
  data: string;
  horario: string;
  modalidade: 'Presencial' | 'Virtual' | 'Híbrida';
  status: 'Designada' | 'Realizada' | 'Cancelada' | 'Adiada';
  local: {
    tipo: 'presencial' | 'virtual' | 'hibrido';
    url_virtual?: string;
    endereco?: string;
    sala?: string;
    presenca_hibrida?: string;
  };
  partes: {
    polo_ativo: string;
    polo_passivo: string;
  };
  papel_cliente: string;
  parte_contraria: string;
  tribunal: string;
  vara?: string;
  sigilo: boolean;
  observacoes?: string;
  advogado?: string;
  orgao_julgador?: string;
}

export interface SinesysClienteResponse {
  success: boolean;
  data: {
    id: number;
    nome: string;
    cpf: string;
    email?: string;
    telefone?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
  };
}

export interface SinesysContratosResponse {
  success: boolean;
  data: {
    contratos: SinesysContrato[];
    total: number;
    pagina: number;
    limite: number;
  };
}

export interface SinesysContrato {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  cliente_cpf?: string;
  parte_contraria?: string;
  processo_numero?: string;
  processo_tipo_nome?: string;
  data_assinou_contrato?: string;
  data_admissao?: string;
  data_rescisao?: string;
  estagio?: string;
  data_estagio?: string;
  status: string;
  observacoes?: string;
}

export interface SinesysAcordosResponse {
  success: boolean;
  data: {
    acordos: SinesysAcordo[];
    total: number;
    pagina: number;
    limite: number;
  };
}

export interface SinesysAcordo {
  id: number;
  processo_id: number;
  numero_processo?: string;
  tipo: 'acordo' | 'condenacao';
  direcao: 'recebimento' | 'pagamento';
  valor_total: number;
  valor_bruto?: number;
  valor_liquido?: number;
  data_homologacao?: string;
  forma_pagamento?: string;
  modalidade_pagamento?: string;
  parte_autora?: string;
  parte_contraria?: string;
  quantidade_parcelas: number;
  parcelas: SinesysParcela[];
}

export interface SinesysParcela {
  id: number;
  numero: number;
  valor: number;
  valor_liquido?: number;
  data_vencimento?: string;
  status: 'pendente' | 'paga' | 'atrasada' | 'cancelada';
  data_pagamento?: string;
  repassado_cliente?: boolean;
  data_repassado_cliente?: string;
}

// =============================================================================
// FORMATO LEGADO (N8N WEBHOOK) - Para compatibilidade
// =============================================================================

export interface LegacyConsultaCPFResponse {
  contratos: LegacyContrato[] | string;
  acordos_condenacoes: LegacyPagamento[];
  audiencias: LegacyAudiencia[];
  processos: LegacyProcessoItem[];
  message?: string;
}

export interface LegacyContrato {
  cliente_nome: string;
  cliente_cpf: string;
  parte_contraria: string;
  processo_tipo_nome: string;
  data_admissao?: string;
  data_rescisao?: string;
  data_assinou_contrato: string;
  estagio: string;
  data_estagio: string;
  numero_processo: string;
}

export interface LegacyAudiencia {
  data_hora: string;
  polo_ativo: string;
  polo_passivo: string;
  numero_processo: string;
  modalidade: string;
  local_link: string | null;
  status: string;
  orgao_julgador: string;
  tipo: string;
  sala: string;
  advogado: string;
  detalhes: string | null;
  cliente_nome: string;
}

export interface LegacyPagamento {
  numero_processo: string;
  parte_autora: string;
  parte_contraria: string;
  data_homologacao: string;
  tipo_pagamento: string;
  forma_pagamento: string;
  modalidade_pagamento: string;
  valor_bruto: string;
  valor_liquido: string;
  quantidade_parcelas: number;
  parcela_numero: number;
  data_vencimento: string;
  valor_liquido_parcela: string;
  repassado_cliente: 'Y' | 'N';
  data_repassado_cliente: string;
}

export interface LegacyProcessoItem {
  processo?: {
    parteAutora: string;
    parteRe: string;
    tribunal: string;
    numero: string;
    valorDaCausa: string;
    jurisdicaoEstado: string;
    jurisdicaoMunicipio: string;
    instancias: {
      primeirograu: LegacyInstancia | null;
      segundograu: LegacyInstancia | null;
      terceirograu: LegacyInstancia | null;
    };
  };
  result?: string; // Mensagem de erro se processo não disponível
}

export interface LegacyInstancia {
  dataAjuizamento?: string;
  movimentos?: LegacyMovimento[];
}

export interface LegacyMovimento {
  dataMovimento: string;
  tipoMovimento: string;
  complemento?: string;
}

// =============================================================================
// TIPOS DE ERRO
// =============================================================================

export interface SinesysErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export class SinesysAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'SinesysAPIError';
  }
}

// =============================================================================
// TIPOS DE CONFIGURAÇÃO
// =============================================================================

export interface SinesysClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export interface CachingOptions {
  enabled: boolean;
  ttl?: number; // em segundos
  storage?: 'memory' | 'redis' | 'localStorage';
}
