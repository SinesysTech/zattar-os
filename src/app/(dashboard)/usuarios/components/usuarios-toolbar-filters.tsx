import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { UsuariosFilters } from '@/app/_lib/types/usuarios';

// UFs do Brasil
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const USUARIOS_FILTER_CONFIGS: FilterConfig[] = [
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
  {
    id: 'ufOab',
    label: 'UF OAB',
    type: 'select',
    options: UFS.map(uf => ({ value: uf, label: uf })),
    searchText: 'uf oab estado',
  },
  {
    id: 'tem_oab',
    label: 'Possui OAB',
    type: 'boolean',
    searchText: 'oab advogado inscricao',
  },
  {
    id: 'super_admin',
    label: 'Super Administrador',
    type: 'boolean',
    searchText: 'super admin administrador root',
  },
];

export function buildUsuariosFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(USUARIOS_FILTER_CONFIGS);
}

export function buildUsuariosFilterGroups(): FilterGroup[] {
  // Criar mapeamento de configs por ID para fácil acesso
  const configMap = new Map(USUARIOS_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
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

    return options;
  };

  return [
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('ativo')!,
      ]),
    },
    {
      label: 'OAB',
      options: buildOptionsWithoutPrefix([
        configMap.get('ufOab')!,
        configMap.get('tem_oab')!,
      ]),
    },
    {
      label: 'Permissões',
      options: buildOptionsWithoutPrefix([
        configMap.get('super_admin')!,
      ]),
    },
  ];
}

export function parseUsuariosFilters(selectedFilters: string[]): UsuariosFilters {
  return parseFilterValues(selectedFilters, USUARIOS_FILTER_CONFIGS) as UsuariosFilters;
}
