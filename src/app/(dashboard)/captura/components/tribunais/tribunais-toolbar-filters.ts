export type TribunaisFilters = {
  tribunal_codigo?: string;
  tipo_acesso?: string;
};

export type FilterOption = { id: string; label: string };
export type FilterGroup = { id: string; label: string; options: FilterOption[] };

export function buildTribunaisFilterOptions(): FilterOption[] {
  return [
    { id: 'tipo_acesso:primeiro_grau', label: 'Acesso 1º grau' },
    { id: 'tipo_acesso:segundo_grau', label: 'Acesso 2º grau' },
    { id: 'tipo_acesso:unificado', label: 'Acesso unificado' },
    { id: 'tipo_acesso:unico', label: 'Acesso único' },
  ];
}

export function buildTribunaisFilterGroups(): FilterGroup[] {
  return [
    {
      id: 'tipo_acesso',
      label: 'Tipo de acesso',
      options: [
        { id: 'tipo_acesso:primeiro_grau', label: '1º grau' },
        { id: 'tipo_acesso:segundo_grau', label: '2º grau' },
        { id: 'tipo_acesso:unificado', label: 'Unificado' },
        { id: 'tipo_acesso:unico', label: 'Único' },
      ],
    },
  ];
}

export function parseTribunaisFilters(selectedIds: string[]): TribunaisFilters {
  const filters: TribunaisFilters = {};
  for (const id of selectedIds) {
    const [key, raw] = id.split(':');
    if (!key || !raw) continue;
    if (key === 'tribunal_codigo') filters.tribunal_codigo = raw;
    if (key === 'tipo_acesso') filters.tipo_acesso = raw;
  }
  return filters;
}


