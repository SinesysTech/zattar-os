/**
 * Types e interfaces para o módulo de Contas a Receber
 * Sistema de Gestão Financeira (SGF)
 *
 * Contas a Receber são lançamentos financeiros do tipo 'receita'
 * com data de vencimento definida.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status da conta a receber (mapeado de status_lancamento)
 */
export type StatusContaReceber = 'pendente' | 'confirmado' | 'cancelado' | 'estornado';

/**
 * Origem da conta a receber (mapeado de origem_lancamento)
 */
export type OrigemContaReceber =
  | 'manual'
  | 'acordo_judicial'
  | 'contrato'
  | 'importacao_bancaria'
  | 'recorrente';

/**
 * Forma de recebimento disponível
 */
export type FormaRecebimentoContaReceber =
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
 * Categorias de contas a receber
 */
export type CategoriaContaReceber =
  | 'honorarios_contratuais'
  | 'honorarios_sucumbenciais'
  | 'honorarios_exito'
  | 'consultoria'
  | 'assessoria'
  | 'outros';

// ============================================================================
// Interfaces de Anexo
// ============================================================================

/**
 * Estrutura de um anexo
 */
export interface AnexoContaReceber {
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
 * Interface principal de Conta a Receber
 * Representa um lançamento financeiro do tipo 'receita'
 */
export interface ContaReceber {
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
  status: StatusContaReceber;
  origem: OrigemContaReceber;
  formaRecebimento: FormaRecebimentoContaReceber | null;

  // Contas e classificação
  contaBancariaId: number | null;
  contaContabilId: number;
  centroCustoId: number | null;

  // Categorização adicional
  categoria: string | null;
  documento: string | null;
  observacoes: string | null;

  // Dados flexíveis
  anexos: AnexoContaReceber[];
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
 * Dados resumidos de cliente
 */
export interface ClienteResumo {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  tipoPessoa: 'fisica' | 'juridica';
}

/**
 * Dados resumidos de contrato
 */
export interface ContratoResumo {
  id: number;
  areaDireito: string | null;
  tipoContrato: string | null;
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
 * Interface de Conta a Receber com detalhes relacionados
 */
export interface ContaReceberComDetalhes extends ContaReceber {
  cliente?: ClienteResumo;
  contrato?: ContratoResumo;
  contaContabil?: ContaContabilResumo;
  centroCusto?: CentroCustoResumo;
  contaBancaria?: ContaBancariaResumo;
}

/**
 * Interface para templates de contas recorrentes
 */
export interface ContaReceberRecorrente extends ContaReceber {
  proximaGeracao?: string;
  ultimaGeracao?: string;
  totalGerados?: number;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para criar nova conta a receber
 */
export interface CriarContaReceberDTO {
  // Campos obrigatórios
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaContabilId: number;

  // Campos opcionais
  dataCompetencia?: string;
  origem?: OrigemContaReceber;
  formaRecebimento?: FormaRecebimentoContaReceber;
  contaBancariaId?: number;
  centroCustoId?: number;
  categoria?: string;
  documento?: string;
  observacoes?: string;
  anexos?: AnexoContaReceber[];
  dadosAdicionais?: Record<string, unknown>;

  // Relacionamentos opcionais
  clienteId?: number;
  contratoId?: number;
  acordoCondenacaoId?: number;
  parcelaId?: number;
  usuarioId?: number;

