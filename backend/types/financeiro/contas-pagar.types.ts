/**
 * Types e interfaces para o módulo de Contas a Pagar
 * Sistema de Gestão Financeira (SGF)
 *
 * Contas a Pagar são lançamentos financeiros do tipo 'despesa'
 * com data de vencimento definida.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status da conta a pagar (mapeado de status_lancamento)
 */
export type StatusContaPagar = 'pendente' | 'confirmado' | 'cancelado' | 'estornado';

/**
 * Origem da conta a pagar (mapeado de origem_lancamento)
 */
export type OrigemContaPagar =
  | 'manual'
  | 'acordo_judicial'
  | 'contrato'
  | 'folha_pagamento'
  | 'importacao_bancaria'
  | 'recorrente';

/**
 * Forma de pagamento disponível
 */
export type FormaPagamentoContaPagar =
  | 'dinheiro'
  | 'transferencia_bancaria'
  | 'ted'
  | 'pix'
  | 'boleto'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'cheque'
  | 'deposito_judicial';

/**
 * Frequência de recorrência
 */
export type FrequenciaRecorrencia =
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual';

/**
 * Categorias comuns de contas a pagar
 */
export type CategoriaContaPagar =
  | 'aluguel'
  | 'salarios'
  | 'encargos_trabalhistas'
  | 'impostos'
  | 'custas_processuais'
  | 'honorarios_terceiros'
  | 'servicos'
  | 'material_escritorio'
  | 'tecnologia'
  | 'marketing'
  | 'seguros'
  | 'manutencao'
  | 'viagens'
  | 'outros';

// ============================================================================
// Interfaces de Anexo
// ============================================================================

/**
 * Estrutura de um anexo
 */
export interface AnexoContaPagar {
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  uploadedAt: string;
  uploadedBy?: number;
}

// ============================================================================
// Interfaces Principais
// ============================================================================

/**
 * Interface principal de Conta a Pagar
 * Representa um lançamento financeiro do tipo 'despesa'
 */
export interface ContaPagar {
  id: number;

  // Identificação
  descricao: string;
  valor: number;

  // Datas
  dataLancamento: string;
  dataCompetencia: string;
  dataVencimento: string | null;
  dataEfetivacao: string | null;

  // Status e origem
  status: StatusContaPagar;
  origem: OrigemContaPagar;
  formaPagamento: FormaPagamentoContaPagar | null;

  // Contas e classificação
  contaBancariaId: number | null;
  contaContabilId: number;
  centroCustoId: number | null;

  // Categorização adicional
  categoria: string | null;
  documento: string | null;
  observacoes: string | null;

  // Dados flexíveis
  anexos: AnexoContaPagar[];
  dadosAdicionais: Record<string, unknown>;

  // Relacionamentos
  clienteId: number | null;
  contratoId: number | null;
  acordoCondenacaoId: number | null;
  parcelaId: number | null;
  usuarioId: number | null;

  // Recorrência
  recorrente: boolean;
  frequenciaRecorrencia: FrequenciaRecorrencia | null;
  lancamentoOrigemId: number | null;

  // Auditoria
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados resumidos de fornecedor (cliente PJ)
 */
export interface FornecedorResumo {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
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
 * Interface de Conta a Pagar com detalhes relacionados
 */
export interface ContaPagarComDetalhes extends ContaPagar {
  fornecedor?: FornecedorResumo;
  contaContabil?: ContaContabilResumo;
  centroCusto?: CentroCustoResumo;
  contaBancaria?: ContaBancariaResumo;
}

/**
 * Interface para templates de contas recorrentes
 */
export interface ContaPagarRecorrente extends ContaPagar {
  proximaGeracao?: string;
  ultimaGeracao?: string;
  totalGerados?: number;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para criar nova conta a pagar
 */
export interface CriarContaPagarDTO {
  // Campos obrigatórios
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaContabilId: number;

  // Campos opcionais
  dataCompetencia?: string;
  origem?: OrigemContaPagar;
  formaPagamento?: FormaPagamentoContaPagar;
  contaBancariaId?: number;
  centroCustoId?: number;
  categoria?: string;
  documento?: string;
  observacoes?: string;
  anexos?: AnexoContaPagar[];
  dadosAdicionais?: Record<string, unknown>;

