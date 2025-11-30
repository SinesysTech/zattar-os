/**
 * Types e interfaces para o módulo de Permissões Granulares
 * Sistema de permissões baseado em usuário (não em roles)
 */

/**
 * Recursos disponíveis no sistema
 */
export type Recurso =
  | 'advogados'
  | 'credenciais'
  | 'acervo'
  | 'audiencias'
  | 'pendentes'
  | 'expedientes_manuais'
  | 'usuarios'
  | 'clientes'
  | 'partes_contrarias'
  | 'terceiros'
  | 'representantes'
  | 'enderecos'
  | 'contratos'
  | 'processo_partes'
  | 'acordos_condenacoes'
  | 'parcelas'
  | 'agendamentos'
  | 'captura'
  | 'tipos_expedientes'
  | 'cargos'
  | 'formsign_admin';

/**
 * Operações disponíveis no sistema
 */
export type Operacao =
  // Operações comuns (CRUD)
  | 'listar'
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'deletar'
  // Operações específicas de responsáveis
  | 'atribuir_responsavel'
  | 'desatribuir_responsavel'
  | 'transferir_responsavel'
  // Operações específicas de audiências
  | 'editar_url_virtual'
  // Operações específicas de pendentes
  | 'baixar_expediente'
  | 'reverter_baixa'
  | 'editar_tipo_descricao'
  // Operações específicas de usuários
  | 'ativar_desativar'
  | 'gerenciar_permissoes'
  | 'sincronizar'
  // Operações específicas de credenciais
  | 'ativar_desativar'
  // Operações específicas de contratos
  | 'associar_processo'
  | 'desassociar_processo'
  // Operações específicas de processo_partes
  | 'vincular_parte'
  | 'desvincular_parte'
  // Operações específicas de acordos/condenações
  | 'gerenciar_parcelas'
  | 'receber_pagamento'
  | 'pagar'
  | 'registrar_repasse'
  // Operações específicas de parcelas
  | 'editar_valores'
  | 'marcar_como_recebida'
  | 'marcar_como_paga'
  | 'anexar_comprovante'
  // Operações específicas de agendamentos
  | 'executar'
  // Operações específicas de captura
  | 'executar_acervo_geral'
  | 'executar_arquivados'
  | 'executar_audiencias'
  | 'executar_pendentes'
  | 'visualizar_historico'
  | 'gerenciar_credenciais';

/**
 * Matriz de permissões completa do sistema
 * Total: 126 permissões granulares
 */
export const MATRIZ_PERMISSOES: Record<Recurso, Operacao[]> = {
  // Advogados (5 permissões)
  advogados: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Credenciais (6 permissões)
  credenciais: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'ativar_desativar',
  ],

  // Acervo (6 permissões)
  acervo: [
    'listar',
    'visualizar',
    'editar',
    'atribuir_responsavel',
    'desatribuir_responsavel',
    'transferir_responsavel',
  ],

  // Audiências (7 permissões)
  audiencias: [
    'listar',
    'visualizar',
    'editar',
    'atribuir_responsavel',
    'desatribuir_responsavel',
    'transferir_responsavel',
    'editar_url_virtual',
  ],

  // Pendentes de Manifestação (8 permissões)
  pendentes: [
    'listar',
    'visualizar',
    'atribuir_responsavel',
    'desatribuir_responsavel',
    'transferir_responsavel',
    'baixar_expediente',
    'reverter_baixa',
    'editar_tipo_descricao',
  ],

  // Expedientes Manuais (10 permissões)
  expedientes_manuais: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'atribuir_responsavel',
    'desatribuir_responsavel',
    'transferir_responsavel',
    'baixar_expediente',
    'reverter_baixa',
  ],

  // Usuários (8 permissões)
  usuarios: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'ativar_desativar',
    'gerenciar_permissoes',
    'sincronizar',
  ],

  // Clientes (5 permissões)
  clientes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Partes Contrárias (5 permissões)
  partes_contrarias: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Terceiros (5 permissões)
  terceiros: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Representantes (5 permissões)
  representantes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Endereços (5 permissões)
  enderecos: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Contratos (7 permissões)
  contratos: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'associar_processo',
    'desassociar_processo',
  ],

  // Processo Partes - Vínculo de partes com processos (7 permissões)
  processo_partes: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'vincular_parte',
    'desvincular_parte',
  ],

  // Acordos e Condenações (9 permissões)
  acordos_condenacoes: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'gerenciar_parcelas',
    'receber_pagamento',
    'pagar',
    'registrar_repasse',
  ],

  // Parcelas - Gestão de pagamentos parcelados (10 permissões)
  parcelas: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'editar_valores',
    'marcar_como_recebida',
    'marcar_como_paga',
    'anexar_comprovante',
    'registrar_repasse',
  ],

  // Agendamentos de Captura (7 permissões)
  agendamentos: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'executar',
    'ativar_desativar',
  ],

  // Captura de Dados (6 permissões)
  captura: [
    'executar_acervo_geral',
    'executar_arquivados',
    'executar_audiencias',
    'executar_pendentes',
    'visualizar_historico',
    'gerenciar_credenciais',
  ],

  // Tipos de Expedientes (5 permissões)
  tipos_expedientes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],

  // Cargos (6 permissões)
  cargos: [
    'listar',
    'visualizar',
    'criar',
    'editar',
    'deletar',
    'ativar_desativar',
  ],

  // Administração de assinatura digital (Formsign)
  formsign_admin: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
};

