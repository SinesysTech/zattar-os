/**
 * Componentes compartilhados do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking.
 */

// ============================================================================
// Skeletons para Lazy Loading
// ============================================================================
export { ChartSkeleton } from "./chart-skeleton";

// ============================================================================
// Seções
// ============================================================================
export { OrigemLancamentoSection } from "./origem-lancamento-section";

// ============================================================================
// Filtros - Componentes Reutilizáveis
// ============================================================================
export { FiltroStatus } from "./filtros/filtro-status";
export { FiltroVencimento } from "./filtros/filtro-vencimento";
export { FiltroCategoria } from "./filtros/filtro-categoria";
export { FiltroContaContabil } from "./filtros/filtro-conta-contabil";
export { FiltroCentroCusto } from "./filtros/filtro-centro-custo";
export { FiltroCliente } from "./filtros/filtro-cliente";
export { FiltroFornecedor } from "./filtros/filtro-fornecedor";
export { MaisFiltrosPopover } from "./filtros/mais-filtros-popover";
export { MaisFiltrosReceberPopover } from "./filtros/mais-filtros-receber-popover";
