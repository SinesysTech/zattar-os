
// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status da folha de pagamento
 */
export type StatusFolhaPagamento = 'rascunho' | 'aprovada' | 'paga' | 'cancelada';

/**
 * Forma de pagamento para folha
 */
export type FormaPagamentoFolha =
  | 'transferencia_bancaria'
  | 'ted'
  | 'pix'
  | 'deposito'
  | 'dinheiro';

// ============================================================================
// Interfaces de Resumo (para joins)
// ============================================================================

/**
 * Dados resumidos de usuário
 */
export interface UsuarioResumo {
  id: number;
  nomeExibicao: string;
  email: string;
  cargo?: string;
}

/**
 * Dados resumidos de cargo
 */
export interface CargoResumo {
  id: number;
  nome: string;
  descricao: string | null;
}

/**
 * Dados resumidos de conta contábil
 */
export interface ContaContabilResumo {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Dados resumidos de centro de custo
 */
export interface CentroCustoResumo {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Dados resumidos de conta bancária
 */
export interface ContaBancariaResumo {
  id: number;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
}

/**
 * Dados resumidos de lançamento financeiro
 */
export interface LancamentoFinanceiroResumo {
  id: number;
  descricao: string;
  valor: number;
  status: string;
  dataVencimento: string | null;
  dataEfetivacao: string | null;
}

// ============================================================================
// Interfaces Principais - Salários
// ============================================================================

/**
 * Interface principal de Salário
 */
export interface Salario {
  id: number;

  // Funcionário
  usuarioId: number;
  cargoId: number | null;

  // Valor
  salarioBruto: number;

  // Vigência
  dataInicioVigencia: string;
  dataFimVigencia: string | null;

  // Informações adicionais
  observacoes: string | null;

  // Status
  ativo: boolean;

  // Auditoria
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Salário com detalhes de relacionamentos
 */
export interface SalarioComDetalhes extends Salario {
  usuario?: UsuarioResumo;
  cargo?: CargoResumo;
}

// ============================================================================
// Interfaces Principais - Folha de Pagamento
// ============================================================================

/**
 * Interface principal de Folha de Pagamento
 */
export interface FolhaPagamento {
  id: number;

  // Período de referência
  mesReferencia: number;
  anoReferencia: number;

  // Datas
  dataGeracao: string;
  dataPagamento: string | null;

  // Totais
  valorTotal: number;

  // Status
  status: StatusFolhaPagamento;

  // Informações adicionais
  observacoes: string | null;

  // Auditoria
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Folha de Pagamento com detalhes
 */
export interface FolhaPagamentoComDetalhes extends FolhaPagamento {
  itens: ItemFolhaComDetalhes[];
  totalFuncionarios: number;
}

/**
 * Interface de Item da Folha de Pagamento
 */
export interface ItemFolhaPagamento {
  id: number;

  // Vinculação
  folhaPagamentoId: number;
  usuarioId: number;
  salarioId: number;

  // Valores
  valorBruto: number;

  // Lançamento gerado
  lancamentoFinanceiroId: number | null;

  // Informações adicionais
  observacoes: string | null;

  // Auditoria
  createdAt: string;
  updatedAt: string;
}

/**
 * Item da Folha com detalhes de relacionamentos
 */
export interface ItemFolhaComDetalhes extends ItemFolhaPagamento {
  usuario?: UsuarioResumo;
  salario?: Salario;
  lancamento?: LancamentoFinanceiroResumo;
}

// ============================================================================
// DTOs - Salários
// ============================================================================

/**
 * DTO para criar novo salário
 */
export interface CriarSalarioDTO {
  usuarioId: number;
  cargoId?: number;
  salarioBruto: number;
  dataInicioVigencia: string;
  observacoes?: string;
}

/**
 * DTO para atualizar salário
 */
export interface AtualizarSalarioDTO {
  salarioBruto?: number;
  cargoId?: number | null;
  dataFimVigencia?: string;
  observacoes?: string | null;
  ativo?: boolean;
}

// ============================================================================
// DTOs - Folha de Pagamento
// ============================================================================

/**
 * DTO para gerar nova folha de pagamento
 */
export interface GerarFolhaDTO {
  mesReferencia: number;
  anoReferencia: number;
  dataPagamento?: string;
  observacoes?: string;
}

/**
 * DTO para aprovar folha de pagamento
 */
export interface AprovarFolhaDTO {
  contaBancariaId: number;
  contaContabilId: number;
  centroCustoId?: number;
  observacoes?: string;
}

/**
 * DTO para pagar folha de pagamento
 */
export interface PagarFolhaDTO {
  formaPagamento: FormaPagamentoFolha;
  contaBancariaId: number;
  dataEfetivacao?: string;
  observacoes?: string;
}

/**
 * DTO para cancelar folha de pagamento
 */
export interface CancelarFolhaDTO {
  motivo?: string;
}

// ============================================================================
// Parâmetros e Respostas - Salários
// ============================================================================

/**
 * Parâmetros para listagem de salários
 */
export interface ListarSalariosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  usuarioId?: number;
  cargoId?: number;
  ativo?: boolean;
  vigente?: boolean; // Filtrar apenas salários vigentes na data atual
  ordenarPor?: 'data_inicio_vigencia' | 'salario_bruto' | 'usuario' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de salários
 */
export interface ListarSalariosResponse {
  items: SalarioComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  totais?: {
    totalFuncionarios: number;
    totalBrutoMensal: number;
  };
  usuariosSemSalario?: UsuarioResumo[];
}

// ============================================================================
// Parâmetros e Respostas - Folhas de Pagamento
// ============================================================================

/**
 * Parâmetros para listagem de folhas
 */
export interface ListarFolhasParams {
  pagina?: number;
  limite?: number;
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFolhaPagamento | StatusFolhaPagamento[];
  ordenarPor?: 'periodo' | 'valor_total' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de folhas
 */
export interface ListarFolhasResponse {
  items: FolhaPagamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo?: {
    totalRascunho: number;
    totalAprovada: number;
    totalPaga: number;
    valorTotalRascunho: number;
    valorTotalAprovada: number;
    valorTotalPaga: number;
  };
  totais?: TotaisFolhasPorStatus;
}

/**
 * Resultado de operação em salário
 */
export interface OperacaoSalarioResult {
  sucesso: boolean;
  salario?: Salario;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Resultado de operação em folha de pagamento
 */
export interface OperacaoFolhaResult {
  sucesso: boolean;
  folha?: FolhaPagamentoComDetalhes;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Totais por status (para dashboards)
 */
export interface TotaisFolhasPorStatus {
  rascunho: { quantidade: number; valorTotal: number };
  aprovada: { quantidade: number; valorTotal: number };
  paga: { quantidade: number; valorTotal: number };
  cancelada: { quantidade: number; valorTotal: number };
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de salários
 */
export interface SalariosFilters {
  busca?: string;
  usuarioId?: number;
  cargoId?: number;
  ativo?: boolean;
  vigente?: boolean;
}

/**
 * Filtros para toolbar de folhas de pagamento
 */
export interface FolhasPagamentoFilters {
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFolhaPagamento | StatusFolhaPagamento[];
}
