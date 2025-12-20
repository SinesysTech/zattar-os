import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type ViewType = 'semana' | 'mes' | 'ano' | 'lista';

export type TipoObrigacao = 'acordo' | 'condenacao' | 'custas_processuais';
export type DirecaoPagamento = 'recebimento' | 'pagamento';
export type FormaDistribuicao = 'integral' | 'dividido';
export type StatusAcordo = 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
export type StatusParcela = 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
export type StatusRepasse =
  | 'nao_aplicavel'
  | 'pendente_declaracao'
  | 'pendente_transferencia'
  | 'repassado';
export type FormaPagamento = 'transferencia_direta' | 'deposito_judicial' | 'deposito_recursal';

export interface ObrigacoesFilters {
  tipo?: TipoObrigacao;
  direcao?: DirecaoPagamento;
  status?: StatusAcordo;
  dataInicio?: string;
  dataFim?: string;
  processoId?: number;
  incluirSemData?: boolean;
}

export interface ProcessoInfo {
  id: number;
  trt: string;
  grau: string;
  numero_processo: string;
  classe_judicial: string;
  descricao_orgao_julgador: string;
  nome_parte_autora: string;
  nome_parte_re: string;
}

export interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: TipoObrigacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  status: StatusAcordo;
  numeroParcelas: number;
  formaDistribuicao: FormaDistribuicao | null;
  percentualEscritorio: number;
  percentualCliente: number;
  honorariosSucumbenciaisTotal: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface Parcela {
  id: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosContratuais: number;
  honorariosSucumbenciais: number;
  valorRepasseCliente: number | null;
  dataVencimento: string;
  dataEfetivacao: string | null;
  status: StatusParcela;
  formaPagamento: FormaPagamento | null;
  statusRepasse: StatusRepasse;
  editadoManualmente: boolean;
  declaracaoPrestacaoContasUrl: string | null;
  dataDeclaracaoAnexada: string | null;
  comprovanteRepasseUrl: string | null;
  dataRepasse: string | null;
  usuarioRepasseId: number | null;
  createdAt: string;
  updatedAt: string;
  // Campos de integração
  dadosPagamento: Record<string, unknown> | null;
}

export interface AcordoComParcelas extends AcordoCondenacao {
  parcelas?: Parcela[];
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  processo?: ProcessoInfo | null;
}

export interface ParcelaComLancamento extends Parcela {
  lancamentoId?: number | null;
  // Outros campos se necessário
}

export interface RepassePendente {
  parcelaId: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  valorRepasseCliente: number;
  statusRepasse: StatusRepasse;
  dataEfetivacao: string;
  arquivoDeclaracaoPrestacaoContas: string | null;
  dataDeclaracaoAnexada: string | null;
  processoId: number;
  tipo: string;
  acordoValorTotal: number;
  percentualCliente: number;
  acordoNumeroParcelas: number;
}

export interface ResumoObrigacoes {
  pendentes: number;
  efetivadas: number;
  vencidas: number;
  totalValor: number;
}

// Params Types
export interface CriarAcordoComParcelasParams {
  processoId: number;
  tipo: TipoObrigacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  numeroParcelas: number;
  formaDistribuicao?: FormaDistribuicao | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  formaPagamentoPadrao: FormaPagamento;
  intervaloEntreParcelas?: number;
  createdBy?: string;
}

export interface AtualizarAcordoParams {
  valorTotal?: number;
  dataVencimentoPrimeiraParcela?: string;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  formaDistribuicao?: FormaDistribuicao | null;
  status?: StatusAcordo;
}

export interface ListarAcordosParams {
  pagina?: number;
  limite?: number;
  processoId?: number;
  tipo?: TipoObrigacao;
  direcao?: DirecaoPagamento;
  status?: StatusAcordo;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export interface AcordosCondenacoesPaginado {
  acordos: AcordoComParcelas[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface MarcarParcelaRecebidaParams {
  dataRecebimento: string;
  valorRecebido?: number; // Se diferente do previsto
}

export interface AtualizarParcelaParams {
  valorBrutoCreditoPrincipal?: number;
  honorariosSucumbenciais?: number;
  dataVencimento?: string;
  formaPagamento?: FormaPagamento;
  status?: StatusParcela;
}

export interface FiltrosRepasses {
  statusRepasse?: StatusRepasse;
  processoId?: number;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface RegistrarRepasseParams {
  arquivoComprovantePath: string;
  usuarioRepasseId: number;
}

// ============================================================================
// Constants
// ============================================================================

export const TIPO_LABELS = {
  acordo: 'Acordo',
  condenacao: 'Condenação',
  custas_processuais: 'Custas Processuais',
} as const;

export const DIRECAO_LABELS = {
  recebimento: 'Recebimento',
  pagamento: 'Pagamento',
} as const;

export const STATUS_LABELS = {
  pendente: 'Pendente',
  pago_parcial: 'Pago Parcial',
  pago_total: 'Pago Total',
  atrasado: 'Atrasado',
} as const;

export const FORMA_PAGAMENTO_LABELS = {
  transferencia_direta: 'Transferência Direta',
  deposito_judicial: 'Depósito Judicial',
  deposito_recursal: 'Depósito Recursal',
} as const;

export const PERCENTUAL_ESCRITORIO_PADRAO = 30;
export const INTERVALO_PARCELAS_PADRAO = 30;

// ============================================================================
// Schemas Zod
// ============================================================================

export const acordoCondenacaoSchema = z.object({
  id: z.number(),
  processoId: z.number(),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']),
  numeroParcelas: z.number().int().positive(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable(),
  percentualEscritorio: z.number().min(0).max(100),
  percentualCliente: z.number().min(0).max(100),
  honorariosSucumbenciaisTotal: z.number().min(0),
});

export const parcelaSchema = z.object({
  id: z.number(),
  acordoCondenacaoId: z.number(),
  numeroParcela: z.number(),
  valorBrutoCreditoPrincipal: z.number(),
  honorariosContratuais: z.number(),
  honorariosSucumbenciais: z.number(),
  valorRepasseCliente: z.number().nullable(),
  dataVencimento: z.string(),
  status: z.enum(['pendente', 'recebida', 'paga', 'atrasada', 'cancelada']),
  formaPagamento: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']).nullable(),
  statusRepasse: z.enum(['nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado']),
});

export const criarAcordoComParcelasSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório' }),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive('Valor deve ser positivo'),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  numeroParcelas: z.number().int().positive('Número de parcelas deve ser positivo'),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaPagamentoPadrao: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']),
  intervaloEntreParcelas: z.number().int().positive().optional().default(30),
}).refine((data) => {
  // Validação condicional de formaDistribuicao
  if (data.direcao === 'recebimento' && data.tipo !== 'custas_processuais') {
    return !!data.formaDistribuicao;
  }
  return true;
}, {
  message: 'Forma de distribuição é obrigatória para recebimentos',
  path: ['formaDistribuicao'],
}).refine((data) => {
  // Custas processuais
  if (data.tipo === 'custas_processuais') {
    return data.direcao === 'pagamento' && data.numeroParcelas === 1;
  }
  return true;
}, {
  message: 'Custas processuais devem ser pagamento e parcela única',
  path: ['tipo'],
});

export const atualizarAcordoSchema = z.object({
  valorTotal: z.number().positive().optional(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional(),
});

export const marcarParcelaRecebidaSchema = z.object({
  dataRecebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorRecebido: z.number().positive().optional(),
});
