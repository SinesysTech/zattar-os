/**
 * Barrel exports para o módulo `tarefas` (template tasks)
 */

export type { Task, TaskLabel, TaskPriority, TaskStatus, CreateTaskInput, UpdateTaskInput, ListTasksParams } from "./domain";
export { taskSchema, createTaskSchema, updateTaskSchema, listTasksSchema } from "./domain";

export * as tarefasService from "./service";

export {
  actionListarTarefas,
  actionListarTarefasSafe,
  actionBuscarTarefa,
  actionCriarTarefa,
  actionAtualizarTarefa,
  actionRemoverTarefa,
  actionMarcarComoDone,
  actionMarcarComoTodo,
  type ActionResult,
} from "./actions/tarefas-actions";

