/**
 * Types e interfaces para o módulo de Plano de Contas
 * Sistema de Gestão Financeira (SGF)
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Tipo de conta contábil no plano de contas
 */
export type TipoContaContabil =
  | 'ativo'
  | 'passivo'
  | 'receita'
  | 'despesa'
  | 'patrimonio_liquido';

/**
 * Natureza da conta contábil (devedora ou credora)
 */
export type NaturezaConta = 'devedora' | 'credora';

/**
 * Nível da conta no plano de contas
 */
export type NivelConta = 'sintetica' | 'analitica';

// ============================================================================
// Interfaces principais
// ============================================================================

/**
 * Interface principal de Plano de Contas
 */
export interface PlanoConta {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  tipoConta: TipoContaContabil;
  natureza: NaturezaConta;
  nivel: NivelConta;
  contaPaiId?: number;
  aceitaLancamento: boolean;
  ordemExibicao?: number;
  ativo: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para dados da conta pai (resumida)
 */
export interface ContaPaiResumo {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Interface de Plano de Contas com dados da conta pai
 */
export interface PlanoContaComPai extends PlanoConta {
  contaPai?: ContaPaiResumo;
}

/**
 * Interface de Plano de Contas com hierarquia (filhos aninhados)
 */
export interface PlanoContaHierarquico extends PlanoConta {
  filhos?: PlanoContaHierarquico[];
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para criar nova conta no plano de contas
 */
export interface CriarPlanoContaDTO {
  codigo: string;
  nome: string;
  descricao?: string;
  tipoConta: TipoContaContabil;
  natureza: NaturezaConta;
  nivel: NivelConta;
  contaPaiId?: number;
  ordemExibicao?: number;
  ativo?: boolean;
}

/**
 * DTO para atualizar conta existente
 */
export interface AtualizarPlanoContaDTO {
  nome?: string;
  descricao?: string;
  tipoConta?: TipoContaContabil;
  natureza?: NaturezaConta;
  contaPaiId?: number | null;
  ordemExibicao?: number | null;
  ativo?: boolean;
}

// ============================================================================
// Parâmetros e Respostas
// ============================================================================

/**
 * Parâmetros para listagem de plano de contas
 */
export interface ListarPlanoContasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipoConta?: TipoContaContabil;
  nivel?: NivelConta;
  ativo?: boolean;
  contaPaiId?: number | null;
  ordenarPor?: 'codigo' | 'nome' | 'ordem_exibicao' | 'created_at' | 'updated_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de plano de contas
 */
export interface ListarPlanoContasResponse {
  items: PlanoContaComPai[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

/**
 * Resultado de operação no plano de contas
 */
export interface OperacaoPlanoContaResult {
  sucesso: boolean;
  planoConta?: PlanoConta;
  erro?: string;
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de plano de contas
 */
export interface PlanoContasFilters {
  tipoConta?: TipoContaContabil;
  nivel?: NivelConta;
  ativo?: boolean;
  contaPaiId?: number | null;
}

// ============================================================================
// Validadores
// ============================================================================

/**
 * Type guard para verificar se é um PlanoConta válido
 */
export const isPlanoConta = (obj: unknown): obj is PlanoConta => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'codigo' in obj &&
    'nome' in obj &&
    'tipoConta' in obj &&
    'natureza' in obj &&
    'nivel' in obj &&
    'ativo' in obj
  );
};

/**
 * Validar dados de criação de plano de contas
 */
export const validarCriarPlanoContaDTO = (data: unknown): data is CriarPlanoContaDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarPlanoContaDTO;

  // Campos obrigatórios
  if (!dto.codigo || typeof dto.codigo !== 'string' || dto.codigo.trim() === '') {
    return false;
  }
  if (!dto.nome || typeof dto.nome !== 'string' || dto.nome.trim() === '') {
    return false;
  }
  if (!dto.tipoConta || !['ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido'].includes(dto.tipoConta)) {
    return false;
  }
  if (!dto.natureza || !['devedora', 'credora'].includes(dto.natureza)) {
    return false;
  }
  if (!dto.nivel || !['sintetica', 'analitica'].includes(dto.nivel)) {
    return false;
  }

  // Campos opcionais
  if (dto.descricao !== undefined && typeof dto.descricao !== 'string') {
    return false;
  }
  if (dto.contaPaiId !== undefined && dto.contaPaiId !== null && typeof dto.contaPaiId !== 'number') {
    return false;
  }
  if (dto.ordemExibicao !== undefined && dto.ordemExibicao !== null && typeof dto.ordemExibicao !== 'number') {
    return false;
  }
  if (dto.ativo !== undefined && typeof dto.ativo !== 'boolean') {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de plano de contas
 */
export const validarAtualizarPlanoContaDTO = (data: unknown): data is AtualizarPlanoContaDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarPlanoContaDTO;

  // Pelo menos um campo deve ser fornecido
  if (
    dto.nome === undefined &&
    dto.descricao === undefined &&
    dto.tipoConta === undefined &&
    dto.natureza === undefined &&
    dto.contaPaiId === undefined &&
    dto.ordemExibicao === undefined &&
    dto.ativo === undefined
  ) {
    return false;
  }

  // Validar cada campo se fornecido
  if (dto.nome !== undefined && (typeof dto.nome !== 'string' || dto.nome.trim() === '')) {
    return false;
  }
  if (dto.descricao !== undefined && dto.descricao !== null && typeof dto.descricao !== 'string') {
    return false;
  }
  if (dto.tipoConta !== undefined && !['ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido'].includes(dto.tipoConta)) {
    return false;
  }
  if (dto.natureza !== undefined && !['devedora', 'credora'].includes(dto.natureza)) {
    return false;
  }
  if (dto.contaPaiId !== undefined && dto.contaPaiId !== null && typeof dto.contaPaiId !== 'number') {
    return false;
  }
  if (dto.ordemExibicao !== undefined && dto.ordemExibicao !== null && typeof dto.ordemExibicao !== 'number') {
    return false;
  }
  if (dto.ativo !== undefined && typeof dto.ativo !== 'boolean') {
    return false;
  }

  return true;
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Retorna a natureza padrão para um tipo de conta
 */
export const getNaturezaPadrao = (tipoConta: TipoContaContabil): NaturezaConta => {
  switch (tipoConta) {
    case 'ativo':
    case 'despesa':
      return 'devedora';
    case 'passivo':
    case 'receita':
    case 'patrimonio_liquido':
      return 'credora';
  }
};

/**
 * Labels para tipos de conta
 */
export const TIPO_CONTA_LABELS: Record<TipoContaContabil, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  receita: 'Receita',
  despesa: 'Despesa',
  patrimonio_liquido: 'Patrimônio Líquido',
};

/**
 * Labels para natureza da conta
 */
export const NATUREZA_LABELS: Record<NaturezaConta, string> = {
  devedora: 'Devedora',
  credora: 'Credora',
};

/**
 * Labels para nível da conta
 */
export const NIVEL_LABELS: Record<NivelConta, string> = {
  sintetica: 'Sintética',
  analitica: 'Analítica',
};
