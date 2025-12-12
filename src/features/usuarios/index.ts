// Types
export type {
  Usuario,
  UsuarioDados,
  ListarUsuariosParams,
  ListarUsuariosResult,
  OperacaoUsuarioResult,
  UsuarioDetalhado,
  Permissao,
  PermissaoMatriz,
  PermissoesSaveState,
  ViewMode,
  GeneroUsuario,
  Endereco,
  UsuariosFilters,
} from "./domain";

// Domain
export {
  GENERO_LABELS,
  STATUS_LABELS,
  cpfSchema,
  emailSchema,
  telefoneSchema,
  enderecoSchema,
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  isUsuarioAtivo,
  isSuperAdmin,
} from "./domain";

// Utils
export {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
  normalizarCpf,
  getAvatarUrl,
} from "./utils";

// Permissions Utils
export {
  formatarPermissoesParaMatriz,
  formatarMatrizParaPermissoes,
  formatarNomeRecurso,
  formatarNomeOperacao,
  contarPermissoesAtivas,
  detectarMudancas,
} from "./permissions-utils";

// Service Functions
// NOTE: Server-side service and repository are NOT exported here to prevent
// Redis/Node.js dependencies from being bundled in client components.
// These should only be used by server actions and can be imported directly:
//   import { service } from '@/features/usuarios/service';
//   import { usuarioRepository } from '@/features/usuarios/repository';

// Actions
export {
  actionRedefinirSenha,
  actionAtualizarSenhaServer,
} from "./actions/senha-actions";

// Hooks
export { useUsuarios } from "./hooks/use-usuarios";
export { useUsuario } from "./hooks/use-usuario";
export { useCargos } from "./hooks/use-cargos";
export { useUsuarioPermissoes } from "./hooks/use-usuario-permissoes";

// Components
export { UsuariosGridView } from "./components/list/usuarios-grid-view";
export { UsuariosPagination } from "./components/list/usuarios-pagination";
export {
  UsuariosToolbarFilters,
  buildUsuariosFilterOptions,
  buildUsuariosFilterGroups,
  parseUsuariosFilters,
} from "./components/list/usuarios-toolbar-filters";
export { ViewToggle } from "./components/list/view-toggle";
export { UsuarioCard } from "./components/shared/usuario-card";
export { UsuarioCreateDialog } from "./components/forms/usuario-create-dialog";
export { UsuarioEditDialog } from "./components/forms/usuario-edit-dialog";
export { UsuarioDadosBasicos } from "./components/forms/usuario-dados-basicos";
export { UsuarioViewSheet } from "./components/detail/usuario-view-sheet";
export { CargosManagementDialog } from "./components/cargos/cargos-management-dialog";
export { RedefinirSenhaDialog } from "./components/password/redefinir-senha-dialog";
export { AvatarEditDialog } from "./components/avatar/avatar-edit-dialog";
export { PermissoesMatriz } from "./components/permissions/permissoes-matriz";
export { UsuariosPageContent } from "./components/usuarios-page-content";
