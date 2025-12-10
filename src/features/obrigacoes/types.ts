
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
