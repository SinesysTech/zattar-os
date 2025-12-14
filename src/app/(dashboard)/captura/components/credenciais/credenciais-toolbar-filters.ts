export type CredenciaisFilters = {
  tribunal?: string;
  grau?: string;
  active?: boolean;
};

export type FilterOption = { id: string; label: string };

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
};

export function buildCredenciaisFilterOptions(): FilterOption[] {
  return [
    { id: 'active:true', label: 'Ativas' },
    { id: 'active:false', label: 'Inativas' },
    { id: 'grau:primeiro_grau', label: '1º grau' },
    { id: 'grau:segundo_grau', label: '2º grau' },
    { id: 'grau:tribunal_superior', label: 'Tribunal superior' },
  ];
}

export function buildCredenciaisFilterGroups(): FilterGroup[] {
  return [
    {
      id: 'status',
      label: 'Status',
      options: [
        { id: 'active:true', label: 'Ativas' },
        { id: 'active:false', label: 'Inativas' },
      ],
    },
    {
      id: 'grau',
      label: 'Grau',
      options: [
        { id: 'grau:primeiro_grau', label: '1º grau' },
        { id: 'grau:segundo_grau', label: '2º grau' },
        { id: 'grau:tribunal_superior', label: 'Tribunal superior' },
      ],
    },
  ];
}

export function parseCredenciaisFilters(selectedIds: string[]): CredenciaisFilters {
  const filters: CredenciaisFilters = {};

  for (const id of selectedIds) {
    const [key, raw] = id.split(':');
    if (!key) continue;

    if (key === 'tribunal' && raw) filters.tribunal = raw;
    if (key === 'grau' && raw) filters.grau = raw;
    if (key === 'active' && raw) filters.active = raw === 'true';
  }

  return filters;
}


