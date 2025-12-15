/**
 * Barrel export para Componentes do módulo financeiro
 */

// Componentes gerais
export * from './export-button';
export * from './shared';

// Contas a Pagar
export * from './contas-pagar/alertas-vencimento';
export * from './contas-pagar/conta-pagar-form-dialog';
export {
    buildContasPagarFilterOptions,
    buildContasPagarFilterGroups,
    parseContasPagarFilters,
    filtersToSelectedIds as contasPagarFiltersToSelectedIds,
} from './contas-pagar/contas-pagar-toolbar-filters';
export * from './contas-pagar/pagar-conta-dialog';

// Contas a Receber
export * from './contas-receber/alertas-inadimplencia';
export * from './contas-receber/conta-receber-form-dialog';
export {
    buildContasReceberFilterOptions,
    buildContasReceberFilterGroups,
    parseContasReceberFilters,
    filtersToSelectedIds as contasReceberFiltersToSelectedIds,
} from './contas-receber/contas-receber-toolbar-filters';
export * from './contas-receber/receber-conta-dialog';

// Obrigações
export * from './obrigacoes/alertas-obrigacoes';
export * from './obrigacoes/obrigacao-detalhes-dialog';
export * from './obrigacoes/repasse-tracking';
export * from './obrigacoes/resumo-cards';

// Conciliação
export * from './conciliacao/alertas-conciliacao';
export * from './conciliacao/conciliacao-toolbar-filters';
export * from './conciliacao/conciliar-manual-dialog';
export * from './conciliacao/importar-extrato-dialog';
export * from './conciliacao/transacoes-importadas-table';

// Plano de Contas
export * from './plano-contas/plano-conta-create-dialog';
export * from './plano-contas/plano-conta-edit-dialog';
export * from './plano-contas/plano-conta-select';
export * from './plano-contas/plano-contas-toolbar-filters';

// Orçamentos
export * from './orcamentos';

// Dashboard
export { FinanceiroDashboard } from './dashboard/financeiro-dashboard';
