/**
 * Event Aggregation Module
 *
 * Agrega eventos do sistema (audiências, expedientes, perícias, obrigações)
 * em formato unificado para consumo por Tarefas e To-Do.
 */

// Domain
export type { EventSource, UnifiedEventItem, TarefaStatus, TodoStatusValue, PriorityValue } from "./domain";
export {
  eventSourceSchema,
  SOURCE_LABELS,
  SOURCE_BADGE_VARIANTS,
  mapSourceStatusToTarefaStatus,
  mapSourceStatusToTodoStatus,
  calcularPrioridade,
  buildEventId,
} from "./domain";

// Service (aggregation)
export {
  listarTodosEventos,
  atualizarStatusEntidadeOrigem,
  audienciaToEventItem,
  expedienteToEventItem,
  periciaToEventItem,
  acordoParcelasToEventItems,
} from "./service";
export type { ListarEventosOptions, AtualizarStatusEventoInput } from "./service";

// Service (replication to To-Do)
export {
  replicarEventoParaTodo,
  sincronizarTodoComEvento,
  backfillTodosFromEvents,
} from "./replication.service";
