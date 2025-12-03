'use client';

import { useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { Advogado } from '@/backend/types/advogados/types';

interface AdvogadoComboboxProps {
  advogados: Advogado[];
  selectedId: number | null;
  onSelectionChange: (advogadoId: number | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function AdvogadoCombobox({
  advogados,
  selectedId,
  onSelectionChange,
  disabled = false,
  isLoading = false,
  placeholder = 'Selecione um advogado',
}: AdvogadoComboboxProps) {
  const options: ComboboxOption[] = useMemo(() => {
    return advogados.map((advogado) => ({
      value: advogado.id.toString(),
      label: `${advogado.nome_completo} - OAB ${advogado.oab}/${advogado.uf_oab}`,
      searchText: `${advogado.nome_completo} ${advogado.oab} ${advogado.uf_oab} ${advogado.cpf}`,
    }));
  }, [advogados]);

  const handleValueChange = (values: string[]) => {
    if (values.length === 0) {
      onSelectionChange(null);
    } else {
      const id = parseInt(values[0], 10);
      onSelectionChange(isNaN(id) ? null : id);
    }
  };

  return (
    <Combobox
      options={options}
      value={selectedId ? [selectedId.toString()] : []}
      onValueChange={handleValueChange}
      placeholder={isLoading ? 'Carregando...' : placeholder}
      searchPlaceholder="Buscar advogado..."
      emptyText="Nenhum advogado encontrado."
      multiple={false}
      disabled={disabled || isLoading}
    />
  );
}
