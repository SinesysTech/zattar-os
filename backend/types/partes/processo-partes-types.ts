// Re-exporta tipos de domínio e contratos de processo-partes
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  EntidadeTipoProcessoParte,
  PoloProcessoParte,
  TipoParteProcesso,
  ProcessoParte,
  ParteComDadosCompletos,
  ProcessoComParticipacao,
} from '@/types/domain/processo-partes';

// Re-exporta tipos de contratos
export type {
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  OrdenarPorProcessoParte,
  OrdemProcessoParte,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  BuscarProcessosPorEntidadeParams,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
} from '@/types/contracts/processo-partes';

// Re-exporta GrauProcesso como GrauProcessoParte para compatibilidade
import type { GrauProcesso } from '@/types/domain/common';
export type GrauProcessoParte = GrauProcesso;
