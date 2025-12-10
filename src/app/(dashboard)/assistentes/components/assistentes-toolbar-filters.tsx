import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { AssistentesFilters } from '@/core/app/_lib/types/assistentes';

export const ASSISTENTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'ativo',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' },
    ],
    searchText: 'status ativo inativo situacao',
  },
];

export function buildAssistentesFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(ASSISTENTES_FILTER_CONFIGS);
}

export function buildAssistentesFilterGroups(): FilterGroup[] {
  const options: ComboboxOption[] = [];

  for (const config of ASSISTENTES_FILTER_CONFIGS) {
    if (config.type === 'select' || config.type === 'multiselect') {
      if (config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: opt.label,
            searchText: config.searchText || opt.searchText,
          });
        }
      }
    } else if (config.type === 'boolean') {
      options.push({
        value: config.id,
        label: config.label,
        searchText: config.searchText,
      });
    }
  }

  return [
    {
      label: 'Status',
      options,
    },
  ];
}

export function parseAssistentesFilters(selectedFilters: string[]): AssistentesFilters {
  return parseFilterValues(selectedFilters, ASSISTENTES_FILTER_CONFIGS) as AssistentesFilters;
}