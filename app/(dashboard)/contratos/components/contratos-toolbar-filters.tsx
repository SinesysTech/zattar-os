import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { ContratosFilters } from '@/lib/types/contratos';

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

export function parseContratosFilters(selectedFilters: string[]): ContratosFilters {
  const parsed = parseFilterValues(selectedFilters, CONTRATOS_FILTER_CONFIGS);
  return {
    areaDireito: parsed.areaDireito,
    tipoContrato: parsed.tipoContrato,
    tipoCobranca: parsed.tipoCobranca,
    status: parsed.status,
  };
}