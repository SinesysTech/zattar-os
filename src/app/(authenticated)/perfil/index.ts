/**
 * PERFIL MODULE — Barrel Export (API Pública)
 *
 * Módulo de visualização e edição do perfil do usuário autenticado.
 * Camada de apresentação sobre o módulo `usuarios`.
 */

// =============================================================================
// Components
// =============================================================================

export { PerfilView } from './components/perfil-view';
export { PerfilEditSheet } from './components/perfil-edit-sheet';
export { AlterarSenhaDialog } from './components/alterar-senha-dialog';

// =============================================================================
// Hooks
// =============================================================================

export { usePerfil } from './hooks/use-perfil';

// =============================================================================
// Actions
// =============================================================================

export { actionObterPerfil, actionAtualizarPerfil } from './actions/perfil-actions';

// =============================================================================
// Types / Domain
// =============================================================================

export type { Usuario } from './domain';
