/**
 * Tarefas Feature Module — Barrel Export (API Pública)
 *
 * Ponto de entrada público do módulo de tarefas.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 */

// ============================================================================
// Components
// ============================================================================
// Componentes são importados diretamente de ./components/ pelos consumidores internos.
// Não re-exportamos aqui para evitar bundle desnecessário no server.

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  // Leitura
  actionListarTarefas,
  actionListarTarefasSafe,
  actionBuscarTarefa,
  // Escrita
  actionCriarTarefa,
  actionAtualizarTarefa,
  actionRemoverTarefa,
  actionMarcarComoDone,
  actionMarcarComoTodo,
  // Materialização
  actionMaterializarTarefaVirtual,
  // Subtarefas, Comentários e Anexos
  actionCriarSubtarefa,
  actionAtualizarSubtarefa,
  actionRemoverSubtarefa,
  actionAdicionarComentario,
  actionRemoverComentario,
  actionAdicionarAnexo,
  actionRemoverAnexo,
  // Quadros (Kanban)
  actionListarQuadros,
  actionCriarQuadroCustom,
  actionExcluirQuadroCustom,
  actionReordenarTarefas,
  actionAtualizarStatusQuadroSistema,
  actionMoverTarefaParaQuadro,
} from './actions';

export type { ActionResult } from './actions';

// ============================================================================
// Types / Domain
// ============================================================================
export type {
  Task,
  TaskLabel,
  TaskPriority,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksParams,
  TarefaDisplayItem,
  TaskAssignee,
  TaskSubTask,
  TaskComment,
  TaskFile,
  CreateSubTaskInput,
  UpdateSubTaskInput,
  DeleteSubTaskInput,
  AddCommentInput,
  DeleteCommentInput,
  AddFileInput,
  RemoveFileInput,
  MaterializeVirtualTaskInput,
  Quadro,
  QuadroTipo,
  QuadroSource,
  SystemBoardSource,
  SystemBoardColumn,
  SystemBoardDefinition,
  CriarQuadroCustomInput,
  ExcluirQuadroCustomInput,
  ReordenarTarefasInput,
  SystemBoardDndInput,
} from './domain';

export {
  taskSchema,
  taskStatusSchema,
  taskLabelSchema,
  taskPrioritySchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  quadroSchema,
  QUADROS_SISTEMA,
  SYSTEM_BOARD_DEFINITIONS,
  getSystemBoardBySlug,
} from './domain';

// ============================================================================
// Constants (UI)
// ============================================================================
export { statuses, priorities, labels } from './constants';

// ============================================================================
// Service
// ============================================================================
export * as tarefasService from './service';

// ============================================================================
// Errors
// ============================================================================
export {
  QUADRO_CUSTOM_UNAVAILABLE_MESSAGE,
  normalizeQuadroActionErrorMessage,
} from './errors';
