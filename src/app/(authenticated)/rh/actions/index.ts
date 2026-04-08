// ============================================================================
// RH — Server Actions (Barrel Export)
// ============================================================================

// --- Salários ---
export {
    actionListarSalarios,
    actionBuscarSalario,
    actionCriarSalario,
    actionAtualizarSalario,
    actionEncerrarVigenciaSalario,
    actionInativarSalario,
    actionExcluirSalario,
    actionBuscarSalariosDoUsuario,
} from './salarios-actions';

// --- Folhas de Pagamento ---
export {
    actionListarFolhasPagamento,
    actionBuscarFolhaPagamento,
    actionBuscarFolhaPorPeriodo,
    actionGerarFolhaPagamento,
    actionPreviewGerarFolha,
    actionAprovarFolhaPagamento,
    actionPagarFolhaPagamento,
    actionAtualizarFolhaPagamento,
    actionVerificarCancelamentoFolha,
    actionObterResumoPagamento,
    actionCancelarFolhaPagamento,
    actionExcluirFolhaPagamento,
} from './folhas-pagamento-actions';
