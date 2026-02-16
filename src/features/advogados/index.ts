/**
 * Advogados Feature - Barrel Exports
 */

// Types
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
  // Credenciais em Lote
  GrauCredencial,
  ModoDuplicata,
  CriarCredenciaisEmLoteParams,
  ResultadoCredencialLote,
  ResumoCriacaoEmLote,
} from './domain';

// Constants
export {
  TRIBUNAIS_ATIVOS,
  TRIBUNAIS_LABELS,
  GRAUS_LABELS,
  UFS_BRASIL,
} from './domain';

// Schemas
export {
  criarAdvogadoSchema,
  atualizarAdvogadoSchema,
  criarCredencialSchema,
  atualizarCredencialSchema,
  criarCredenciaisEmLoteSchema,
  oabEntrySchema,
} from './domain';

// Helper functions
export {
  getPrimaryOab,
  formatOabs,
  formatOab,
  hasOabInState,
  findOabByState,
} from './domain';

// Actions
export {
  actionListarAdvogados,
  actionBuscarAdvogado,
  actionCriarAdvogado,
  actionAtualizarAdvogado,
} from './actions/advogados-actions';

export {
  actionListarCredenciais,
  actionBuscarCredencial,
  actionCriarCredencial,
  actionAtualizarCredencial,
  actionCriarCredenciaisEmLote,
} from './actions/credenciais-actions';

// Hooks
export { useAdvogados } from './hooks/use-advogados';
export { useCredenciais } from './hooks/use-credenciais';

// Components
export { CredenciaisLoteDialog } from './components';