  // Relacionamentos opcionais
  clienteId?: number; // ID do fornecedor (cliente PJ)
  contratoId?: number;
  acordoCondenacaoId?: number;
  parcelaId?: number;
  usuarioId?: number;

  // Recorrência
  recorrente?: boolean;
  frequenciaRecorrencia?: FrequenciaRecorrencia;
}

/**
 * DTO para atualizar conta a pagar existente
 */
export interface AtualizarContaPagarDTO {
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  dataCompetencia?: string;
  formaPagamento?: FormaPagamentoContaPagar;
  contaBancariaId?: number | null;
  contaContabilId?: number;
  centroCustoId?: number | null;
  categoria?: string | null;
  documento?: string | null;
  observacoes?: string | null;
  anexos?: AnexoContaPagar[];
  dadosAdicionais?: Record<string, unknown>;
  clienteId?: number | null;
  contratoId?: number | null;
  recorrente?: boolean;
  frequenciaRecorrencia?: FrequenciaRecorrencia | null;
}

/**
 * DTO para efetuar pagamento de conta
 */
export interface PagarContaPagarDTO {
  formaPagamento: FormaPagamentoContaPagar;
  contaBancariaId: number;
  dataEfetivacao?: string;
  observacoes?: string;
  comprovante?: AnexoContaPagar;
}

/**
 * DTO para cancelar conta
 */
export interface CancelarContaPagarDTO {
  motivo?: string;
  cancelarRecorrentes?: boolean;
}

// ============================================================================
// Parâmetros e Respostas
// ============================================================================

/**
 * Parâmetros para listagem de contas a pagar
 */
export interface ListarContasPagarParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: StatusContaPagar | StatusContaPagar[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;
  fornecedorId?: number;
  contaContabilId?: number;
  centroCustoId?: number;
  contaBancariaId?: number;
  categoria?: string;
  origem?: OrigemContaPagar;
  recorrente?: boolean;
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de contas a pagar
 */
export interface ListarContasPagarResponse {
  items: ContaPagarComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo?: {
    totalPendente: number;
    totalVencido: number;
    totalPago: number;
    valorTotalPendente: number;
    valorTotalVencido: number;
    valorTotalPago: number;
  };
}

/**
 * Resultado de operação em conta a pagar
 */
export interface OperacaoContaPagarResult {
  sucesso: boolean;
  contaPagar?: ContaPagar;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Resultado da geração de contas recorrentes
 */
export interface GerarRecorrentesResult {
  sucesso: boolean;
  contasGeradas: ContaPagar[];
  total: number;
  erros?: Array<{
    templateId: number;
    erro: string;
  }>;
}

/**
 * Resumo de vencimentos (para alertas)
 */
export interface ResumoVencimentos {
  vencidas: {
    quantidade: number;
    valorTotal: number;
    itens: ContaPagarComDetalhes[];
  };
  vencendoHoje: {
    quantidade: number;
    valorTotal: number;
    itens: ContaPagarComDetalhes[];
  };
  vencendoEm7Dias: {
    quantidade: number;
    valorTotal: number;
    itens: ContaPagarComDetalhes[];
  };
  vencendoEm30Dias: {
    quantidade: number;
    valorTotal: number;
    itens: ContaPagarComDetalhes[];
  };
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de contas a pagar
 */
export interface ContasPagarFilters {
  busca?: string;
  status?: StatusContaPagar | StatusContaPagar[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  fornecedorId?: number;
  categoria?: string;
  contaContabilId?: number;
  centroCustoId?: number;
  recorrente?: boolean;
}

// ============================================================================
// Validadores e Type Guards
// ============================================================================

/**
 * Type guard para verificar se é uma ContaPagar válida
 */
export const isContaPagar = (obj: unknown): obj is ContaPagar => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'descricao' in obj &&
    'valor' in obj &&
    'status' in obj &&
    'origem' in obj &&
    'contaContabilId' in obj
  );
};

/**
 * Validar dados de criação de conta a pagar
 */
export const validarCriarContaPagarDTO = (data: unknown): data is CriarContaPagarDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarContaPagarDTO;

  // Campos obrigatórios
  if (!dto.descricao || typeof dto.descricao !== 'string' || dto.descricao.trim() === '') {
    return false;
  }
  if (typeof dto.valor !== 'number' || dto.valor <= 0) {
    return false;
  }
  if (!dto.dataVencimento || typeof dto.dataVencimento !== 'string') {
    return false;
  }
  if (typeof dto.contaContabilId !== 'number' || dto.contaContabilId <= 0) {
    return false;
  }

  // Campos opcionais com validação
  if (dto.origem !== undefined && !isOrigemValida(dto.origem)) {
    return false;
  }
  if (dto.formaPagamento !== undefined && !isFormaPagamentoValida(dto.formaPagamento)) {
    return false;
  }
  if (dto.frequenciaRecorrencia !== undefined && !isFrequenciaValida(dto.frequenciaRecorrencia)) {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de conta a pagar
 */
export const validarAtualizarContaPagarDTO = (data: unknown): data is AtualizarContaPagarDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarContaPagarDTO;

  // Pelo menos um campo deve ser fornecido
  const temAlgumCampo =
    dto.descricao !== undefined ||
    dto.valor !== undefined ||
    dto.dataVencimento !== undefined ||
    dto.dataCompetencia !== undefined ||
    dto.formaPagamento !== undefined ||
    dto.contaBancariaId !== undefined ||
    dto.contaContabilId !== undefined ||
    dto.centroCustoId !== undefined ||
    dto.categoria !== undefined ||
    dto.documento !== undefined ||
    dto.observacoes !== undefined ||
    dto.anexos !== undefined ||
    dto.clienteId !== undefined ||
    dto.contratoId !== undefined ||
    dto.recorrente !== undefined ||
    dto.frequenciaRecorrencia !== undefined;

  if (!temAlgumCampo) {
    return false;
  }

  // Validar campos se fornecidos
  if (dto.valor !== undefined && (typeof dto.valor !== 'number' || dto.valor <= 0)) {
    return false;
  }
  if (dto.contaContabilId !== undefined && typeof dto.contaContabilId !== 'number') {
    return false;
  }

  return true;
};

/**
 * Validar dados de pagamento
 */
export const validarPagarContaPagarDTO = (data: unknown): data is PagarContaPagarDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as PagarContaPagarDTO;

  if (!isFormaPagamentoValida(dto.formaPagamento)) {
    return false;
  }
  if (typeof dto.contaBancariaId !== 'number' || dto.contaBancariaId <= 0) {
    return false;
  }

  return true;
};

// ============================================================================
// Helpers de Validação
// ============================================================================

const ORIGENS_VALIDAS: OrigemContaPagar[] = [
  'manual',
  'acordo_judicial',
  'contrato',
  'folha_pagamento',
  'importacao_bancaria',
  'recorrente',
];

const FORMAS_PAGAMENTO_VALIDAS: FormaPagamentoContaPagar[] = [
  'dinheiro',
  'transferencia_bancaria',
  'ted',
  'pix',
  'boleto',
  'cartao_credito',
  'cartao_debito',
  'cheque',
  'deposito_judicial',
];

const FREQUENCIAS_VALIDAS: FrequenciaRecorrencia[] = [
  'semanal',
  'quinzenal',
  'mensal',
  'bimestral',
  'trimestral',
  'semestral',
  'anual',
];

const STATUS_VALIDOS: StatusContaPagar[] = ['pendente', 'confirmado', 'cancelado', 'estornado'];

export const isOrigemValida = (origem: unknown): origem is OrigemContaPagar => {
  return typeof origem === 'string' && ORIGENS_VALIDAS.includes(origem as OrigemContaPagar);
};

export const isFormaPagamentoValida = (fp: unknown): fp is FormaPagamentoContaPagar => {
  return typeof fp === 'string' && FORMAS_PAGAMENTO_VALIDAS.includes(fp as FormaPagamentoContaPagar);
};

export const isFrequenciaValida = (freq: unknown): freq is FrequenciaRecorrencia => {
  return typeof freq === 'string' && FREQUENCIAS_VALIDAS.includes(freq as FrequenciaRecorrencia);
};

export const isStatusValido = (status: unknown): status is StatusContaPagar => {
  return typeof status === 'string' && STATUS_VALIDOS.includes(status as StatusContaPagar);
};

// ============================================================================
// Labels para UI
// ============================================================================

export const STATUS_LABELS: Record<StatusContaPagar, string> = {
  pendente: 'Pendente',
  confirmado: 'Pago',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

export const ORIGEM_LABELS: Record<OrigemContaPagar, string> = {
  manual: 'Manual',
  acordo_judicial: 'Acordo Judicial',
  contrato: 'Contrato',
  folha_pagamento: 'Folha de Pagamento',
  importacao_bancaria: 'Importação Bancária',
  recorrente: 'Recorrente',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamentoContaPagar, string> = {
  dinheiro: 'Dinheiro',
  transferencia_bancaria: 'Transferência Bancária',
  ted: 'TED',
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  cheque: 'Cheque',
  deposito_judicial: 'Depósito Judicial',
};

export const FREQUENCIA_LABELS: Record<FrequenciaRecorrencia, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

/**
 * Lista de categorias padrão para seleção em formulários
 */
export const CATEGORIAS_PADRAO: Array<{ value: string; label: string }> = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'salarios', label: 'Salários' },
  { value: 'encargos_trabalhistas', label: 'Encargos Trabalhistas' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'custas_processuais', label: 'Custas Processuais' },
  { value: 'honorarios_terceiros', label: 'Honorários de Terceiros' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'material_escritorio', label: 'Material de Escritório' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'viagens', label: 'Viagens' },
  { value: 'outros', label: 'Outros' },
];

export const CATEGORIA_LABELS: Record<CategoriaContaPagar, string> = {
  aluguel: 'Aluguel',
  salarios: 'Salários',
  encargos_trabalhistas: 'Encargos Trabalhistas',
  impostos: 'Impostos',
  custas_processuais: 'Custas Processuais',
  honorarios_terceiros: 'Honorários de Terceiros',
  servicos: 'Serviços',
  material_escritorio: 'Material de Escritório',
  tecnologia: 'Tecnologia',
  marketing: 'Marketing',
  seguros: 'Seguros',
  manutencao: 'Manutenção',
  viagens: 'Viagens',
  outros: 'Outros',
};

// ============================================================================
// Helpers de Cálculo de Datas
// ============================================================================

/**
 * Calcula a próxima data de vencimento baseada na frequência
 */
export const calcularProximoVencimento = (
  dataBase: string,
  frequencia: FrequenciaRecorrencia
): string => {
  const data = new Date(dataBase);

  switch (frequencia) {
    case 'semanal':
      data.setDate(data.getDate() + 7);
      break;
    case 'quinzenal':
      data.setDate(data.getDate() + 15);
      break;
    case 'mensal':
      data.setMonth(data.getMonth() + 1);
      break;
    case 'bimestral':
      data.setMonth(data.getMonth() + 2);
      break;
    case 'trimestral':
      data.setMonth(data.getMonth() + 3);
      break;
    case 'semestral':
      data.setMonth(data.getMonth() + 6);
      break;
    case 'anual':
      data.setFullYear(data.getFullYear() + 1);
      break;
  }

  return data.toISOString().split('T')[0];
};

/**
 * Verifica se uma conta está vencida
 */
export const isContaVencida = (conta: ContaPagar): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) {
    return false;
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(conta.dataVencimento);
  return vencimento < hoje;
};

/**
 * Verifica se uma conta vence hoje
 */
export const isContaVenceHoje = (conta: ContaPagar): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) {
    return false;
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(conta.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento.getTime() === hoje.getTime();
};

/**
 * Calcula dias até o vencimento (negativo se vencido)
 */
export const diasAteVencimento = (conta: ContaPagar): number | null => {
  if (!conta.dataVencimento) {
    return null;
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(conta.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
