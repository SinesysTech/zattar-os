import type { ComboboxOption, FilterGroup } from '@/components/ui/table-toolbar';
import type { ListarTransacoesImportadasParams } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export const buildConciliacaoFilterOptions = (contas?: { id: number; nome: string }[]): ComboboxOption[] => {
  const base: ComboboxOption[] = [
    { value: 'status_pendente', label: 'Pendente' },
    { value: 'status_conciliado', label: 'Conciliado' },
    { value: 'status_divergente', label: 'Divergente' },
    { value: 'status_ignorado', label: 'Ignorado' },
    { value: 'periodo_7', label: '\u00daltimos 7 dias' },
    { value: 'periodo_30', label: '\u00daltimos 30 dias' },
    { value: 'periodo_90', label: '\u00daltimos 90 dias' },
  ];

  if (contas) {
    base.push(
      ...contas.map((c) => ({
        value: `conta_${c.id}`,
        label: `Conta: ${c.nome}`,
      }))
    );
  }

  return base;
};

export const buildConciliacaoFilterGroups = (contas?: { id: number; nome: string }[]): FilterGroup[] => {
  return [
    {
      label: 'Status',
      options: [
        { value: 'status_pendente', label: 'Pendente' },
        { value: 'status_conciliado', label: 'Conciliado' },
        { value: 'status_divergente', label: 'Divergente' },
        { value: 'status_ignorado', label: 'Ignorado' },
      ],
    },
    {
      label: 'Per\u00edodo',
      options: [
        { value: 'periodo_7', label: '\u00daltimos 7 dias' },
        { value: 'periodo_30', label: '\u00daltimos 30 dias' },
        { value: 'periodo_90', label: '\u00daltimos 90 dias' },
      ],
    },
    {
      label: 'Conta',
      options:
        contas?.map((c) => ({ value: `conta_${c.id}`, label: c.nome })) || [],
    },
  ];
};

export const parseConciliacaoFilters = (selectedIds: string[]): Partial<ListarTransacoesImportadasParams> => {
  const params: Partial<ListarTransacoesImportadasParams> = {};

  if (selectedIds.some((f) => f.startsWith('status_'))) {
    const statuses = selectedIds
      .filter((f) => f.startsWith('status_'))
      .map((f) => f.replace('status_', '')) as ListarTransacoesImportadasParams['statusConciliacao'][];
    params.statusConciliacao = statuses.length === 1 ? statuses[0] : statuses;
  }

  const contaFilter = selectedIds.find((f) => f.startsWith('conta_'));
  if (contaFilter) {
    params.contaBancariaId = Number(contaFilter.replace('conta_', ''));
  }

  const hoje = new Date();
  const toIso = (d: Date) => d.toISOString().split('T')[0];
  if (selectedIds.includes('periodo_7')) {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 7);
    params.dataInicio = toIso(inicio);
    params.dataFim = toIso(hoje);
  } else if (selectedIds.includes('periodo_30')) {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 30);
    params.dataInicio = toIso(inicio);
    params.dataFim = toIso(hoje);
  } else if (selectedIds.includes('periodo_90')) {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 90);
    params.dataInicio = toIso(inicio);
    params.dataFim = toIso(hoje);
  }

  return params;
};
