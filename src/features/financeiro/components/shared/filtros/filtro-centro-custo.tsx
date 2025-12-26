'use client';

import { useState, useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface FiltroCentroCustoProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// TODO: Substituir por carregamento dinâmico quando action de centros de custo estiver disponível
const CENTROS_CUSTO_MOCK: ComboboxOption[] = [
  { value: '', label: 'Todos os centros' },
  { value: '1', label: 'Administrativo', searchText: 'administrativo admin' },
  { value: '2', label: 'Jurídico', searchText: 'juridico direito advocacia' },
  { value: '3', label: 'Financeiro', searchText: 'financeiro contabil' },
  { value: '4', label: 'Comercial', searchText: 'comercial vendas' },
];

export function FiltroCentroCusto({
  value,
  onChange,
  placeholder = 'Centro de Custo',
  className = 'w-[200px]',
}: FiltroCentroCustoProps) {
  const [options] = useState<ComboboxOption[]>(CENTROS_CUSTO_MOCK);

  const selectedValues = useMemo(() => (value ? [value] : []), [value]);

  const handleChange = (values: string[]) => {
    onChange(values[0] || '');
  };

  return (
    <Combobox
      options={options}
      value={selectedValues}
      onValueChange={handleChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar centro..."
      emptyText="Nenhum centro encontrado"
      multiple={false}
      className={className}
    />
  );
}