/**
 * Interface de Permissão
 */
export interface Permissao {
  id: number;
  usuario_id: number;
  recurso: Recurso;
  operacao: Operacao;
  permitido: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para atribuir permissão
 */
export interface AtribuirPermissaoDTO {
  recurso: Recurso;
  operacao: Operacao;
  permitido?: boolean;
}

/**
 * DTO para atribuir múltiplas permissões (batch)
 */
export interface AtribuirPermissoesDTO {
  permissoes: AtribuirPermissaoDTO[];
}

/**
 * Resposta de listagem de permissões de um usuário
 */
export interface PermissoesUsuarioResponse {
  usuario_id: number;
  is_super_admin: boolean;
  permissoes: Array<{
    recurso: Recurso;
    operacao: Operacao;
    permitido: boolean;
  }>;
}

/**
 * Estrutura da matriz de recursos e operações para o frontend
 */
export interface RecursoOperacoes {
  recurso: Recurso;
  operacoes: Operacao[];
}

/**
 * Obter lista estruturada de recursos e operações
 */
export const obterMatrizPermissoes = (): RecursoOperacoes[] => {
  return Object.entries(MATRIZ_PERMISSOES).map(([recurso, operacoes]) => ({
    recurso: recurso as Recurso,
    operacoes,
  }));
};

/**
 * Obter total de permissões disponíveis
 */
export const obterTotalPermissoes = (): number => {
  return Object.values(MATRIZ_PERMISSOES).reduce(
    (total, operacoes) => total + operacoes.length,
    0
  );
};

/**
 * Validar se recurso existe na matriz
 */
export const isRecursoValido = (recurso: string): recurso is Recurso => {
  return recurso in MATRIZ_PERMISSOES;
};

/**
 * Validar se operação existe para um recurso
 */
export const isOperacaoValida = (
  recurso: Recurso,
  operacao: string
): operacao is Operacao => {
  return MATRIZ_PERMISSOES[recurso].includes(operacao as Operacao);
};

/**
 * Validar permissão completa (recurso + operação)
 */
export const isPermissaoValida = (recurso: string, operacao: string): boolean => {
  if (!isRecursoValido(recurso)) {
    return false;
  }
  return isOperacaoValida(recurso, operacao);
};

/**
 * Obter todas as permissões (matriz completa)
 * Útil para super admins
 */
export const obterTodasPermissoes = (): Array<{
  recurso: Recurso;
  operacao: Operacao;
}> => {
  const todasPermissoes: Array<{ recurso: Recurso; operacao: Operacao }> = [];

  Object.entries(MATRIZ_PERMISSOES).forEach(([recurso, operacoes]) => {
    operacoes.forEach((operacao) => {
      todasPermissoes.push({
        recurso: recurso as Recurso,
        operacao,
      });
    });
  });

  return todasPermissoes;
};

/**
 * Validar DTO de atribuição de permissão
 */
export const validarAtribuirPermissaoDTO = (
  data: unknown
): data is AtribuirPermissaoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtribuirPermissaoDTO;

  // Recurso e operação são obrigatórios
  if (!dto.recurso || !dto.operacao) {
    return false;
  }

  // Validar se são valores válidos
  if (!isPermissaoValida(dto.recurso, dto.operacao)) {
    return false;
  }

  // Permitido é opcional, mas se fornecido deve ser boolean
  if (dto.permitido !== undefined && typeof dto.permitido !== 'boolean') {
    return false;
  }

  return true;
};

/**
 * Validar array de permissões
 */
export const validarAtribuirPermissoesDTO = (
  data: unknown
): data is AtribuirPermissoesDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtribuirPermissoesDTO;

  if (!Array.isArray(dto.permissoes)) {
    return false;
  }

  // Validar cada permissão individualmente
  return dto.permissoes.every((permissao) =>
    validarAtribuirPermissaoDTO(permissao)
  );
};
