'use client';

import { useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { GRAUS } from '@/lib/api/captura';
import type { Credencial } from '@/lib/types/credenciais';

interface CredenciaisComboboxProps {
  credenciais: Credencial[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Extrai número do TRT para ordenação (TRT1 = 1, TRT10 = 10)
 */
function extrairNumeroTRT(tribunal: string): number {
  const match = tribunal.match(/TRT(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

/**
 * Ordena credenciais por número do TRT (crescente) e depois por grau
 */
function ordenarCredenciais(credenciais: Credencial[]): Credencial[] {
  return [...credenciais].sort((a, b) => {
    // Primeiro ordenar por número do TRT
    const numTRTA = extrairNumeroTRT(a.tribunal);
    const numTRTB = extrairNumeroTRT(b.tribunal);
    
    if (numTRTA !== numTRTB) {
      return numTRTA - numTRTB; // Ordem crescente: TRT1, TRT2, ..., TRT10, TRT11, ...
    }
    
    // Se mesmo TRT, ordenar por grau (primeiro_grau antes de segundo_grau)
    if (a.grau !== b.grau) {
      return a.grau === 'primeiro_grau' ? -1 : 1;
    }
    
    return 0;
  });
}

export function CredenciaisCombobox({
  credenciais,
  selectedIds,
  onSelectionChange,
  disabled = false,
  placeholder = 'Selecione credenciais...',
}: CredenciaisComboboxProps) {
  // Ordenar credenciais por número do TRT
  const credenciaisOrdenadas = useMemo(() => {
    return ordenarCredenciais(credenciais);
  }, [credenciais]);

  const options: ComboboxOption[] = useMemo(() => {
    return credenciaisOrdenadas.map((cred) => {
      const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
      const label = `${cred.tribunal} - ${grauLabel}`;
      
      return {
        value: cred.id.toString(),
        label,
        searchText: `${cred.tribunal} ${grauLabel} ${cred.grau}`,
      };
    });
  }, [credenciaisOrdenadas]);

  const handleValueChange = (values: string[]) => {
    const ids = values.map((v) => parseInt(v, 10)).filter((id) => !isNaN(id));
    onSelectionChange(ids);
  };

  return (
    <Combobox
      options={options}
      value={selectedIds.map((id) => id.toString())}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar credenciais..."
      emptyText="Nenhuma credencial encontrada."
      multiple={true}
      disabled={disabled}
      selectAllText="Selecionar todas"
      clearAllText="Limpar todas"
    />
  );
}
