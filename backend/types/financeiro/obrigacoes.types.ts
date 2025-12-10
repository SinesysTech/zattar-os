/**
 * Types e interfaces para o módulo de Obrigações Financeiras
 * Sistema de Gestão Financeira (SGF)
 *
 * Obrigações são uma visão unificada que consolida:
 * - Parcelas de acordos/condenações (recebimentos e pagamentos)
 * - Contas a receber (lançamentos do tipo 'receita')
 * - Contas a pagar (lançamentos do tipo 'despesa')
 *
 * Este módulo atua como ponte/adapter entre acordos judiciais e o sistema financeiro,
 * permitindo visualização consolidada e sincronização bidirecional.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Tipo da obrigação financeira
 * Define a natureza e origem da obrigação
 */
export type TipoObrigacao =
  | 'acordo_recebimento'   // Parcela de acordo judicial a receber
  | 'acordo_pagamento'     // Parcela de acordo judicial a pagar
  | 'conta_receber'        // Conta a receber avulsa (não vinculada a acordo)
  | 'conta_pagar';         // Conta a pagar avulsa (não vinculada a acordo)

/**
 * Status unificado da obrigação
 * Mapeamento dos diferentes status das entidades originais
 */
export type StatusObrigacao =
  | 'pendente'     // Aguardando vencimento/efetivação
  | 'vencida'      // Passou da data de vencimento sem efetivação
  | 'efetivada'    // Recebida/paga com sucesso
  | 'cancelada'    // Cancelada antes da efetivação
  | 'estornada';   // Estornada após efetivação

/**
 * Origem da obrigação no sistema
 */
export type OrigemObrigacao =
  | 'acordo_judicial'      // Criada via acordo/condenação
  | 'manual'               // Criada manualmente
  | 'contrato'             // Vinculada a contrato
  | 'recorrente'           // Gerada automaticamente por recorrência
  | 'importacao_bancaria'  // Importada de extrato bancário
  | 'folha_pagamento';     // Gerada via folha de pagamento

/**
 * Status de sincronização com o sistema financeiro
 */
export type StatusSincronizacao =
  | 'sincronizado'       // Lançamento financeiro existe e está consistente
  | 'pendente'           // Aguardando sincronização (parcela não efetivada)
  | 'inconsistente'      // Divergência entre parcela e lançamento
  | 'nao_aplicavel';     // Não requer sincronização (ex: conta avulsa)

/**
 * Status do repasse ao cliente (Split de Pagamento)
 */
export type StatusRepasse =
  | 'pendente_transferencia'  // Recebido no escritório, aguardando repasse
  | 'repassado'               // Transferido para o cliente
  | 'nao_aplicavel'           // Não é acordo de recebimento ou sem valor cliente
  | 'aguardando_recebimento'; // Ainda não recebido do devedor (status parcela != recebida/paga)


// ============================================================================
// Interfaces de Resumo (Relacionamentos)
// ============================================================================

/**
 * Dados resumidos de cliente
 */
export interface ClienteResumoObrigacao {
  id: number;
  nome: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cpfCnpj: string | null;
  tipoPessoa: 'fisica' | 'juridica';
}

/**
 * Dados resumidos de processo/acervo
 */
export interface ProcessoResumoObrigacao {
  id: number;
  numeroProcesso: string;
  autor: string | null;
  reu: string | null;
  vara: string | null;
  tribunal: string | null;
}

/**
 * Dados resumidos do acordo/condenação
 */
export interface AcordoResumoObrigacao {
  id: number;
  tipo: 'acordo' | 'condenacao';
  direcao: 'recebimento' | 'pagamento';
  valorTotal: number;
  numeroParcelas: number;
  status: string;
}

/**
 * Dados resumidos de parcela do acordo
 */
export interface ParcelaResumoObrigacao {
  id: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosContratuais: number | null;
  honorariosSucumbenciais: number | null;
  dataVencimento: string;
  dataEfetivacao: string | null;
  status: string;
  formaPagamento: string | null;
  statusRepasse: StatusRepasse;
  valorRepasseCliente: number | null;
  declaracaoPrestacaoContasUrl: string | null;
  comprovanteRepasseUrl: string | null;
  dataRepasse: string | null;
}

/**
 * Dados resumidos de conta contábil
 */
export interface ContaContabilResumoObrigacao {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Dados resumidos de lançamento financeiro vinculado
 */
export interface LancamentoResumoObrigacao {
  id: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  dataLancamento: string;
  dataVencimento: string | null;
  dataEfetivacao: string | null;
  status: string;
}

// ============================================================================
// Interface Principal: Obrigação
// ============================================================================

/**
 * Interface unificada de Obrigação Financeira
 * Representa qualquer obrigação do sistema (acordo, conta a pagar/receber)
 */
export interface Obrigacao {
  // Identificação única composta
  id: string;                          // ID único composto (ex: "parcela_123", "lancamento_456")
  tipoEntidade: 'parcela' | 'lancamento'; // Tipo da entidade origem
  entidadeId: number;                  // ID na tabela de origem

