import { ComboboxOption } from './combobox';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean' | 'multiselect';
  options?: ComboboxOption[];
  placeholder?: string;
  searchText?: string;
}

export function buildFilterOptions(configs: FilterConfig[]): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of configs) {
    if (config.type === 'select' || config.type === 'multiselect') {
      if (config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: `${config.label}: ${opt.label}`,
            searchText: config.searchText || opt.searchText,
          });
        }
      }
    } else {
      // for boolean, text, date
      options.push({
        value: config.id,
        label: config.label,
        searchText: config.searchText,
      });
    }
  }

  return options;
}

export function parseFilterValues(selectedFilters: string[], configs: FilterConfig[]): Record<string, any> {
  const filters: Record<string, any> = {};
  const configMap = new Map(configs.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      // for select/multiselect, value is id_value
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);
      if (config) {
        if (config.type === 'select') {
          filters[id] = value;
        } else if (config.type === 'multiselect') {
          if (!filters[id]) filters[id] = [];
          filters[id].push(value);
        }
      }
    } else {
      // for boolean, text, date, value is id
      const config = configMap.get(selected);
      if (config) {
        if (config.type === 'boolean') {
          filters[selected] = true;
        } else if (config.type === 'text' || config.type === 'date') {
          // Indicate enabled, but no value input in combobox
          filters[selected] = true;
        }
      }
    }
  }

  return filters;
}