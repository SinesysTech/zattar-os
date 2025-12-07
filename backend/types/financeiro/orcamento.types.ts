/**
 * Types e interfaces para o módulo de Orçamento Empresarial
 * Sistema de Gestão Financeira (SGF)
 *
 * Orçamentos permitem planejar receitas e despesas por período,
 * comparar com valores realizados e identificar desvios.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status do orçamento (mapeado de status_orcamento)
 * Fluxo: rascunho → aprovado → em_execucao → encerrado
 */
export type StatusOrcamento = 'rascunho' | 'aprovado' | 'em_execucao' | 'encerrado';

/**
 * Período do orçamento (mapeado de periodo_orcamento)
 */
export type PeriodoOrcamento = 'mensal' | 'trimestral' | 'semestral' | 'anual';

/**
 * Status de um item de análise orçamentária
 */
export type StatusItemAnalise = 'dentro' | 'atencao' | 'critico';

/**
 * Severidade de alertas
 */
export type SeveridadeAlerta = 'info' | 'warning' | 'error';

/**
 * Tendência de projeção
 */
export type TendenciaProjecao = 'positiva' | 'neutra' | 'negativa';

// ============================================================================
// Interfaces de Relacionamentos (Resumos)
// ============================================================================

/**
 * Dados resumidos de conta contábil
 */
