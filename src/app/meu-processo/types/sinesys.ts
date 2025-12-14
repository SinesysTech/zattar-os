/**
 * Schemas TypeScript portados do Sinesys para integração
 */

// =============================================================================
// COMUNS
// =============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: {
        timestamp: string;
        version: string;
    };
}

export type PapelCliente = 'AUTOR' | 'REU' | 'TERCEIRO' | 'OUTRO';

export interface ClienteInfo {
    nome: string;
    cpf: string;
}

// =============================================================================
// PROCESSOS
// =============================================================================

export type TimelineStatus =
    | 'PENDENTE'
    | 'EM_ANDAMENTO'
    | 'CONCLUIDO'
    | 'ERRO'
    | 'DESATUALIZADO';

export interface TimelineItem {
    data: string;
    evento: string;
    descricao: string;
    tem_documento: boolean;
}

export interface InstanciaSinesys {
    vara: string;
    data_inicio: string;
    proxima_audiencia?: string;
}

export interface PartesProcesso {
    polo_ativo: string;
    polo_passivo: string;
}

export interface UltimaMovimentacao {
    data: string;
    evento: string;
}

export interface ProcessoSinesys {
    numero: string;
    tipo: string;
    papel_cliente: PapelCliente;
    parte_contraria: string;
    tribunal: string;
    sigilo: boolean;
    valor_causa?: number;
    vara?: string;
    instancias: {
        primeiro_grau: InstanciaSinesys | null;
        segundo_grau: InstanciaSinesys | null;
    };
    timeline: TimelineItem[];
    timeline_status: TimelineStatus;
    timeline_mensagem?: string;
    ultima_movimentacao?: UltimaMovimentacao;
    partes: PartesProcesso;
    // Campos que podem vir extra ou serem computados
    id?: number; // Para acordos
    createdAt?: string;
}

export interface ResumoProcessos {
    total_processos: number;
    com_audiencia_proxima: number;
}

export interface ProcessosResponseData {
    cliente: ClienteInfo;
    resumo: ResumoProcessos;
    processos: ProcessoSinesys[];
}

export type ProcessosResponse = ApiResponse<ProcessosResponseData>;

// =============================================================================
// AUDIÊNCIAS
// =============================================================================

export type ModalidadeAudiencia = 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA' | 'SEMIPRESENCIAL';
export type StatusAudiencia = 'AGENDADA' | 'REALIZADA' | 'CANCELADA' | 'REDESIGNADA' | 'SUSPENSA' | 'NAO_REALIZADA';
export type TipoLocalAudiencia = 'FISICO' | 'VIRTUAL' | 'HIBRIDO';

export interface LocalAudiencia {
    tipo: TipoLocalAudiencia;
    url_virtual?: string;
    endereco?: string;
    sala?: string;
    presenca_hibrida?: string;
}

export interface PartesAudiencia {
    polo_ativo: string;
    polo_passivo: string;
}

export interface AudienciaSinesys {
    numero_processo: string;
    tipo: string;
    data: string; // YYYY-MM-DD
    horario: string;
    modalidade: ModalidadeAudiencia;
    status: StatusAudiencia;
    local: LocalAudiencia;
    partes: PartesAudiencia;
    papel_cliente: PapelCliente;
    parte_contraria: string;
    tribunal: string;
    vara: string;
    sigilo: boolean;
    observacoes?: string;
}

export interface ResumoAudiencias {
    total_audiencias: number;
    futuras: number;
    realizadas: number;
    canceladas: number;
}

export interface AudienciasResponseData {
    cliente: ClienteInfo;
    resumo: ResumoAudiencias;
    audiencias: AudienciaSinesys[];
}

export type AudienciasResponse = ApiResponse<AudienciasResponseData>;

// =============================================================================
// CONTRATOS
// =============================================================================

export type AreaDireito = 'trabalhista' | 'civil' | 'previdenciario' | 'criminal' | 'empresarial' | 'administrativo';
export type TipoContrato = 'ajuizamento' | 'defesa' | 'ato_processual' | 'assessoria' | 'consultoria' | 'extrajudicial' | 'parecer';
export type TipoCobranca = 'pro_exito' | 'pro_labore';
export type StatusContrato = 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';
export type PoloProcessual = 'autor' | 're';

export interface ParteContrato {
    tipo: 'cliente' | 'parte_contraria';
    id: number;
    nome: string;
}

export interface ContratoSinesys {
    id: number;
    areaDireito: AreaDireito;
    tipoContrato: TipoContrato;
    tipoCobranca: TipoCobranca;
    clienteId: number;
    poloCliente: PoloProcessual;
    parteContrariaId: number | null;
    parteAutora: ParteContrato[] | null;
    parteRe: ParteContrato[] | null;
    qtdeParteAutora: number;
    qtdeParteRe: number;
    status: StatusContrato;
    dataContratacao: string;
    dataAssinatura: string | null;
    dataDistribuicao: string | null;
    dataDesistencia: string | null;
    responsavelId: number | null;
    createdBy: number | null;
    observacoes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContratosResponseData {
    contratos: ContratoSinesys[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export type ContratosResponse = ApiResponse<ContratosResponseData>;

// =============================================================================
// ACORDOS E CONDENAÇÕES
// =============================================================================

export type TipoAcordoCondenacao = 'acordo' | 'condenacao' | 'custas_processuais';
export type DirecaoPagamento = 'recebimento' | 'pagamento';
export type StatusAcordoCondenacao = 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
export type FormaDistribuicao = 'integral' | 'dividido';

export interface Parcela {
    id: number;
    acordo_condenacao_id: number;
    numero: number;
    valor: number;
    data_vencimento: string;
    status: 'pendente' | 'recebida' | 'paga' | 'atrasada';
    data_pagamento: string | null;
    valor_pago: number | null;
    comprovante_url: string | null;
}

export interface AcordoCondenacaoSinesys {
    id: number;
    processoId: number;
    tipo: TipoAcordoCondenacao;
    direcao: DirecaoPagamento;
    valorTotal: number;
    dataVencimentoPrimeiraParcela: string;
    status: StatusAcordoCondenacao;
    numeroParcelas: number;
    formaDistribuicao: FormaDistribuicao | null;
    percentualEscritorio: number | null;
    percentualCliente: number | null;
    honorariosSucumbenciaisTotal: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    // Campos extras populados
    parcelas?: Parcela[];
    totalParcelas?: number;
    parcelasPagas?: number;
    parcelasPendentes?: number;
}

export interface AcordosResponseData {
    acordos: AcordoCondenacaoSinesys[];
    total: number;
    pagina: number;
    limite: number;
}

export type AcordosResponse = ApiResponse<AcordosResponseData>;

// =============================================================================
// RESPOSTA GERAL DO DASHBOARD
// =============================================================================

export interface ConsultaSinesysResponse {
    processos: ProcessosResponse;
    audiencias: AudienciasResponse;
    contratos: ContratosResponse;
    acordos: AcordosResponse;
}
