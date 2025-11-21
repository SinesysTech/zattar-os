/**
 * Tipos para credenciais no frontend
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

export type GrauTRT = 'primeiro_grau' | 'segundo_grau';

/**
 * Credencial com informações do advogado (para listagem)
 */
export interface Credencial {
  id: number;
  advogado_id: number;
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oab: string;
  advogado_uf_oab: string;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Dados para criar uma nova credencial
 */
export interface CriarCredencialParams {
  advogado_id: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  senha: string;
  active?: boolean;
}

/**
 * Dados para atualizar uma credencial
 */
export interface AtualizarCredencialParams {
  tribunal?: CodigoTRT;
  grau?: GrauTRT;
  senha?: string;
  active?: boolean;
}

/**
 * Advogado
 */
export interface Advogado {
  id: number;
  nome_completo: string;
  cpf: string;
  oab: string;
  uf_oab: string;
  created_at: string;
  updated_at: string;
}

/**
 * Resposta da API de credenciais
 */
export interface CredenciaisResponse {
  success: boolean;
  data: {
    credenciais: Credencial[];
    tribunais_disponiveis: string[];
    graus_disponiveis: string[];
  };
}
