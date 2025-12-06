/**
 * Types e interfaces para o módulo de RH - Salários e Folha de Pagamento
 * Sistema de Gestão Financeira (SGF)
 *
 * Salários são registros de remuneração fixa mensal dos funcionários.
 * Folhas de Pagamento consolidam os pagamentos mensais e integram com lançamentos financeiros.
 */

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

// ============================================================================
// Validadores e Type Guards
// ============================================================================

/**
 * Type guard para verificar se é um Salário válido
 */
export const isSalario = (obj: unknown): obj is Salario => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'usuarioId' in obj &&
    'salarioBruto' in obj &&
    'dataInicioVigencia' in obj &&
    'ativo' in obj
  );
};

/**
 * Type guard para verificar se é uma FolhaPagamento válida
 */
export const isFolhaPagamento = (obj: unknown): obj is FolhaPagamento => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'mesReferencia' in obj &&
    'anoReferencia' in obj &&
    'status' in obj &&
    'valorTotal' in obj
  );
};

/**
 * Validar dados de criação de salário
 */
export const validarCriarSalarioDTO = (data: unknown): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valido: false, erros: ['Dados inválidos'] };
  }

  const dto = data as CriarSalarioDTO;

  // Campos obrigatórios
  if (typeof dto.usuarioId !== 'number' || dto.usuarioId <= 0) {
    erros.push('ID do usuário é obrigatório e deve ser um número positivo');
  }
  if (typeof dto.salarioBruto !== 'number' || dto.salarioBruto <= 0) {
    erros.push('Salário bruto deve ser maior que zero');
  }
  if (!dto.dataInicioVigencia || typeof dto.dataInicioVigencia !== 'string') {
    erros.push('Data de início da vigência é obrigatória');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.dataInicioVigencia)) {
    erros.push('Data de início da vigência deve estar no formato YYYY-MM-DD');
  }

  // Campos opcionais com validação
  if (dto.cargoId !== undefined && dto.cargoId !== null) {
    if (typeof dto.cargoId !== 'number' || dto.cargoId <= 0) {
      erros.push('ID do cargo deve ser um número positivo');
    }
  }

  return { valido: erros.length === 0, erros };
};

/**
 * Validar dados de atualização de salário
 */
export const validarAtualizarSalarioDTO = (data: unknown): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valido: false, erros: ['Dados inválidos'] };
  }

  const dto = data as AtualizarSalarioDTO;

  // Pelo menos um campo deve ser fornecido
  const temAlgumCampo =
    dto.salarioBruto !== undefined ||
    dto.cargoId !== undefined ||
    dto.dataFimVigencia !== undefined ||
    dto.observacoes !== undefined ||
    dto.ativo !== undefined;

  if (!temAlgumCampo) {
    erros.push('Pelo menos um campo deve ser fornecido para atualização');
  }

  // Validar campos se fornecidos
  if (dto.salarioBruto !== undefined && (typeof dto.salarioBruto !== 'number' || dto.salarioBruto <= 0)) {
    erros.push('Salário bruto deve ser maior que zero');
  }
  if (dto.dataFimVigencia !== undefined && dto.dataFimVigencia !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.dataFimVigencia)) {
      erros.push('Data de fim da vigência deve estar no formato YYYY-MM-DD');
    }
  }

  return { valido: erros.length === 0, erros };
};

/**
 * Validar dados de geração de folha
 */
export const validarGerarFolhaDTO = (data: unknown): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valido: false, erros: ['Dados inválidos'] };
  }

  const dto = data as GerarFolhaDTO;

  // Campos obrigatórios
  if (typeof dto.mesReferencia !== 'number' || dto.mesReferencia < 1 || dto.mesReferencia > 12) {
    erros.push('Mês de referência deve ser um número entre 1 e 12');
  }
  if (typeof dto.anoReferencia !== 'number' || dto.anoReferencia < 2020) {
    erros.push('Ano de referência deve ser maior ou igual a 2020');
  }

  // Validar período não futuro
  if (dto.mesReferencia && dto.anoReferencia) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    if (dto.anoReferencia > anoAtual || (dto.anoReferencia === anoAtual && dto.mesReferencia > mesAtual)) {
      erros.push('Não é possível gerar folha para período futuro');
    }
  }

  // Campos opcionais com validação
  if (dto.dataPagamento !== undefined && dto.dataPagamento !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.dataPagamento)) {
      erros.push('Data de pagamento deve estar no formato YYYY-MM-DD');
    }
  }

  return { valido: erros.length === 0, erros };
};

