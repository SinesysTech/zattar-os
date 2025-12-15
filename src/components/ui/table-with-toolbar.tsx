"use client"

/**
 * @deprecated Use `DataShell` + `DataTable` de `@/components/shared/data-shell` em vez deste componente.
 *
 * Este componente será removido em uma versão futura.
 *
 * Migração:
 * ```tsx
 * // Antes (deprecated)
 * import { TableWithToolbar } from '@/components/ui/table-with-toolbar';
 *
 * // Depois (correto)
 * import { DataShell, DataTable, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
 *
 * // Veja src/features/partes/components/clientes/clientes-table-wrapper.tsx para exemplo completo.
 * ```
 */

/**
 * TableWithToolbar
 *
 * @deprecated Este componente é legado. Use DataShell + DataTable.
 *
 * Componente unificado que integra TableToolbar + ResponsiveTable/DataTable
 * para garantir consistência visual total em todas as implementações de tabela no app.
 *
 * Features:
 * - Busca integrada com debounce
 * - Filtros (single, buttons ou panel mode)
 * - Paginação server-side
 * - Ordenação server-side
 * - Seleção de linhas
 * - Ações de linha
 * - Layout responsivo (table/cards)
 * - Estados de loading e erro
 * - Botão de criar novo item
 * - Botões extras customizáveis
 */

import * as React from "react"
import { TableToolbar, type ComboboxOption, type FilterGroup } from "@/components/ui/table-toolbar"
import { ResponsiveTable, type ResponsiveTableColumn, type ResponsiveTableProps } from "@/components/ui/responsive-table"
import { cn } from "@/lib/utils"

export interface TableWithToolbarProps<TData> extends Omit<ResponsiveTableProps<TData>, 'columns' | 'data'> {
    // Dados e colunas
    data: TData[]
    columns: ResponsiveTableColumn<TData>[]

    // Busca
    searchValue: string
    onSearchChange: (value: string) => void
    isSearching?: boolean
    searchPlaceholder?: string

    // Filtros
    filterOptions?: ComboboxOption[]
    filterGroups?: FilterGroup[]
    selectedFilters?: string[]
    onFiltersChange?: (filters: string[]) => void
    filterButtonsMode?: "single" | "buttons" | "panel"
    filterPanelTitle?: string
    filterPanelDescription?: string
    showFilterButton?: boolean

    // Botão de criar
    onNewClick?: () => void
    newButtonTooltip?: string

    // Botões extras na toolbar
    extraButtons?: React.ReactNode

    // View Toggle (opcional)
    viewToggle?: React.ReactNode

    // Classes customizadas
    className?: string
    toolbarClassName?: string
    tableClassName?: string
}

/**
 * Componente unificado de Tabela com Toolbar
 * 
 * Este componente garante consistência visual total em todas as tabelas do app,
 * integrando busca, filtros, paginação e a tabela responsiva em um único componente.
 */
export function TableWithToolbar<TData>({
    // Dados e colunas
    data,
    columns,

    // Busca
    searchValue,
    onSearchChange,
    isSearching = false,
    searchPlaceholder = "Buscar...",

    // Filtros
    filterOptions = [],
    filterGroups,
    selectedFilters = [],
    onFiltersChange = () => { },
    filterButtonsMode = "single",
    filterPanelTitle = "Filtros",
    filterPanelDescription,
    showFilterButton = true,

    // Botão de criar
    onNewClick,
    newButtonTooltip = "Novo",

    // Botões extras
    extraButtons,

    // View Toggle
    viewToggle,

    // Props da ResponsiveTable
    pagination,
    sorting,
    rowSelection,
    isLoading = false,
    error = null,
    mobileLayout = "scroll",
    stickyFirstColumn = false,
    mobileVisibleColumns,
    rowActions,
    onRowClick,
    emptyMessage = "Nenhum resultado encontrado.",
    hideTableBorder = false,
    hideColumnBorders = false,

    // Classes
    className,
    toolbarClassName,
    tableClassName,
}: TableWithToolbarProps<TData>) {
    return (
        <div className={cn("space-y-0", className)}>
            {/* Toolbar de busca e filtros */}
            <TableToolbar
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                isSearching={isSearching}
                searchPlaceholder={searchPlaceholder}
                filterOptions={filterOptions}
                filterGroups={filterGroups}
                selectedFilters={selectedFilters}
                onFiltersChange={onFiltersChange}
                filterButtonsMode={filterButtonsMode}
                filterPanelTitle={filterPanelTitle}
                filterPanelDescription={filterPanelDescription}
                showFilterButton={showFilterButton}
                extraButtons={
                    <>
                        {extraButtons}
                        {viewToggle}
                    </>
                }
                onNewClick={onNewClick}
                newButtonTooltip={newButtonTooltip}
                className={toolbarClassName}
            />

            {/* Tabela responsiva */}
            <ResponsiveTable
                data={data}
                columns={columns}
                pagination={pagination}
                sorting={sorting}
                rowSelection={rowSelection}
                isLoading={isLoading}
                error={error}
                mobileLayout={mobileLayout}
                stickyFirstColumn={stickyFirstColumn}
                mobileVisibleColumns={mobileVisibleColumns}
                rowActions={rowActions}
                onRowClick={onRowClick}
                emptyMessage={emptyMessage}
                hideTableBorder={hideTableBorder}
                hideColumnBorders={hideColumnBorders}
                className={tableClassName}
            />
        </div>
    )
}

// Exportar tipos para facilitar uso
export type { ResponsiveTableColumn } from "@/components/ui/responsive-table"
export type { ComboboxOption, FilterGroup } from "@/components/ui/table-toolbar"
