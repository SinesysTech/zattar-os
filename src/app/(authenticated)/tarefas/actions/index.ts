/**
 * Tarefas — Server Actions (Barrel Export)
 *
 * Re-exporta todas as server actions do módulo de tarefas.
 * Importações cross-módulo devem usar este barrel.
 */

// =============================================================================
// LEITURA
// =============================================================================
export {
    actionListarTarefas,
    actionListarTarefasSafe,
    actionBuscarTarefa,
} from './tarefas-actions';

// =============================================================================
// ESCRITA
// =============================================================================
export {
    actionCriarTarefa,
    actionAtualizarTarefa,
    actionRemoverTarefa,
    actionMarcarComoDone,
    actionMarcarComoTodo,
} from './tarefas-actions';

// =============================================================================
// MATERIALIZAÇÃO DE TAREFAS VIRTUAIS
// =============================================================================
export { actionMaterializarTarefaVirtual } from './tarefas-actions';

// =============================================================================
// SUBTAREFAS, COMENTÁRIOS E ANEXOS
// =============================================================================
export {
    actionCriarSubtarefa,
    actionAtualizarSubtarefa,
    actionRemoverSubtarefa,
    actionAdicionarComentario,
    actionRemoverComentario,
    actionAdicionarAnexo,
    actionRemoverAnexo,
} from './tarefas-actions';

// =============================================================================
// QUADROS (KANBAN BOARDS)
// =============================================================================
export {
    actionListarQuadros,
    actionCriarQuadroCustom,
    actionExcluirQuadroCustom,
    actionReordenarTarefas,
    actionAtualizarStatusQuadroSistema,
    actionMoverTarefaParaQuadro,
} from './tarefas-actions';

// =============================================================================
// TIPOS
// =============================================================================
export type { ActionResult } from './tarefas-actions';