  // Classificação
  tipo: TipoObrigacao;
  status: StatusObrigacao;
  origem: OrigemObrigacao;
  statusSincronizacao: StatusSincronizacao;

  // Dados principais
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataEfetivacao: string | null;
  dataLancamento: string;
  dataCompetencia: string;

  // Indicadores calculados
  diasAteVencimento: number | null;    // Negativo se vencido
  percentualHonorarios: number | null; // Para acordos

  // Relacionamentos (IDs)
  clienteId: number | null;
  processoId: number | null;
  acordoId: number | null;
  parcelaId: number | null;
  lancamentoId: number | null;
  contaContabilId: number | null;
  centroCustoId: number | null;
  contaBancariaId: number | null;

  // Metadados
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
}

/**
 * Interface de Obrigação com dados relacionados expandidos
 * Usada para exibição em detalhes e relatórios
 */
export interface ObrigacaoComDetalhes extends Obrigacao {
  cliente?: ClienteResumoObrigacao;
  processo?: ProcessoResumoObrigacao;
  acordo?: AcordoResumoObrigacao;
  parcela?: ParcelaResumoObrigacao;
  lancamento?: LancamentoResumoObrigacao;
  contaContabil?: ContaContabilResumoObrigacao;
}

// ============================================================================
// DTOs de Listagem e Filtros
// ============================================================================

/**
 * Parâmetros para listagem de obrigações
 */
export interface ListarObrigacoesParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros de tipo
  tipos?: TipoObrigacao[];
  status?: StatusObrigacao[];
  origens?: OrigemObrigacao[];
  statusSincronizacao?: StatusSincronizacao[];

  // Filtros de data
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;

  // Filtros de relacionamento
  clienteId?: number;
  processoId?: number;
  acordoId?: number;
  contaContabilId?: number;
  centroCustoId?: number;

  // Busca textual
  busca?: string;

  // Ordenação
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'tipo' | 'created_at';
  ordem?: 'asc' | 'desc';

  // Flags especiais
  apenasVencidas?: boolean;
  apenasInconsistentes?: boolean;
}

/**
 * Resumo financeiro por tipo de obrigação
 */
export interface ResumoObrigacoesPorTipo {
  tipo: TipoObrigacao;
  totalPendente: number;
  totalVencido: number;
  totalEfetivado: number;
  valorTotalPendente: number;
  valorTotalVencido: number;
  valorTotalEfetivado: number;
}

/**
 * Resumo consolidado de obrigações
 */
export interface ResumoObrigacoes {
  // Totais gerais
  totalObrigacoes: number;
  valorTotal: number;

  // Por status
  pendentes: {
    quantidade: number;
    valor: number;
  };
  vencidas: {
    quantidade: number;
    valor: number;
  };
  efetivadas: {
    quantidade: number;
    valor: number;
  };
  vencendoHoje: {
    quantidade: number;
    valor: number;
  };
  vencendoEm7Dias: {
    quantidade: number;
    valor: number;
  };

  // Por tipo
  porTipo: ResumoObrigacoesPorTipo[];

  // Sincronização
  sincronizacao: {
    sincronizados: number;
    pendentes: number;
    inconsistentes: number;
  };

