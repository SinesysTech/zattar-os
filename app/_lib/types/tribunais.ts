/**
 * Tipos para configurações de tribunais
 */

import type { TipoAcessoTribunal, CustomTimeouts } from '@/backend/types/captura/trt-types';

/**
 * Configuração de tribunal retornada pela API
 */
export interface TribunalConfig {
  id: string;
  tribunal_id: string;
  tribunal_codigo: string;
  tribunal_nome: string;
  sistema: string;
  tipo_acesso: TipoAcessoTribunal;
  url_base: string;
  url_login_seam: string;
  url_api: string;
  custom_timeouts: CustomTimeouts | null;
  created_at: string;
  updated_at: string;
}

/**
 * Resposta da API de listagem de tribunais
 */
export interface TribunaisResponse {
  success: boolean;
  data: {
    tribunais: TribunalConfig[];
    tribunais_codigos: string[];
    tipos_acesso: string[];
  };
}

/**
 * Parâmetros para criar nova configuração
 */
export interface CriarTribunalParams {
  tribunal_id: string;
  tipo_acesso: TipoAcessoTribunal;
  url_base: string;
  url_login_seam: string;
  url_api: string;
  custom_timeouts?: CustomTimeouts | null;
}

/**
 * Parâmetros para atualizar configuração
 */
export interface AtualizarTribunalParams {
  tipo_acesso?: TipoAcessoTribunal;
  url_base?: string;
  url_login_seam?: string;
  url_api?: string;
  custom_timeouts?: CustomTimeouts | null;
}