export interface ContaContabilResumo {
  id: number;
  codigo: string;
  nome: string;
  tipoConta?: string;
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
 * Dados resumidos de usuário
 */
export interface UsuarioResumo {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string;
}

// ============================================================================
// Interfaces Principais
// ============================================================================

/**
 * Interface principal de Orçamento
 */
export interface Orcamento {
  id: number;
  nome: string;
  descricao: string | null;
  ano: number;
  periodo: PeriodoOrcamento;
  dataInicio: string;
  dataFim: string;
  status: StatusOrcamento;
  observacoes: string | null;
  createdBy: number | null;
  aprovadoPor: number | null;
  aprovadoEm: string | null;
  iniciadoPor: number | null;
  iniciadoEm: string | null;
  encerradoPor: number | null;
  encerradoEm: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de Item de Orçamento
 */
export interface OrcamentoItem {
  id: number;
  orcamentoId: number;
  contaContabilId: number;
  centroCustoId: number | null;
  mes: number | null; // 1-12 ou null para período todo
  valorOrcado: number;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de Item de Orçamento com detalhes
 */
export interface OrcamentoItemComDetalhes extends OrcamentoItem {
  contaContabil?: ContaContabilResumo;
  centroCusto?: CentroCustoResumo;
}

/**
 * Interface de Orçamento com itens
 */
export interface OrcamentoComItens extends Orcamento {
  itens: OrcamentoItem[];
  totalOrcado?: number;
}

/**
 * Interface de Orçamento com detalhes completos
 */
export interface OrcamentoComDetalhes extends Orcamento {
  itens: OrcamentoItemComDetalhes[];
  totalOrcado: number;
  criadoPor?: UsuarioResumo;
  aprovadoPorUsuario?: UsuarioResumo;
  iniciadoPorUsuario?: UsuarioResumo;
  encerradoPorUsuario?: UsuarioResumo;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para criar novo orçamento
 */
export interface CriarOrcamentoDTO {
  nome: string;
  descricao?: string;
  ano: number;
  periodo: PeriodoOrcamento;
  dataInicio: string;
  dataFim: string;
  observacoes?: string;
}

/**
 * DTO para atualizar orçamento existente
 */
export interface AtualizarOrcamentoDTO {
  nome?: string;
  descricao?: string | null;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string | null;
}

/**
 * DTO para criar item de orçamento
 */
export interface CriarOrcamentoItemDTO {
  contaContabilId: number;
  centroCustoId?: number;
  mes?: number; // 1-12 ou undefined para período todo
  valorOrcado: number;
  observacoes?: string;
}

/**
 * DTO para atualizar item de orçamento
 */
export interface AtualizarOrcamentoItemDTO {
  contaContabilId?: number;
  centroCustoId?: number | null;
  mes?: number | null;
  valorOrcado?: number;
  observacoes?: string | null;
}

/**
 * DTO para aprovar orçamento
 */
export interface AprovarOrcamentoDTO {
  observacoes?: string;
}

/**
 * DTO para iniciar execução do orçamento
 */
export interface IniciarExecucaoDTO {
  dataInicio?: string;
}

/**
 * DTO para encerrar orçamento
 */
export interface EncerrarOrcamentoDTO {
  dataFim?: string;
  observacoes?: string;
}

/**
 * DTO para duplicar orçamento
 */
export interface DuplicarOrcamentoDTO {
  novoAno: number;
  novoPeriodo?: PeriodoOrcamento;
  ajustePercentual?: number; // ex: 5 para +5%
}

// ============================================================================
// Interfaces de Análise
// ============================================================================

/**
 * Resumo consolidado do orçamento
 */
export interface ResumoOrcamentario {
  totalOrcado: number;
  totalRealizado: number;
  variacao: number; // absoluta
  variacaoPercentual: number;
  percentualRealizacao: number;
}

/**
 * Item de análise orçamentária
 */
export interface ItemAnalise {
  contaContabilId: number;
  contaContabilCodigo: string;
  contaContabilNome: string;
  tipoConta: string;
  centroCustoId: number | null;
  centroCustoCodigo: string | null;
  centroCustoNome: string | null;
  mes: number | null;
  valorOrcado: number;
  valorRealizado: number;
  variacao: number;
  variacaoPercentual: number;
  percentualRealizacao: number;
  status: StatusItemAnalise;
}

/**
 * Alerta de desvio orçamentário
 */
export interface AlertaOrcamentario {
  tipo: 'desvio_positivo' | 'desvio_negativo' | 'nao_iniciado' | 'atrasado';
  mensagem: string;
  severidade: SeveridadeAlerta;
  contaContabilId?: number;
  contaContabilCodigo?: string;
  contaContabilNome?: string;
  centroCustoId?: number;
  valorOrcado?: number;
  valorRealizado?: number;
  variacaoPercentual?: number;
}

/**
 * Projeção orçamentária
 */
export interface ProjecaoOrcamentaria {
  periodo: string;
  valorProjetado: number;
  baseadoEmMeses: number;
  tendencia: TendenciaProjecao;
  confiabilidade: number; // 0-100%
}

/**
 * Evolução mensal do orçamento
 */
export interface EvolucaoMensal {
  mes: number;
  mesNome: string;
  valorOrcado: number;
  valorRealizado: number;
  variacao: number;
  variacaoPercentual: number;
  acumuladoOrcado: number;
  acumuladoRealizado: number;
}

/**
 * Análise orçamentária completa
 */
export interface AnaliseOrcamentaria {
  orcamento: Orcamento;
  periodo: {
    dataInicio: string;
    dataFim: string;
    mesesTotal: number;
    mesesDecorridos: number;
  };
  resumo: ResumoOrcamentario;
  itensPorConta: ItemAnalise[];
  itensPorCentro: ItemAnalise[];
  evolucaoMensal: EvolucaoMensal[];
  alertas: AlertaOrcamentario[];
  projecao?: ProjecaoOrcamentaria;
}

/**
 * Item de análise orçamentária para tabelas (com objetos aninhados)
 * Usado em componentes de UI
 */
export interface AnaliseOrcamentariaItem {
  id: number;
  contaContabil?: {
    id: number;
    codigo: string;
    nome: string;
  };
  centroCusto?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
  mes?: number | null;
  valorOrcado: number;
  valorRealizado: number;
  variacao: number;
  variacaoPercentual: number;
  percentualRealizacao: number;
  status: 'dentro_orcamento' | 'atencao' | 'estourado';
}

/**
 * Alerta de desvio orçamentário para UI
 */
export interface AlertaDesvio {
  contaContabil: string;
  centroCusto?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  mensagem: string;
  valorOrcado: number;
  valorRealizado: number;
  variacao: number;
}

/**
 * Item de projeção orçamentária para tabelas
 */
export interface ProjecaoItem {
  contaContabil: string;
  centroCusto?: string;
  realizadoAtual: number;
  projecaoFinal: number;
  variacaoProjetada: number;
  tendencia: 'alta' | 'estavel' | 'baixa';
}

/**
 * Comparativo entre orçamentos
 */
export interface ComparativoOrcamento {
  orcamentoId: number;
  orcamentoNome: string;
  ano: number;
  periodo: PeriodoOrcamento;
  totalOrcado: number;
  totalRealizado: number;
  variacao: number;
  percentualRealizacao: number;
}

// ============================================================================
// Parâmetros e Respostas
// ============================================================================

/**
 * Parâmetros para listagem de orçamentos
 */
export interface ListarOrcamentosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ano?: number;
  periodo?: PeriodoOrcamento;
  status?: StatusOrcamento | StatusOrcamento[];
  ordenarPor?: 'nome' | 'ano' | 'periodo' | 'status' | 'data_inicio' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de orçamentos
 */
export interface ListarOrcamentosResponse {
  items: OrcamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

/**
 * Parâmetros para buscar análise orçamentária
 */
export interface BuscarAnaliseParams {
  orcamentoId: number;
  mes?: number;
  contaContabilId?: number;
  centroCustoId?: number;
}

/**
 * Parâmetros para buscar itens de orçamento
 */
export interface BuscarItensParams {
  contaContabilId?: number;
  centroCustoId?: number;
  mes?: number;
}

/**
 * Resultado de operação em orçamento
 */
export interface OperacaoOrcamentoResult {
  sucesso: boolean;
  orcamento?: Orcamento;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Resultado de operação em item de orçamento
 */
export interface OperacaoItemResult {
  sucesso: boolean;
  item?: OrcamentoItem;
  erro?: string;
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de orçamentos
 */
export interface OrcamentosFilters {
  busca?: string;
  ano?: number;
  periodo?: PeriodoOrcamento;
  status?: StatusOrcamento | StatusOrcamento[];
}

// ============================================================================
// Validadores e Type Guards
// ============================================================================

/**
 * Type guard para verificar se é um Orcamento válido
 */
export const isOrcamento = (obj: unknown): obj is Orcamento => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'nome' in obj &&
    'ano' in obj &&
    'periodo' in obj &&
    'status' in obj &&
    'dataInicio' in obj &&
    'dataFim' in obj
  );
};

/**
 * Type guard para verificar se é um OrcamentoItem válido
 */
export const isOrcamentoItem = (obj: unknown): obj is OrcamentoItem => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'orcamentoId' in obj &&
    'contaContabilId' in obj &&
    'valorOrcado' in obj
  );
};

/**
 * Validar dados de criação de orçamento
 */
export const validarCriarOrcamentoDTO = (data: unknown): data is CriarOrcamentoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarOrcamentoDTO;

