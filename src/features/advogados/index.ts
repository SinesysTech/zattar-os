/**
 * Advogados Feature - Barrel Exports
 */

// Types
export type {
  Advogado,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarAdvogadosParams,
  ListarAdvogadosResult,
  Credencial,
  CredencialComAdvogado,
  CriarCredencialParams,
  AtualizarCredencialParams,
  ListarCredenciaisParams,
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
} from './actions/credenciais-actions';

// Hooks
export { useAdvogados } from './hooks/use-advogados';
export { useCredenciais } from './hooks/use-credenciais';

// Components (To be migrated/created)
// export { AdvogadoTable } from './components/advogados/advogados-table';
// export { CredencialTable } from './components/credenciais/credenciais-table';
