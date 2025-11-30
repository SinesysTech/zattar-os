// Re-exporta tipos de domínio e contratos de audiências
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

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
import type { GrauProcesso } from '@/types/domain/common';
export type GrauAudiencia = GrauProcesso;