  // Campos obrigatórios
  if (!dto.nome || typeof dto.nome !== 'string' || dto.nome.trim() === '') {
    return false;
  }
  if (typeof dto.ano !== 'number' || dto.ano < 2020 || dto.ano > 2100) {
    return false;
  }
  if (!dto.periodo || !isPeriodoValido(dto.periodo)) {
    return false;
  }
  if (!dto.dataInicio || typeof dto.dataInicio !== 'string') {
    return false;
  }
  if (!dto.dataFim || typeof dto.dataFim !== 'string') {
    return false;
  }

  // Validar que dataFim > dataInicio
  if (new Date(dto.dataFim) <= new Date(dto.dataInicio)) {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de orçamento
 */
export const validarAtualizarOrcamentoDTO = (data: unknown): data is AtualizarOrcamentoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarOrcamentoDTO;

  // Pelo menos um campo deve ser fornecido
  if (
    dto.nome === undefined &&
    dto.descricao === undefined &&
    dto.dataInicio === undefined &&
    dto.dataFim === undefined &&
    dto.observacoes === undefined
  ) {
    return false;
  }

  // Validar campos se fornecidos
  if (dto.nome !== undefined && (typeof dto.nome !== 'string' || dto.nome.trim() === '')) {
    return false;
  }

  return true;
};

/**
 * Validar dados de criação de item de orçamento
 */
export const validarCriarOrcamentoItemDTO = (data: unknown): data is CriarOrcamentoItemDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarOrcamentoItemDTO;

  // Campos obrigatórios
  if (typeof dto.contaContabilId !== 'number' || dto.contaContabilId <= 0) {
    return false;
  }
  if (typeof dto.valorOrcado !== 'number' || dto.valorOrcado < 0) {
    return false;
  }