  // Recorrência
  recorrente?: boolean;
  frequenciaRecorrencia?: FrequenciaRecorrencia;
}

/**
 * DTO para atualizar conta a receber existente
 */
export interface AtualizarContaReceberDTO {
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  dataCompetencia?: string;
  formaRecebimento?: FormaRecebimentoContaReceber;
  contaBancariaId?: number | null;
  contaContabilId?: number;
  centroCustoId?: number | null;
  categoria?: string | null;
  documento?: string | null;
  observacoes?: string | null;
  anexos?: AnexoContaReceber[];
  dadosAdicionais?: Record<string, unknown>;
  clienteId?: number | null;
  contratoId?: number | null;
  recorrente?: boolean;
  frequenciaRecorrencia?: FrequenciaRecorrencia | null;
}

/**
 * DTO para efetuar recebimento de conta
 */
export interface ReceberContaReceberDTO {
  formaRecebimento: FormaRecebimentoContaReceber;
  contaBancariaId: number;
  dataEfetivacao?: string;
  observacoes?: string;
  comprovante?: AnexoContaReceber;
}

/**
 * DTO para cancelar conta
 */
export interface CancelarContaReceberDTO {
  motivo?: string;
  cancelarRecorrentes?: boolean;
}

// ============================================================================
// Parâmetros e Respostas
// ============================================================================

/**
 * Parâmetros para listagem de contas a receber
 */
export interface ListarContasReceberParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: StatusContaReceber | StatusContaReceber[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;
  clienteId?: number;
  contratoId?: number;
  contaContabilId?: number;
  centroCustoId?: number;
  contaBancariaId?: number;
  categoria?: string;
  origem?: OrigemContaReceber;
  recorrente?: boolean;
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de contas a receber
 */
export interface ListarContasReceberResponse {
  items: ContaReceberComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo?: {
    totalPendente: number;
    totalVencido: number;
    totalRecebido: number;
    valorTotalPendente: number;
    valorTotalVencido: number;
    valorTotalRecebido: number;
  };
}

/**
 * Resultado de operação em conta a receber
 */
export interface OperacaoContaReceberResult {
  sucesso: boolean;
  contaReceber?: ContaReceber;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Resultado da geração de contas recorrentes
 */
export interface GerarRecorrentesResult {
  sucesso: boolean;
  contasGeradas: ContaReceber[];
  total: number;
  erros?: Array<{
    templateId: number;
    erro: string;
  }>;
}

/**
 * Resumo de inadimplência (para alertas)
 */
export interface ResumoInadimplencia {
  vencidas: {
    quantidade: number;
    valorTotal: number;
    itens: ContaReceberComDetalhes[];
  };
  vencendoHoje: {
    quantidade: number;
    valorTotal: number;
    itens: ContaReceberComDetalhes[];
  };
  vencendoEm7Dias: {
    quantidade: number;
    valorTotal: number;
    itens: ContaReceberComDetalhes[];
  };
  vencendoEm30Dias: {
    quantidade: number;
    valorTotal: number;
    itens: ContaReceberComDetalhes[];
  };
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de contas a receber
 */
export interface ContasReceberFilters {
  busca?: string;
  status?: StatusContaReceber | StatusContaReceber[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  clienteId?: number;
  contratoId?: number;
  categoria?: string;
  contaContabilId?: number;
  centroCustoId?: number;
  recorrente?: boolean;
}

// ============================================================================
// Validadores e Type Guards
// ============================================================================

/**
 * Type guard para verificar se é uma ContaReceber válida
 */
export const isContaReceber = (obj: unknown): obj is ContaReceber => {
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
 * Validar dados de criação de conta a receber
 */
export const validarCriarContaReceberDTO = (data: unknown): data is CriarContaReceberDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarContaReceberDTO;

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
  if (dto.formaRecebimento !== undefined && !isFormaRecebimentoValida(dto.formaRecebimento)) {
    return false;
  }
  if (dto.frequenciaRecorrencia !== undefined && !isFrequenciaValida(dto.frequenciaRecorrencia)) {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de conta a receber
 */
export const validarAtualizarContaReceberDTO = (data: unknown): data is AtualizarContaReceberDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarContaReceberDTO;

  // Pelo menos um campo deve ser fornecido
  const temAlgumCampo =
    dto.descricao !== undefined ||
    dto.valor !== undefined ||
    dto.dataVencimento !== undefined ||
    dto.dataCompetencia !== undefined ||
    dto.formaRecebimento !== undefined ||
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
 * Validar dados de recebimento
 */
export const validarReceberContaReceberDTO = (data: unknown): data is ReceberContaReceberDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as ReceberContaReceberDTO;

  if (!isFormaRecebimentoValida(dto.formaRecebimento)) {
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

const ORIGENS_VALIDAS: OrigemContaReceber[] = [
  'manual',
  'acordo_judicial',
  'contrato',
  'importacao_bancaria',
  'recorrente',
];

const FORMAS_RECEBIMENTO_VALIDAS: FormaRecebimentoContaReceber[] = [
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

const STATUS_VALIDOS: StatusContaReceber[] = ['pendente', 'confirmado', 'cancelado', 'estornado'];

export const isOrigemValida = (origem: unknown): origem is OrigemContaReceber => {
  return typeof origem === 'string' && ORIGENS_VALIDAS.includes(origem as OrigemContaReceber);
};

export const isFormaRecebimentoValida = (fr: unknown): fr is FormaRecebimentoContaReceber => {
  return typeof fr === 'string' && FORMAS_RECEBIMENTO_VALIDAS.includes(fr as FormaRecebimentoContaReceber);
};

export const isFrequenciaValida = (freq: unknown): freq is FrequenciaRecorrencia => {
  return typeof freq === 'string' && FREQUENCIAS_VALIDAS.includes(freq as FrequenciaRecorrencia);
};

export const isStatusValido = (status: unknown): status is StatusContaReceber => {
  return typeof status === 'string' && STATUS_VALIDOS.includes(status as StatusContaReceber);
};

// ============================================================================
// Labels para UI
// ============================================================================

export const STATUS_LABELS: Record<StatusContaReceber, string> = {
  pendente: 'Pendente',
  confirmado: 'Recebido',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

export const ORIGEM_LABELS: Record<OrigemContaReceber, string> = {
  manual: 'Manual',
  acordo_judicial: 'Acordo Judicial',
  contrato: 'Contrato',
  importacao_bancaria: 'Importação Bancária',
  recorrente: 'Recorrente',
};

export const FORMA_RECEBIMENTO_LABELS: Record<FormaRecebimentoContaReceber, string> = {
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
  { value: 'honorarios_contratuais', label: 'Honorários Contratuais' },
  { value: 'honorarios_sucumbenciais', label: 'Honorários Sucumbenciais' },
  { value: 'honorarios_exito', label: 'Honorários de Êxito' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'assessoria', label: 'Assessoria' },
  { value: 'outros', label: 'Outros' },
];

export const CATEGORIA_LABELS: Record<CategoriaContaReceber, string> = {
  honorarios_contratuais: 'Honorários Contratuais',
  honorarios_sucumbenciais: 'Honorários Sucumbenciais',
  honorarios_exito: 'Honorários de Êxito',
  consultoria: 'Consultoria',
  assessoria: 'Assessoria',
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
export const isContaVencida = (conta: ContaReceber): boolean => {
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
export const isContaVenceHoje = (conta: ContaReceber): boolean => {
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
export const diasAteVencimento = (conta: ContaReceber): number | null => {
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
