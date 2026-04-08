/**
 * Project Management Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de gestão de projetos.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 */

// ============================================================================
// Components
// ============================================================================
export {
    // Dashboard
    SummaryCards,
    ChartProjectOverview,
    ChartProjectEfficiency,
    TableRecentProjects,
    Reminders,
    SuccessMetrics,
    AchievementByYear,
    Reports,
    // Shared
    MemberAvatarGroup,
    ProgressIndicator,
    ProjectStatusBadge,
    TaskStatusBadge,
    PriorityIndicator,
} from "./components";

// ============================================================================
// Hooks
// ============================================================================
export { useTaskBoard } from "./hooks/use-task-board";

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
    actionListarProjetos,
    actionBuscarProjeto,
    actionCriarProjeto,
    actionAtualizarProjeto,
    actionExcluirProjeto,
    actionListarTarefasPorProjeto,
    actionListarTarefasGlobal,
    actionCriarTarefa,
    actionAtualizarTarefa,
    actionExcluirTarefa,
    actionReordenarKanban,
    actionListarMembros,
    actionAdicionarMembro,
    actionRemoverMembro,
    actionAlterarPapel,
    actionListarLembretes,
    actionCriarLembrete,
    actionConcluirLembrete,
    actionExcluirLembrete,
    actionListarAnexos,
    actionUploadAnexo,
    actionExcluirAnexo,
} from "./actions";

// ============================================================================
// Types / Domain
// ============================================================================
export type {
    StatusProjeto,
    StatusTarefa,
    Prioridade,
    PapelProjeto,
    Projeto,
    Tarefa,
    MembroProjeto,
    Lembrete,
    Comentario,
    Anexo,
    DashboardSummary,
    ProjetosPorPeriodo,
    DistribuicaoPorStatus,
    ComparativoAnual,
    MembroAtivo,
    ListarProjetosParams,
    ProjetoSortBy,
    ListarTarefasParams,
    TarefaSortBy,
    CreateProjetoInput,
    UpdateProjetoInput,
    CreateTarefaInput,
    UpdateTarefaInput,
    UpdateKanbanOrderInput,
    AddMembroInput,
    UpdateMembroInput,
    CreateLembreteInput,
    CreateComentarioInput,
} from "./domain";

export {
    STATUS_PROJETO_VALUES,
    STATUS_TAREFA_VALUES,
    PRIORIDADE_VALUES,
    PAPEL_PROJETO_VALUES,
    STATUS_PROJETO_LABELS,
    STATUS_TAREFA_LABELS,
    KANBAN_COLUMNS,
    PRIORIDADE_LABELS,
    PAPEL_PROJETO_LABELS,
    // Schemas
    statusProjetoSchema,
    statusTarefaSchema,
    prioridadeSchema,
    papelProjetoSchema,
    createProjetoSchema,
    updateProjetoSchema,
    createTarefaSchema,
    updateTarefaSchema,
    updateKanbanOrderSchema,
    addMembroSchema,
    updateMembroSchema,
    createLembreteSchema,
    createComentarioSchema,
    // Converters
    converterParaProjeto,
    converterParaTarefa,
    converterParaMembro,
    converterParaLembrete,
    converterParaComentario,
    converterParaAnexo,
} from "./domain";