  // Campos opcionais com validação
  if (dto.mes !== undefined && (typeof dto.mes !== 'number' || dto.mes < 1 || dto.mes > 12)) {
    return false;
  }
  if (dto.centroCustoId !== undefined && dto.centroCustoId !== null && typeof dto.centroCustoId !== 'number') {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de item de orçamento
 */
export const validarAtualizarOrcamentoItemDTO = (data: unknown): data is AtualizarOrcamentoItemDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarOrcamentoItemDTO;

  // Pelo menos um campo deve ser fornecido
  if (
    dto.contaContabilId === undefined &&
    dto.centroCustoId === undefined &&
    dto.mes === undefined &&
    dto.valorOrcado === undefined &&
    dto.observacoes === undefined
  ) {
    return false;
  }

  // Validar campos se fornecidos
  if (dto.valorOrcado !== undefined && (typeof dto.valorOrcado !== 'number' || dto.valorOrcado < 0)) {
    return false;
  }
  if (dto.mes !== undefined && dto.mes !== null && (typeof dto.mes !== 'number' || dto.mes < 1 || dto.mes > 12)) {
    return false;
  }

  return true;
};

// ============================================================================
// Helpers de Validação
// ============================================================================

const STATUS_VALIDOS: StatusOrcamento[] = ['rascunho', 'aprovado', 'em_execucao', 'encerrado'];
const PERIODOS_VALIDOS: PeriodoOrcamento[] = ['mensal', 'trimestral', 'semestral', 'anual'];

export const isStatusValido = (status: unknown): status is StatusOrcamento => {
  return typeof status === 'string' && STATUS_VALIDOS.includes(status as StatusOrcamento);
};

export const isPeriodoValido = (periodo: unknown): periodo is PeriodoOrcamento => {
  return typeof periodo === 'string' && PERIODOS_VALIDOS.includes(periodo as PeriodoOrcamento);
};

/**
 * Valida transição de status
 */
export const isTransicaoStatusValida = (
  statusAtual: StatusOrcamento,
  statusNovo: StatusOrcamento
): boolean => {
  const transicoesPermitidas: Record<StatusOrcamento, StatusOrcamento[]> = {
    rascunho: ['aprovado'],
    aprovado: ['em_execucao', 'rascunho'], // pode voltar para rascunho se não iniciado
    em_execucao: ['encerrado'],
    encerrado: [], // estado final
  };

  return transicoesPermitidas[statusAtual]?.includes(statusNovo) ?? false;
};

// ============================================================================
// Labels para UI
// ============================================================================

export const STATUS_LABELS: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  em_execucao: 'Em Execução',
  encerrado: 'Encerrado',
};

export const PERIODO_LABELS: Record<PeriodoOrcamento, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const STATUS_ITEM_LABELS: Record<StatusItemAnalise, string> = {
  dentro: 'Dentro do Orçamento',
  atencao: 'Atenção',
  critico: 'Crítico',
};

export const SEVERIDADE_LABELS: Record<SeveridadeAlerta, string> = {
  info: 'Informação',
  warning: 'Atenção',
  error: 'Crítico',
};

export const TENDENCIA_LABELS: Record<TendenciaProjecao, string> = {
  positiva: 'Positiva',
  neutra: 'Neutra',
  negativa: 'Negativa',
};

/**
 * Cores para status do orçamento (para badges)
 */
export const STATUS_COLORS: Record<StatusOrcamento, string> = {
  rascunho: 'gray',
  aprovado: 'blue',
  em_execucao: 'green',
  encerrado: 'red',
};

/**
 * Cores para status de item de análise
 */
export const STATUS_ITEM_COLORS: Record<StatusItemAnalise, string> = {
  dentro: 'green',
  atencao: 'yellow',
  critico: 'red',
};

/**
 * Lista de meses para seleção
 */
export const MESES: Array<{ value: number; label: string }> = [
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
// Helpers de Cálculo
// ============================================================================

/**
 * Calcula variação entre orçado e realizado
 */
export const calcularVariacao = (
  orcado: number,
  realizado: number
): { absoluta: number; percentual: number; status: StatusItemAnalise } => {
  const absoluta = orcado - realizado;
  const percentual = orcado === 0 ? 0 : ((realizado - orcado) / orcado) * 100;
  const percentualAbsoluto = Math.abs(percentual);

  let status: StatusItemAnalise;
  if (percentualAbsoluto <= 10) {
    status = 'dentro';
  } else if (percentualAbsoluto <= 20) {
    status = 'atencao';
  } else {
    status = 'critico';
  }

  return { absoluta, percentual, status };
};

/**
 * Calcula projeção baseada em meses realizados
 */
export const calcularProjecao = (
  valorRealizado: number,
  mesesRealizados: number,
  mesesTotais: number
): { valorProjetado: number; confiabilidade: number } => {
  if (mesesRealizados === 0) {
    return { valorProjetado: 0, confiabilidade: 0 };
  }

  const mediaMensal = valorRealizado / mesesRealizados;
  const valorProjetado = mediaMensal * mesesTotais;
  const confiabilidade = Math.min(100, (mesesRealizados / mesesTotais) * 100);

  return { valorProjetado, confiabilidade };
};

/**
 * Determina tendência baseada em variação
 */
export const determinarTendencia = (variacaoPercentual: number): TendenciaProjecao => {
  if (variacaoPercentual < -5) {
    return 'negativa';
  } else if (variacaoPercentual > 5) {
    return 'positiva';
  }
  return 'neutra';
};

/**
 * Calcula número de meses entre duas datas
 */
export const calcularMesesEntreDatas = (dataInicio: string, dataFim: string): number => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()) + 1;
  return Math.max(1, meses);
};

/**
 * Calcula meses decorridos desde o início do orçamento até hoje
 */
export const calcularMesesDecorridos = (dataInicio: string, dataFim: string): number => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const hoje = new Date();

  if (hoje < inicio) {
    return 0;
  }
  if (hoje > fim) {
    return calcularMesesEntreDatas(dataInicio, dataFim);
  }

  return (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1;
};

/**
 * Obtém nome do mês
 */
export const getNomeMes = (mes: number): string => {
  return MESES.find((m) => m.value === mes)?.label ?? '';
};

/**
 * Gera anos para seleção (últimos 2 + próximos 3)
 */
export const gerarAnosParaSelecao = (): number[] => {
  const anoAtual = new Date().getFullYear();
  return [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2, anoAtual + 3];
};
