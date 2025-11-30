/**
 * Tipos de audiências.
 *
 * Re-exporta tipos de domínio e contratos, além de tipos de infraestrutura
 * específicos do backend.
 */

import type { GrauProcesso } from '@/types/domain/common';

// Re-exporta tipos de domínio
export type {
  StatusAudiencia,
  ModalidadeAudiencia,
  PresencaHibrida,
  Audiencia,
} from '@/types/domain/audiencias';

// Re-exporta tipos de contratos
export type {
  OrdenarPorAudiencia,
  OrdemAudiencia,
  ListarAudienciasParams,
  ListarAudienciasResult,
  CriarAudienciaParams,
} from '@/types/contracts/audiencias';

// Re-exporta GrauProcesso como GrauAudiencia para compatibilidade
export type GrauAudiencia = GrauProcesso;

// ============================================================================
// Tipos de infraestrutura para audiências
// ============================================================================

/**
 * Representa os dados de infraestrutura de uma audiência.
 *
 * Estes campos não fazem parte da entidade de domínio `Audiencia`,
 * mas são necessários para operacionalizar a realização da audiência:
 * - URLs de audiência virtual
 * - Endereços físicos para audiências presenciais
 * - IDs de salas de audiência
 * - Metadados de infraestrutura do PJE
 */
export interface AudienciaInfra {
  /**
   * ID da audiência (FK para tabela de audiências).
   */
  audiencia_id: number;

  /**
   * URL para acesso à audiência virtual.
   * Usado quando a modalidade é 'virtual' ou 'hibrida'.
   */
  url_audiencia_virtual: string | null;

  /**
   * URL para acesso à ata da audiência no PJE.
   */
  url_ata_audiencia: string | null;

  /**
   * ID do documento de ata da audiência no PJE.
   */
  ata_audiencia_id: number | null;

  /**
   * Endereço físico onde a audiência presencial será realizada.
   * Formato livre para compatibilidade com dados brutos do PJE.
   */
  endereco_presencial: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  } | null;

  /**
   * Nome da sala de audiência (física ou virtual).
   */
  sala_audiencia_nome: string | null;

  /**
   * ID da sala de audiência no sistema PJE.
   */
  sala_audiencia_id: number | null;

  /**
   * Dados completos brutos retornados pela API do PJE.
   * Armazenado para referência e debugging.
   */
  dados_pje_completo: Record<string, unknown> | null;

  /**
   * ID do órgão julgador no PJE.
   */
  orgao_julgador_id: number | null;

  /**
   * Descrição do órgão julgador.
   */
  orgao_julgador_descricao: string | null;

  /**
   * TRT ao qual a audiência pertence.
   */
  trt: string;

  /**
   * Grau de jurisdição.
   */
  grau: GrauProcesso;

  /**
   * Timestamps de auditoria.
   */
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Parâmetros para criar dados de infraestrutura de uma audiência.
 */
export interface CriarAudienciaInfraParams {
  audiencia_id: number;
  url_audiencia_virtual?: string | null;
  url_ata_audiencia?: string | null;
  ata_audiencia_id?: number | null;
  endereco_presencial?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  } | null;
  sala_audiencia_nome?: string | null;
  sala_audiencia_id?: number | null;
  dados_pje_completo?: Record<string, unknown> | null;
  orgao_julgador_id?: number | null;
  orgao_julgador_descricao?: string | null;
  trt: string;
  grau: GrauProcesso;
}

/**
 * Parâmetros para atualizar dados de infraestrutura de uma audiência.
 */
export interface AtualizarAudienciaInfraParams {
  audiencia_id: number;
  url_audiencia_virtual?: string | null;
  url_ata_audiencia?: string | null;
  ata_audiencia_id?: number | null;
  endereco_presencial?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  } | null;
  sala_audiencia_nome?: string | null;
  sala_audiencia_id?: number | null;
  dados_pje_completo?: Record<string, unknown> | null;
  orgao_julgador_id?: number | null;
  orgao_julgador_descricao?: string | null;
}
