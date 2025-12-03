/**
 * Tipos TypeScript para a tabela `cadastros_pje`.
 * 
 * Esta tabela resolve o problema de `id_pessoa_pje` não ser globalmente único,
 * permitindo que uma mesma pessoa tenha múltiplos IDs PJE em diferentes tribunais e graus.
 * 
 * A arquitetura usa CPF/CNPJ como chave única nas tabelas de entidades,
 * e `cadastros_pje` como mapeamento polimórfico para os IDs específicos de cada sistema judicial.
 */

/**
 * Tipos de entidade que podem ter cadastros PJE.
 * Uma pessoa pode ser cliente em um processo e parte contrária em outro.
 */
export type TipoEntidadeCadastroPJE = 'cliente' | 'parte_contraria' | 'terceiro' | 'representante';

/**
 * Sistemas judiciais suportados para cadastros PJE.
 */
export type SistemaCadastroPJE = 'pje_trt' | 'pje_tst' | 'esaj' | 'projudi';

/**
 * Graus processuais nos tribunais.
 * Pode ser null para sistemas que não distinguem graus.
 */
export type GrauCadastroPJE = 'primeiro_grau' | 'segundo_grau' | null;

/**
 * Interface principal representando um registro na tabela `cadastros_pje`.
 * Mapeia uma entidade (cliente, parte contrária, terceiro ou representante)
 * a um ID específico em um sistema judicial (PJE, ESAJ, etc.).
 */
export interface CadastroPJE {
  /** ID único do registro */
  id: number;

  /** Tipo da entidade referenciada */
  tipo_entidade: TipoEntidadeCadastroPJE;

  /** ID da entidade na tabela correspondente */
  entidade_id: number;

  /** ID da pessoa no sistema judicial */
  id_pessoa_pje: number;

  /** Sistema judicial onde o ID é válido */
  sistema: SistemaCadastroPJE;

  /** Tribunal onde o ID é válido (ex: 'TRT01', 'TJMG') */
  tribunal: string;

  /** Grau processual onde o ID é válido */
  grau: GrauCadastroPJE;

  /** Dados extras do cadastro no sistema judicial (telefones, emails, status, etc.) */
  dados_cadastro_pje: Record<string, unknown>;

  /** Data de criação do registro */
  created_at: string;

  /** Data da última atualização */
  updated_at: string;
}

/**
 * Parâmetros para criar um novo cadastro PJE.
 * Usado quando uma entidade é cadastrada pela primeira vez em um sistema judicial.
 */
export interface CriarCadastroPJEParams {
  /** Tipo da entidade */
  tipo_entidade: TipoEntidadeCadastroPJE;

  /** ID da entidade */
  entidade_id: number;

  /** ID da pessoa no sistema judicial */
  id_pessoa_pje: number;

  /** Sistema judicial */
  sistema: SistemaCadastroPJE;

  /** Tribunal */
  tribunal: string;

  /** Grau processual */
  grau: GrauCadastroPJE;

  /** Dados extras do cadastro (opcional) */
  dados_cadastro_pje?: Record<string, unknown>;
}

/**
 * Parâmetros para atualizar um cadastro PJE existente.
 * Permite modificar dados extras ou outros campos mutáveis.
 */
export interface AtualizarCadastroPJEParams {
  /** ID do cadastro a atualizar */
  id: number;

  /** Novos dados extras do cadastro (opcional) */
  dados_cadastro_pje?: Record<string, unknown>;

  /** Novo grau processual (opcional) */
  grau?: GrauCadastroPJE;
}

/**
 * Parâmetros para buscar cadastros PJE com filtros.
 * Suporta paginação e filtros por entidade, sistema, tribunal, etc.
 */
export interface BuscarCadastroPJEParams {
  /** Tipo da entidade (opcional) */
  tipo_entidade?: TipoEntidadeCadastroPJE;

  /** ID da entidade (opcional) */
  entidade_id?: number;

  /** ID da pessoa no sistema judicial (opcional) */
  id_pessoa_pje?: number;

  /** Sistema judicial (opcional) */
  sistema?: SistemaCadastroPJE;

  /** Tribunal (opcional) */
  tribunal?: string;

  /** Grau processual (opcional) */
  grau?: GrauCadastroPJE;

  /** Página para paginação (opcional, padrão 1) */
  pagina?: number;

  /** Limite de registros por página (opcional, padrão 50) */
  limite?: number;
}

/**
 * Parâmetros para upsert (inserir ou atualizar) um cadastro PJE.
 * Usa a constraint UNIQUE (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
 * para determinar se deve inserir ou atualizar.
 */
export interface UpsertCadastroPJEParams {
  /** Tipo da entidade */
  tipo_entidade: TipoEntidadeCadastroPJE;

  /** ID da entidade */
  entidade_id: number;

  /** ID da pessoa no sistema judicial */
  id_pessoa_pje: number;

  /** Sistema judicial */
  sistema: SistemaCadastroPJE;

  /** Tribunal */
  tribunal: string;

  /** Grau processual */
  grau: GrauCadastroPJE;

  /** Dados extras do cadastro (opcional) */
  dados_cadastro_pje?: Record<string, unknown>;
}

/**
 * Parâmetros para buscar uma entidade por seu ID PJE em um contexto específico.
 * Retorna o tipo_entidade e entidade_id correspondentes.
 */
export interface BuscarEntidadePorIdPessoaPJEParams {
  /** ID da pessoa no sistema judicial */
  id_pessoa_pje: number;

  /** Sistema judicial */
  sistema: SistemaCadastroPJE;

  /** Tribunal */
  tribunal: string;

  /** Grau processual */
  grau: GrauCadastroPJE;
}

/**
 * Parâmetros para listar todos os cadastros PJE de uma entidade específica.
 * Útil para ver em quais tribunais/sistemas uma pessoa está cadastrada.
 */
export interface ListarCadastrosPJEPorEntidadeParams {
  /** Tipo da entidade */
  tipo_entidade: TipoEntidadeCadastroPJE;

  /** ID da entidade */
  entidade_id: number;

  /** Sistema judicial (opcional, para filtrar) */
  sistema?: SistemaCadastroPJE;

  /** Tribunal (opcional, para filtrar) */
  tribunal?: string;

  /** Página para paginação (opcional) */
  pagina?: number;

  /** Limite de registros por página (opcional) */
  limite?: number;
}

/**
 * Resultado de operações CRUD em cadastros PJE.
 * Indica sucesso/falha e retorna o cadastro criado/atualizado quando aplicável.
 */
export interface OperacaoCadastroPJEResult {
  /** Indica se a operação foi bem-sucedida */
  sucesso: boolean;

  /** O cadastro resultante da operação (quando aplicável) */
  cadastro?: CadastroPJE;

  /** Mensagem de erro (quando falhou) */
  erro?: string;
}

/**
 * Resultado de listagem paginada de cadastros PJE.
 * Inclui metadados de paginação e o array de cadastros.
 */
export interface ListarCadastrosPJEResult {
  /** Array de cadastros encontrados */
  cadastros: CadastroPJE[];

  /** Página atual */
  pagina: number;

  /** Limite por página */
  limite: number;

  /** Total de registros encontrados */
  total: number;

  /** Total de páginas */
  total_paginas: number;
}