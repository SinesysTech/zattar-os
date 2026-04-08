/**
 * ADVOGADOS MODULE — Barrel Export (API Pública)
 *
 * Módulo de serviço (sem page.tsx) — cadastro de advogados e credenciais PJE.
 */

// =============================================================================
// Types / Domain
// =============================================================================

export type {
  Advogado,
  OabEntry,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarAdvogadosParams,
  ListarAdvogadosResult,
  Credencial,
  CredencialComAdvogado,
  CriarCredencialParams,
  AtualizarCredencialParams,
  ListarCredenciaisParams,
  GrauCredencial,
  ModoDuplicata,
  CriarCredenciaisEmLoteParams,
  ResultadoCredencialLote,
  ResumoCriacaoEmLote,
} from './domain';

export {
  TRIBUNAIS_ATIVOS,
  TRIBUNAIS_LABELS,
  GRAUS_LABELS,
  UFS_BRASIL,
  criarAdvogadoSchema,
  atualizarAdvogadoSchema,
  criarCredencialSchema,
  atualizarCredencialSchema,
  criarCredenciaisEmLoteSchema,
  oabEntrySchema,
  getPrimaryOab,
  formatOabs,
  formatOab,
  hasOabInState,
  findOabByState,
} from './domain';

// =============================================================================
// Service
// =============================================================================

export { buscarAdvogado } from './service';

// =============================================================================
// Repository
// =============================================================================

export { listarCredenciaisMapa } from './repository';

// =============================================================================
// Actions
// =============================================================================

export {
  actionListarAdvogados,
  actionBuscarAdvogado,
  actionCriarAdvogado,
  actionAtualizarAdvogado,
  actionListarCredenciais,
  actionBuscarCredencial,
  actionCriarCredencial,
  actionAtualizarCredencial,
  actionCriarCredenciaisEmLote,
  actionAtualizarStatusCredenciaisEmLote,
} from './actions';

// =============================================================================
// Hooks
// =============================================================================

export { useAdvogados } from './hooks/use-advogados';
export { useCredenciais } from './hooks/use-credenciais';

// =============================================================================
// Components
// =============================================================================

export { CredenciaisLoteDialog } from './components';
