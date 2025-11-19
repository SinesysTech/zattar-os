import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { ProcessosFilters } from '@/lib/types/acervo';

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

export const PROCESSOS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'origem',
    label: 'Origem',
    type: 'select',
    options: [
      { value: 'acervo_geral', label: 'Acervo Geral' },
      { value: 'arquivado', label: 'Arquivado' },
    ],
    searchText: 'origem fonte',
  },
  {
    id: 'trt',
    label: 'TRT',
    type: 'select',
    options: TRTS.map(trt => ({ value: trt, label: trt })),
    searchText: 'regional tribunal trabalho',
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'primeiro_grau', label: 'Primeiro Grau' },
      { value: 'segundo_grau', label: 'Segundo Grau' },
    ],
    searchText: 'instancia grau judicial',
  },
  {
    id: 'numero_processo',
    label: 'Número do Processo',
    type: 'text',
    placeholder: 'Ex: 0010014-94.2025.5.03.0022',
    searchText: 'numero processo judicial',
  },
  {
    id: 'nome_parte_autora',
    label: 'Parte Autora',
    type: 'text',
    placeholder: 'Nome da parte autora',
    searchText: 'autor parte autora reclamante',
  },
  {
    id: 'nome_parte_re',
    label: 'Parte Ré',
    type: 'text',
    placeholder: 'Nome da parte ré',
    searchText: 'reu parte re reclamado',
  },
  {
    id: 'descricao_orgao_julgador',
    label: 'Órgão Julgador',
    type: 'text',
    placeholder: 'Descrição do órgão julgador',
    searchText: 'orgao julgador vara',
  },
  {
    id: 'classe_judicial',
    label: 'Classe Judicial',
    type: 'text',
    placeholder: 'Ex: ATOrd, ATSum',
    searchText: 'classe judicial rito',
  },
  {
    id: 'codigo_status_processo',
    label: 'Status do Processo',
    type: 'text',
    placeholder: 'Ex: DISTRIBUIDO',
    searchText: 'status processo situacao',
  },
  {
    id: 'segredo_justica',
    label: 'Segredo de Justiça',
    type: 'boolean',
    searchText: 'segredo justica confidencial',
  },
  {
    id: 'juizo_digital',
    label: 'Juízo Digital',
    type: 'boolean',
    searchText: 'juizo digital processo digital',
  },
  {
    id: 'tem_associacao',
    label: 'Com Associação',
    type: 'boolean',
    searchText: 'associacao vinculo',
  },
  {
    id: 'tem_proxima_audiencia',
    label: 'Com Próxima Audiência',
    type: 'boolean',
    searchText: 'proxima audiencia marcada',
  },
  {
    id: 'sem_responsavel',
    label: 'Sem Responsável',
    type: 'boolean',
    searchText: 'sem responsavel advogado',
  },
  {
    id: 'data_autuacao_inicio',
    label: 'Data Autuação - Início',
    type: 'date',
    searchText: 'data autuacao inicio distribuicao',
  },
  {
    id: 'data_autuacao_fim',
    label: 'Data Autuação - Fim',
    type: 'date',
    searchText: 'data autuacao fim distribuicao',
  },
  {
    id: 'data_arquivamento_inicio',
    label: 'Data Arquivamento - Início',
    type: 'date',
    searchText: 'data arquivamento inicio conclusao',
  },
  {
    id: 'data_arquivamento_fim',
    label: 'Data Arquivamento - Fim',
    type: 'date',
    searchText: 'data arquivamento fim conclusao',
  },
  {
    id: 'data_proxima_audiencia_inicio',
    label: 'Data Próxima Audiência - Início',
    type: 'date',
    searchText: 'data proxima audiencia inicio',
  },
  {
    id: 'data_proxima_audiencia_fim',
    label: 'Data Próxima Audiência - Fim',
    type: 'date',
    searchText: 'data proxima audiencia fim',
  },
];

export function buildProcessosFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(PROCESSOS_FILTER_CONFIGS);
}

export function parseProcessosFilters(selectedFilters: string[]): ProcessosFilters {
  return parseFilterValues(selectedFilters, PROCESSOS_FILTER_CONFIGS) as ProcessosFilters;
}