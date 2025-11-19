'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TableToolbar, type ComboboxOption } from '@/components/ui/table-toolbar';
import { AcordosCondenacoesList } from './components/acordos-condenacoes-list';

export default function AcordosCondecoesPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ tipo: '', direcao: '', status: '', processoId: '' });
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const filterOptions: ComboboxOption[] = [
    { value: 'tipo_acordo', label: 'Tipo: Acordo' },
    { value: 'tipo_condenacao', label: 'Tipo: Condenação' },
    { value: 'tipo_custas', label: 'Tipo: Custas' },
    { value: 'direcao_recebimento', label: 'Direção: Recebimento' },
    { value: 'direcao_pagamento', label: 'Direção: Pagamento' },
    { value: 'status_pendente', label: 'Status: Pendente' },
    { value: 'status_pago_parcial', label: 'Status: Pago Parcial' },
    { value: 'status_pago_total', label: 'Status: Pago Total' },
    { value: 'status_atrasado', label: 'Status: Atrasado' },
  ];

  const handleFilterIdsChange = (ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFiltros = { ...filtros, tipo: '', direcao: '', status: '' };
    ids.forEach(id => {
      if (id === 'tipo_acordo') newFiltros.tipo = 'acordo';
      if (id === 'tipo_condenacao') newFiltros.tipo = 'condenacao';
      if (id === 'tipo_custas') newFiltros.tipo = 'custas_processuais';
      if (id === 'direcao_recebimento') newFiltros.direcao = 'recebimento';
      if (id === 'direcao_pagamento') newFiltros.direcao = 'pagamento';
      if (id === 'status_pendente') newFiltros.status = 'pendente';
      if (id === 'status_pago_parcial') newFiltros.status = 'pago_parcial';
      if (id === 'status_pago_total') newFiltros.status = 'pago_total';
      if (id === 'status_atrasado') newFiltros.status = 'atrasado';
    });
    setFiltros(newFiltros);
  };

  const handleSearchChange = (value: string) => {
    setBusca(value);
    setFiltros(prev => ({ ...prev, processoId: value }));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <TableToolbar
        searchValue={busca}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
        searchPlaceholder="Buscar acordos e condenações..."
        filterOptions={filterOptions}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => router.push('/acordos-condenacoes/novo')}
        newButtonTooltip="Novo Acordo/Condenação"
      />
      <AcordosCondenacoesList filtros={filtros} busca={busca} />
    </div>
  );
}
