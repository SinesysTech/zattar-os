// Tipos e interfaces comuns para captura TRT

import type { CredenciaisTRT, ConfigTRT, FiltroPrazoPendentes } from '../../types/trt-types';

/**
 * Parâmetros base para captura TRT
 * Usado por todos os serviços específicos (acervo-geral, arquivados, etc.)
 *
 * A configuração do 2FAuth é carregada diretamente do banco de dados
 * em autenticarPJE() — não precisa ser passada como parâmetro.
 */
export interface CapturaTRTParams {
  credential: CredenciaisTRT;
  config: ConfigTRT;
}

/**
 * Parâmetros específicos para captura de pendentes de manifestação
 */
export interface CapturaPendentesManifestacaoParams extends CapturaTRTParams {
  filtroPrazo?: FiltroPrazoPendentes; // 'no_prazo' ou 'sem_prazo'
  capturarDocumentos?: boolean; // Se true, baixa documentos PDF de cada pendente (default: false)
}

/**
 * Parâmetros específicos para captura de audiências
 */
export interface CapturaAudienciasParams extends CapturaTRTParams {
  /** Data inicial do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje */
  dataInicio?: string;
  /** Data final do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje + 365 dias */
  dataFim?: string;
  /** Código do status da audiência: 'M' = Designada, 'C' = Cancelada, 'F' = Realizada. Padrão: 'M' */
  codigoSituacao?: 'M' | 'C' | 'F';
}

/**
 * Parâmetros para captura combinada
 *
 * Executa múltiplas capturas em uma única sessão:
 * - Audiências Designadas (hoje → +1 ano)
 * - Audiências Realizadas (ontem)
 * - Audiências Canceladas (hoje → +1 ano)
 * - Expedientes No Prazo
 * - Expedientes Sem Prazo
 * - Timeline + Partes de todos os processos únicos
 */
export type CapturaCombinAdaParams = CapturaTRTParams;
