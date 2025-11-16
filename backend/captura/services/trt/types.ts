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
 */
export type GrauTRT = 'primeiro_grau' | 'segundo_grau';

/**
 * Código do TRT (corresponde ao enum codigo_tribunal)
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
  | 'TRT24';

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
 * Configuração do TRT baseada no arquivo tribunais.json
 */
export interface ConfigTRT {
  codigo: CodigoTRT;
  nome: string;
  grau: GrauTRT;
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
}

