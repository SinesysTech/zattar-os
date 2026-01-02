/**
 * Barrel exports para a feature de Tasks/Tarefas
 */

// Domain
export type {
  Tarefa,
  CreateTarefaInput,
  UpdateTarefaInput,
  ListarTarefasParams,
  StatusTarefaDB,
  TodoStatus,
  TodoPriority,
} from './domain';
export {
  createTarefaSchema,
  updateTarefaSchema,
  listarTarefasSchema,
  mapStatusDBToFrontend,
  mapStatusFrontendToDB,
  mapPrioridadeToFrontend,
  mapPrioridadeToDB,
  statusLabels,
  prioridadeLabels,
} from './domain';

// Service
export * as tarefasService from './service';

// Actions
export {
  actionListarTarefas,
  actionBuscarTarefa,
  actionCriarTarefa,
  actionAtualizarTarefa,
  actionRemoverTarefa,
  actionConcluirTarefa,
  actionReabrirTarefa,
} from './actions/tarefas-actions';

// Components
export { TarefasContent } from './components/tarefas-content';

