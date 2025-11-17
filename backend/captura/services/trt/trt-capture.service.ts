// Tipos e interfaces comuns para captura TRT
// (Não usa mais herança - cada serviço chama autenticação diretamente)

import type { CredenciaisTRT, ConfigTRT, FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
import type { TwoFAuthConfig } from '@/backend/utils/api/twofauth.service';

/**
 * Parâmetros base para captura TRT
 * Usado por todos os serviços específicos (acervo-geral, arquivados, etc.)
 */
export interface CapturaTRTParams {
  credential: CredenciaisTRT;
  config: ConfigTRT;
  twofauthConfig?: TwoFAuthConfig;
}

/**
 * Parâmetros específicos para captura de pendentes de manifestação
 */
export interface CapturaPendentesManifestacaoParams extends CapturaTRTParams {
  filtroPrazo?: FiltroPrazoPendentes; // 'no_prazo' ou 'sem_prazo'
}

/**
 * Parâmetros específicos para captura de audiências
 */
export interface CapturaAudienciasParams extends CapturaTRTParams {
  /** Data inicial do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje */
  dataInicio?: string;
  /** Data final do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje + 365 dias */
  dataFim?: string;
}
