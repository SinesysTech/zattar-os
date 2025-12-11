// Tipos TypeScript compartilhados para serviços de captura TRT

/**
 * Tipos de rotas disponíveis no TRT
 */
export type TipoRotaTRT =
  | 'acervo-geral'
  | 'pendentes-manifestacao'
  | 'arquivados'
  | 'audiencias';

/**
 * Grau do processo no TRT (corresponde ao enum grau_tribunal)
 * Usado para classificar onde o processo está tramitando
 */
export type GrauTRT = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Tipo de acesso ao tribunal (corresponde ao enum tipo_acesso_tribunal)
 * Usado em tribunais_config para definir tipo de login
 */
export type TipoAcessoTribunal =
  | 'primeiro_grau' // Login específico para primeiro grau (TRTs)
  | 'segundo_grau' // Login específico para segundo grau (TRTs)
  | 'unificado' // Login unificado para 1º e 2º grau (TJs, TRFs)
  | 'unico'; // Login único para tribunal superior (TST, STF, STJ)

/**
 * Código do tribunal (TRTs e TST)
 */
export type CodigoTRT =
  | 'TRT1'
  | 'TRT2'
  | 'TRT3'
  | 'TRT4'
  | 'TRT5'
  | 'TRT6'
  | 'TRT7'
  | 'TRT8'
  | 'TRT9'
  | 'TRT10'
  | 'TRT11'
  | 'TRT12'
  | 'TRT13'
  | 'TRT14'
  | 'TRT15'
  | 'TRT16'
  | 'TRT17'
  | 'TRT18'
  | 'TRT19'
  | 'TRT20'
  | 'TRT21'
  | 'TRT22'
  | 'TRT23'
  | 'TRT24'
  | 'TST';

/**
 * Parâmetros base para todas as rotas de captura TRT
 */
export interface BaseCapturaTRTParams {
  /** ID do advogado na tabela advogados */
  advogado_id: number;
  /** Código do TRT (ex: 'TRT1', 'TRT2', etc.) */
  trt_codigo: CodigoTRT;
  /** Grau do processo ('primeiro_grau' ou 'segundo_grau') */
  grau: GrauTRT;
}

/**
 * Filtro de prazo para processos pendentes de manifestação
 */
export type FiltroPrazoPendentes = 'no_prazo' | 'sem_prazo';

/**
 * Credenciais descriptografadas (usadas apenas em memória durante a captura)
 */
export interface CredenciaisTRT {
  cpf: string;
  senha: string;
}

/**
 * Timeouts customizados para um tribunal específico
 */
export interface CustomTimeouts {
  login?: number; // Timeout para login SSO (ms)
  redirect?: number; // Timeout para redirects (ms)
  networkIdle?: number; // Timeout para página estabilizar (ms)
  api?: number; // Timeout para chamadas de API (ms)
}

/**
 * Configuração do tribunal vinda do banco de dados (tribunais_config)
 */
export interface TribunalConfigDb {
  id: string;
  sistema: string;
  tipo_acesso: TipoAcessoTribunal;
  url_base: string;
  url_login_seam: string;
  url_api: string;
  custom_timeouts: CustomTimeouts | null;
  created_at: string;
  updated_at: string;
  tribunal_id: string;
  // Dados do JOIN com tribunais
  tribunal_codigo: string;
  tribunal_nome: string;
}

/**
 * Configuração do TRT usada no código (após mapeamento do banco)
 */
export interface ConfigTRT {
  codigo: CodigoTRT;
  nome: string;
  grau: GrauTRT; // Mapeado de tipo_acesso
  tipoAcesso: TipoAcessoTribunal; // Tipo de acesso original do banco
  loginUrl: string; // Mapeado de url_login_seam
  baseUrl: string; // Mapeado de url_base
  apiUrl: string; // Mapeado de url_api
  customTimeouts?: CustomTimeouts; // Opcional
}

