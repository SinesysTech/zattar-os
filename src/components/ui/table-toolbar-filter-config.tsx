export interface ComboboxOption {
  value: string
  label: string
  searchText?: string
}

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
    } else if (config.type === 'boolean') {
      // Only include boolean filters in the combobox
      // Text and date filters require input controls and should be handled separately
      options.push({
        value: config.id,
        label: config.label,
        searchText: config.searchText,
      });
    }
    // Skip 'text' and 'date' types - they need dedicated input controls
  }

  return options;
}

export function parseFilterValues(selectedFilters: string[], configs: FilterConfig[]): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
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
          (filters[id] as unknown[]).push(value);
        }
      }
    } else {
      // for boolean type only
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        filters[selected] = true;
      }
      // text and date types are not handled here since they require dedicated input controls
    }
  }

  return filters;
}