  // Período de referência
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Resposta paginada de listagem de obrigações
 */
export interface ListarObrigacoesResponse {
  items: ObrigacaoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo: ResumoObrigacoes;
}

// ============================================================================
// DTOs de Sincronização
// ============================================================================

/**
 * Parâmetros para sincronização de obrigações
 */
export interface SincronizarObrigacoesParams {
  acordoId?: number;
  parcelaId?: number;
  forcar?: boolean; // Recria lançamentos mesmo se já existirem
}

/**
 * Resultado de item de sincronização
 */
export interface ItemSincronizacaoResult {
  parcelaId: number;
  lancamentoId?: number;
  sucesso: boolean;
  acao: 'criado' | 'atualizado' | 'ignorado' | 'erro';
  mensagem?: string;
}

/**
 * Resultado de sincronização
 */
export interface SincronizarObrigacoesResult {
  sucesso: boolean;
  totalProcessados: number;
  totalSucessos: number;
  totalErros: number;
  itens: ItemSincronizacaoResult[];
  erros: string[];
  warnings: string[];
}

/**
 * Inconsistência detectada na sincronização
 */
export interface InconsistenciaObrigacao {
  tipo: 'parcela_sem_lancamento' | 'lancamento_sem_parcela' | 'valor_divergente' | 'status_divergente';
  descricao: string;
  parcelaId?: number;
  lancamentoId?: number;
  valorParcela?: number;
  valorLancamento?: number;
  statusParcela?: string;
  statusLancamento?: string;
  sugestao: string;
}

/**
 * Resultado de verificação de consistência
 */
export interface VerificarConsistenciaResult {
  acordoId: number;
  consistente: boolean;
  totalInconsistencias: number;
  inconsistencias: InconsistenciaObrigacao[];
  // Contagens reais de parcelas para exibição na UI
  totalParcelas: number;
  parcelasSincronizadas: number;
  parcelasPendentes: number;
  parcelasInconsistentes: number;
}

// ============================================================================
// Type Guards e Validadores
// ============================================================================

/**
 * Type guard para verificar se é uma Obrigação válida
 */
export const isObrigacao = (obj: unknown): obj is Obrigacao => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'tipo' in obj &&
    'status' in obj &&
    'descricao' in obj &&
    'valor' in obj &&
    'dataVencimento' in obj
  );
};

/**
 * Verifica se o tipo de obrigação é válido
 */
const TIPOS_OBRIGACAO: TipoObrigacao[] = [
  'acordo_recebimento',
  'acordo_pagamento',
  'conta_receber',
  'conta_pagar',
];

export const isTipoObrigacaoValido = (tipo: unknown): tipo is TipoObrigacao => {
  return typeof tipo === 'string' && TIPOS_OBRIGACAO.includes(tipo as TipoObrigacao);
};

/**
 * Verifica se o status de obrigação é válido
 */
const STATUS_OBRIGACAO: StatusObrigacao[] = [
  'pendente',
  'vencida',
  'efetivada',
  'cancelada',
  'estornada',
];

export const isStatusObrigacaoValido = (status: unknown): status is StatusObrigacao => {
  return typeof status === 'string' && STATUS_OBRIGACAO.includes(status as StatusObrigacao);
};

/**
 * Verifica se a origem de obrigação é válida
 */
const ORIGENS_OBRIGACAO: OrigemObrigacao[] = [
  'acordo_judicial',
  'manual',
  'contrato',
  'recorrente',
  'importacao_bancaria',
  'folha_pagamento',
];

export const isOrigemObrigacaoValida = (origem: unknown): origem is OrigemObrigacao => {
  return typeof origem === 'string' && ORIGENS_OBRIGACAO.includes(origem as OrigemObrigacao);
};

/**
 * Validar parâmetros de listagem de obrigações
 */
export const validarListarObrigacoesParams = (params: unknown): params is ListarObrigacoesParams => {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as ListarObrigacoesParams;

  // Validar paginação
  if (p.pagina !== undefined && (typeof p.pagina !== 'number' || p.pagina < 1)) {
    return false;
  }
  if (p.limite !== undefined && (typeof p.limite !== 'number' || p.limite < 1 || p.limite > 100)) {
    return false;
  }

  // Validar tipos
  if (p.tipos !== undefined) {
    if (!Array.isArray(p.tipos) || !p.tipos.every(isTipoObrigacaoValido)) {
      return false;
    }
  }

  // Validar status
  if (p.status !== undefined) {
    if (!Array.isArray(p.status) || !p.status.every(isStatusObrigacaoValido)) {
      return false;
    }
  }

  return true;
};

// ============================================================================
// Labels para UI
// ============================================================================

export const TIPO_OBRIGACAO_LABELS: Record<TipoObrigacao, string> = {
  acordo_recebimento: 'Acordo - Recebimento',
  acordo_pagamento: 'Acordo - Pagamento',
  conta_receber: 'Conta a Receber',
  conta_pagar: 'Conta a Pagar',
};

export const STATUS_OBRIGACAO_LABELS: Record<StatusObrigacao, string> = {
  pendente: 'Pendente',
  vencida: 'Vencida',
  efetivada: 'Efetivada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
};

export const ORIGEM_OBRIGACAO_LABELS: Record<OrigemObrigacao, string> = {
  acordo_judicial: 'Acordo Judicial',
  manual: 'Manual',
  contrato: 'Contrato',
  recorrente: 'Recorrente',
  importacao_bancaria: 'Importação Bancária',
  folha_pagamento: 'Folha de Pagamento',
};

export const STATUS_SINCRONIZACAO_LABELS: Record<StatusSincronizacao, string> = {
  sincronizado: 'Sincronizado',
  pendente: 'Pendente',
  inconsistente: 'Inconsistente',
  nao_aplicavel: 'N/A',
};

