'use client';

/**
 * Configuração de filtros para a página de Orçamentos
 */

import {
    FilterConfig,
    buildFilterOptions,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type {
    StatusOrcamento,
    PeriodoOrcamento,
    OrcamentosFilters,
} from '@/features/financeiro/domain/orcamentos';

// ============================================================================
// Configuração de Filtros
// ============================================================================

export const ORCAMENTOS_FILTER_CONFIGS: FilterConfig[] = [
    {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: 'rascunho', label: 'Rascunho' },
            { value: 'aprovado', label: 'Aprovado' },
            { value: 'em_execucao', label: 'Em Execução' },
            { value: 'encerrado', label: 'Encerrado' },
        ],
        searchText: 'status rascunho aprovado execucao encerrado',
    },
    {
        id: 'periodo',
        label: 'Período',
        type: 'select',
        options: [
            { value: 'mensal', label: 'Mensal' },
            { value: 'trimestral', label: 'Trimestral' },
            { value: 'semestral', label: 'Semestral' },
            { value: 'anual', label: 'Anual' },
        ],
        searchText: 'periodo mensal trimestral semestral anual',
    },
    {
        id: 'ano',
        label: 'Ano',
        type: 'select',
        options: (() => {
            const currentYear = new Date().getFullYear();
            const years: ComboboxOption[] = [];
            for (let y = currentYear + 1; y >= currentYear - 5; y--) {
                years.push({ value: y.toString(), label: y.toString() });
            }
            return years;
        })(),
        searchText: 'ano',
    },
];

// ============================================================================
// Builders
// ============================================================================

/**
 * Constrói as opções de filtro para a toolbar
 */
export const buildOrcamentosFilterOptions = (): ComboboxOption[] => {
    return buildFilterOptions(ORCAMENTOS_FILTER_CONFIGS);
};

/**
 * Constrói os grupos de filtros para exibição agrupada
 */
export const buildOrcamentosFilterGroups = (): FilterGroup[] => {
    const configMap = new Map(ORCAMENTOS_FILTER_CONFIGS.map((c) => [c.id, c]));

    const buildOptionsForConfig = (config: FilterConfig): ComboboxOption[] => {
        const options: ComboboxOption[] = [];
        if (config.options) {
            for (const opt of config.options) {
                options.push({
                    value: `${config.id}_${opt.value}`,
                    label: opt.label,
                    searchText: config.searchText || opt.searchText,
                });
            }
        }
        return options;
    };

    return [
        {
            label: 'Status',
            options: buildOptionsForConfig(configMap.get('status')!),
        },
        {
            label: 'Período',
            options: buildOptionsForConfig(configMap.get('periodo')!),
        },
        {
            label: 'Ano',
            options: buildOptionsForConfig(configMap.get('ano')!),
        },
    ];
};

/**
 * Extrai os filtros a partir dos IDs selecionados
 */
export const parseOrcamentosFilters = (selectedIds: string[]): OrcamentosFilters => {
    const filters: OrcamentosFilters = {};

    // Status
    const statusValues: StatusOrcamento[] = [];
    selectedIds.forEach((id) => {
        if (id.startsWith('status_')) {
            const status = id.replace('status_', '') as StatusOrcamento;
            statusValues.push(status);
        }
    });
    if (statusValues.length === 1) {
        filters.status = statusValues[0];
    } else if (statusValues.length > 1) {
        filters.status = statusValues;
    }

    // Período
    selectedIds.forEach((id) => {
        if (id.startsWith('periodo_')) {
            filters.periodo = id.replace('periodo_', '') as PeriodoOrcamento;
        }
    });

    // Ano
    selectedIds.forEach((id) => {
        if (id.startsWith('ano_')) {
            filters.ano = parseInt(id.replace('ano_', ''), 10);
        }
    });

    return filters;
};

/**
 * Converte filtros para IDs selecionados
 */
export const filtersToSelectedIds = (filters: OrcamentosFilters): string[] => {
    const ids: string[] = [];

    // Status
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            filters.status.forEach((s) => ids.push(`status_${s}`));
        } else {
            ids.push(`status_${filters.status}`);
        }
    }

    // Período
    if (filters.periodo) {
        ids.push(`periodo_${filters.periodo}`);
    }

    // Ano
    if (filters.ano) {
        ids.push(`ano_${filters.ano}`);
    }

    return ids;
};
