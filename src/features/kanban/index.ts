// =============================================================================
// Barrel exports — src/features/kanban
// =============================================================================

// --- Domain types ---
export type {
  KanbanBoardData,
  KanbanAssignableUser,
  KanbanColumn,
  KanbanTask,
  KanbanTaskPriority,
  KanbanTaskUser,
  CreateKanbanColumnInput,
  CreateKanbanTaskInput,
  SyncKanbanBoardInput,
  // Multi-board types
  KanbanBoardSource,
  KanbanBoardType,
  KanbanBoardDef,
  KanbanCardSource,
  UnifiedKanbanCard,
  SystemBoardData,
  CriarQuadroCustomInput,
  ObterQuadroSistemaInput,
  ObterQuadroCustomInput,
  AtualizarStatusEntidadeInput,
} from "./domain";

// --- Domain schemas & constants ---
export {
  kanbanBoardSchema,
  kanbanColumnSchema,
  kanbanTaskSchema,
  KANBAN_BOARD_SOURCES,
  SYSTEM_BOARDS,
  SYSTEM_BOARD_COLUMNS,
  kanbanBoardSourceSchema,
  unifiedKanbanCardSchema,
  buildKanbanCardId,
} from "./domain";

// --- Service ---
export * as kanbanService from "./service";

// --- Actions (custom board) ---
export {
  actionCriarColunaKanban,
  actionCriarTarefaKanban,
  actionSincronizarKanban,
  actionListarUsuariosKanban,
  actionExcluirColunaKanban,
} from "./actions/kanban-actions";

// --- Actions (multi-board) ---
export {
  actionListarQuadros,
  actionObterQuadroSistema,
  actionObterQuadroCustom,
  actionCriarQuadroCustom,
  actionExcluirQuadroCustom,
  actionAtualizarStatusEntidade,
} from "./actions/quadro-actions";

// --- Components ---
export { KanbanPageContent } from "./components/kanban-page-content";