/**
 * Validar dados de aprovação de folha
 */
export const validarAprovarFolhaDTO = (data: unknown): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valido: false, erros: ['Dados inválidos'] };
  }

  const dto = data as AprovarFolhaDTO;

  // Campos obrigatórios
  if (typeof dto.contaBancariaId !== 'number' || dto.contaBancariaId <= 0) {
    erros.push('Conta bancária é obrigatória');
  }
  if (typeof dto.contaContabilId !== 'number' || dto.contaContabilId <= 0) {
    erros.push('Conta contábil é obrigatória');
  }

  // Campos opcionais com validação
  if (dto.centroCustoId !== undefined && dto.centroCustoId !== null) {
    if (typeof dto.centroCustoId !== 'number' || dto.centroCustoId <= 0) {
      erros.push('ID do centro de custo deve ser um número positivo');
    }
  }

  return { valido: erros.length === 0, erros };
};

/**
 * Validar dados de pagamento de folha
 */
export const validarPagarFolhaDTO = (data: unknown): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valido: false, erros: ['Dados inválidos'] };
  }

  const dto = data as PagarFolhaDTO;

  // Campos obrigatórios
  if (!isFormaPagamentoFolhaValida(dto.formaPagamento)) {
    erros.push('Forma de pagamento inválida');
  }
  if (typeof dto.contaBancariaId !== 'number' || dto.contaBancariaId <= 0) {
    erros.push('Conta bancária é obrigatória');
  }

  // Campos opcionais com validação
  if (dto.dataEfetivacao !== undefined && dto.dataEfetivacao !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.dataEfetivacao)) {
      erros.push('Data de efetivação deve estar no formato YYYY-MM-DD');
    }
  }

  return { valido: erros.length === 0, erros };
};

// ============================================================================
// Helpers de Validação
// ============================================================================

const STATUS_FOLHA_VALIDOS: StatusFolhaPagamento[] = ['rascunho', 'aprovada', 'paga', 'cancelada'];

const FORMAS_PAGAMENTO_FOLHA_VALIDAS: FormaPagamentoFolha[] = [
  'transferencia_bancaria',
  'ted',
  'pix',
  'deposito',
  'dinheiro',
];

export const isStatusFolhaValido = (status: unknown): status is StatusFolhaPagamento => {
  return typeof status === 'string' && STATUS_FOLHA_VALIDOS.includes(status as StatusFolhaPagamento);
};

export const isFormaPagamentoFolhaValida = (fp: unknown): fp is FormaPagamentoFolha => {
  return typeof fp === 'string' && FORMAS_PAGAMENTO_FOLHA_VALIDAS.includes(fp as FormaPagamentoFolha);
};

/**
 * Verifica se a transição de status é válida
 */
export const isTransicaoStatusValida = (
  statusAtual: StatusFolhaPagamento,
  novoStatus: StatusFolhaPagamento
): boolean => {
  const transicoesValidas: Record<StatusFolhaPagamento, StatusFolhaPagamento[]> = {
    rascunho: ['aprovada', 'cancelada'],
    aprovada: ['paga', 'cancelada'],
    paga: [], // Não pode mudar de paga
    cancelada: [], // Não pode mudar de cancelada
  };

  return transicoesValidas[statusAtual]?.includes(novoStatus) ?? false;
};

// ============================================================================
// Labels para UI
// ============================================================================

