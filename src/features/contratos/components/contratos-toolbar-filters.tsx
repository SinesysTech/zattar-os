/**
 * CONTRATOS FEATURE - Configuração de Filtros da Toolbar
 *
 * Define os filtros disponíveis para a tabela de contratos.
 */

import { FilterConfig, buildFilterOptions, parseFilterValues, type ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { ContratosFilters } from '../domain';

export const CONTRATOS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'areaDireito',
    label: 'Área de Direito',
    type: 'select',
    options: [
      { value: 'trabalhista', label: 'Trabalhista' },
      { value: 'civil', label: 'Civil' },
      { value: 'previdenciario', label: 'Previdenciário' },
      { value: 'criminal', label: 'Criminal' },
      { value: 'empresarial', label: 'Empresarial' },
      { value: 'administrativo', label: 'Administrativo' },
    ],
    searchText: 'área direito trabalhista civil previdenciário criminal empresarial administrativo',
  },
  {
    id: 'tipoContrato',
    label: 'Tipo de Contrato',
    type: 'select',
    options: [
      { value: 'ajuizamento', label: 'Ajuizamento' },
      { value: 'defesa', label: 'Defesa' },
      { value: 'ato_processual', label: 'Ato Processual' },
      { value: 'assessoria', label: 'Assessoria' },
      { value: 'consultoria', label: 'Consultoria' },
      { value: 'extrajudicial', label: 'Extrajudicial' },
      { value: 'parecer', label: 'Parecer' },
    ],
    searchText: 'tipo contrato ajuizamento defesa ato processual assessoria consultoria extrajudicial parecer',
  },
  {
    id: 'tipoCobranca',
    label: 'Tipo de Cobrança',
    type: 'select',
    options: [
      { value: 'pro_exito', label: 'Pró-Êxito' },
      { value: 'pro_labore', label: 'Pró-Labore' },
    ],
    searchText: 'tipo cobrança pró-êxito pró-labore pro exito pro labore',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'em_contratacao', label: 'Em Contratação' },
      { value: 'contratado', label: 'Contratado' },
      { value: 'distribuido', label: 'Distribuído' },
      { value: 'desistencia', label: 'Desistência' },
    ],
    searchText: 'status em contratação contratado distribuído desistência',
  },
];

export function buildContratosFilterOptions() {
  return buildFilterOptions(CONTRATOS_FILTER_CONFIGS);
}

/**
 * Constrói grupos de filtros para interface hierárquica
 */
export function buildContratosFilterGroups(): FilterGroup[] {
  const configMap = new Map(CONTRATOS_FILTER_CONFIGS.map(c => [c.id, c]));

  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' && config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: opt.label, // SEM prefixo do grupo
            searchText: config.searchText || opt.searchText,
          });
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
      label: 'Área de Direito',
      options: buildOptionsWithoutPrefix([configMap.get('areaDireito')!]),
    },
    {
      label: 'Tipo de Contrato',
      options: buildOptionsWithoutPrefix([configMap.get('tipoContrato')!]),
    },
    {
      label: 'Tipo de Cobrança',
      options: buildOptionsWithoutPrefix([configMap.get('tipoCobranca')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([configMap.get('status')!]),
    },
  ];
}

export function parseContratosFilters(selectedFilters: string[]): ContratosFilters {
  const parsed = parseFilterValues(selectedFilters, CONTRATOS_FILTER_CONFIGS);
  return {
    areaDireito: parsed.areaDireito,
    tipoContrato: parsed.tipoContrato,
    tipoCobranca: parsed.tipoCobranca,
    status: parsed.status,
  };
}