/**
 * Cores para badges de status
 */
export const STATUS_OBRIGACAO_CORES: Record<StatusObrigacao, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'secondary',
  vencida: 'destructive',
  efetivada: 'default',
  cancelada: 'outline',
  estornada: 'outline',
};

/**
 * Cores para badges de tipo
 */
export const TIPO_OBRIGACAO_CORES: Record<TipoObrigacao, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  acordo_recebimento: 'default',
  acordo_pagamento: 'destructive',
  conta_receber: 'secondary',
  conta_pagar: 'outline',
};

// ============================================================================
// Helpers de Cálculo
// ============================================================================

/**
 * Calcula dias até o vencimento (negativo se vencido)
 */
export const calcularDiasAteVencimento = (dataVencimento: string): number => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica se uma obrigação está vencida
 */
export const isObrigacaoVencida = (obrigacao: Obrigacao): boolean => {
  if (obrigacao.status !== 'pendente') {
    return false;
  }
  const dias = calcularDiasAteVencimento(obrigacao.dataVencimento);
  return dias < 0;
};

/**
 * Verifica se uma obrigação vence hoje
 */
export const isObrigacaoVenceHoje = (obrigacao: Obrigacao): boolean => {
  if (obrigacao.status !== 'pendente') {
    return false;
  }
  const dias = calcularDiasAteVencimento(obrigacao.dataVencimento);
  return dias === 0;
};

/**
 * Verifica se uma obrigação vence em N dias
 */
export const isObrigacaoVenceEm = (obrigacao: Obrigacao, dias: number): boolean => {
  if (obrigacao.status !== 'pendente') {
    return false;
  }
  const diasAte = calcularDiasAteVencimento(obrigacao.dataVencimento);
  return diasAte >= 0 && diasAte <= dias;
};

/**
 * Determina o status unificado baseado nos dados originais
 */
export const determinarStatusObrigacao = (
  statusOriginal: string,
  dataVencimento: string | null,
  dataEfetivacao: string | null
): StatusObrigacao => {
  // Mapeamento de status das parcelas
  if (statusOriginal === 'recebida' || statusOriginal === 'paga' || statusOriginal === 'confirmado') {
    return 'efetivada';
  }
  if (statusOriginal === 'cancelado' || statusOriginal === 'cancelada') {
    return 'cancelada';
  }
  if (statusOriginal === 'estornado' || statusOriginal === 'estornada') {
    return 'estornada';
  }

  // Verifica vencimento para status pendente
  if (statusOriginal === 'pendente' && dataVencimento) {
    const dias = calcularDiasAteVencimento(dataVencimento);
    if (dias < 0) {
      return 'vencida';
    }
  }

  return 'pendente';
};

/**
 * Determina o tipo de obrigação baseado nos dados originais
 */
export const determinarTipoObrigacao = (
  tipoLancamento: 'receita' | 'despesa' | null,
  direcaoAcordo: 'recebimento' | 'pagamento' | null,
  origem: string
): TipoObrigacao => {
  // Se tem direção de acordo, é uma obrigação de acordo
  if (direcaoAcordo) {
    return direcaoAcordo === 'recebimento' ? 'acordo_recebimento' : 'acordo_pagamento';
  }

  // Caso contrário, baseado no tipo de lançamento
  if (tipoLancamento === 'receita') {
    return 'conta_receber';
  }
  if (tipoLancamento === 'despesa') {
    return 'conta_pagar';
  }

  // Fallback baseado na origem
  if (origem === 'acordo_judicial') {
    return 'acordo_recebimento'; // Default para recebimento
  }

  return 'conta_receber'; // Default
};

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de obrigações
 */
export interface ObrigacoesFilters {
  busca?: string;
  tipos?: TipoObrigacao[];
  status?: StatusObrigacao[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  clienteId?: number;
  processoId?: number;
  acordoId?: number;
  apenasVencidas?: boolean;
  apenasInconsistentes?: boolean;
}

/**
 * Lista de opções de tipo para select
 */
export const TIPOS_OBRIGACAO_OPTIONS: Array<{ value: TipoObrigacao; label: string }> = [
  { value: 'acordo_recebimento', label: 'Acordo - Recebimento' },
  { value: 'acordo_pagamento', label: 'Acordo - Pagamento' },
  { value: 'conta_receber', label: 'Conta a Receber' },
  { value: 'conta_pagar', label: 'Conta a Pagar' },
];

/**
 * Lista de opções de status para select
 */
export const STATUS_OBRIGACAO_OPTIONS: Array<{ value: StatusObrigacao; label: string }> = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'efetivada', label: 'Efetivada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'estornada', label: 'Estornada' },
];