export const STATUS_FOLHA_LABELS: Record<StatusFolhaPagamento, string> = {
  rascunho: 'Rascunho',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export const FORMA_PAGAMENTO_FOLHA_LABELS: Record<FormaPagamentoFolha, string> = {
  transferencia_bancaria: 'Transferência Bancária',
  ted: 'TED',
  pix: 'PIX',
  deposito: 'Depósito',
  dinheiro: 'Dinheiro',
};

export const MESES_LABELS: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

/**
 * Lista de meses para selects em formulários
 */
export const MESES_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

// ============================================================================
// Helpers de Cálculo e Formatação
// ============================================================================

/**
 * Formata o período como string (ex: "Janeiro/2025")
 */
export const formatarPeriodo = (mes: number, ano: number): string => {
  return `${MESES_LABELS[mes] ?? mes}/${ano}`;
};

/**
 * Valida se um período é válido
 */
export const validarPeriodoFolha = (mes: number, ano: number): { valido: boolean; erro?: string } => {
  if (mes < 1 || mes > 12) {
    return { valido: false, erro: 'Mês deve estar entre 1 e 12' };
  }
  if (ano < 2020) {
    return { valido: false, erro: 'Ano deve ser maior ou igual a 2020' };
  }

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  if (ano > anoAtual || (ano === anoAtual && mes > mesAtual)) {
    return { valido: false, erro: 'Não é possível gerar folha para período futuro' };
  }

  return { valido: true };
};

/**
 * Retorna o último dia do mês
 */
export const ultimoDiaDoMes = (mes: number, ano: number): string => {
  const data = new Date(ano, mes, 0); // Dia 0 do próximo mês = último dia do mês atual
  return data.toISOString().split('T')[0];
};

/**
 * Retorna o primeiro dia do mês
 */
export const primeiroDiaDoMes = (mes: number, ano: number): string => {
  const data = new Date(ano, mes - 1, 1);
  return data.toISOString().split('T')[0];
};

/**
 * Verifica se uma data está dentro de um período
 */
export const dataEstaNoPeriodo = (
  data: string,
  dataInicio: string,
  dataFim: string | null
): boolean => {
  const d = new Date(data);
  const inicio = new Date(dataInicio);

  if (d < inicio) {
    return false;
  }

  if (dataFim) {
    const fim = new Date(dataFim);
    return d <= fim;
  }

  return true; // Se não tem data fim, está vigente
};

/**
 * Calcula a duração em meses de uma vigência
 */
export const calcularDuracaoVigencia = (
  dataInicio: string,
  dataFim: string | null
): { meses: number; texto: string } => {
  const inicio = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();

  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const meses = Math.floor(diffDays / 30);

  if (meses < 1) {
    return { meses: 0, texto: 'Menos de 1 mês' };
  } else if (meses === 1) {
    return { meses: 1, texto: '1 mês' };
  } else if (meses < 12) {
    return { meses, texto: `${meses} meses` };
  } else {
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    if (mesesRestantes === 0) {
      return { meses, texto: anos === 1 ? '1 ano' : `${anos} anos` };
    }
    return {
      meses,
      texto: `${anos === 1 ? '1 ano' : `${anos} anos`} e ${mesesRestantes === 1 ? '1 mês' : `${mesesRestantes} meses`}`
    };
  }
};

/**
 * Retorna o sal rio vigente para um usu rio em uma data de referˆncia a partir de uma lista
 */
export const calcularSalarioVigente = (
  salarios: Salario[],
  usuarioId: number,
  dataReferencia: string = new Date().toISOString().split('T')[0]
): Salario | null => {
  const vigentes = salarios
    .filter((salario) => salario.usuarioId === usuarioId && salario.ativo)
    .filter((salario) =>
      dataEstaNoPeriodo(
        dataReferencia,
        salario.dataInicioVigencia,
        salario.dataFimVigencia
      )
    )
    .sort(
      (a, b) =>
        new Date(b.dataInicioVigencia).getTime() -
        new Date(a.dataInicioVigencia).getTime()
    );

  return vigentes[0] ?? null;
};

/**
 * Cores para badges de status da folha
 */
export const STATUS_FOLHA_CORES: Record<StatusFolhaPagamento, { bg: string; text: string; border: string }> = {
  rascunho: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  aprovada: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  paga: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};
