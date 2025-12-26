'use client';

import { useState, useEffect, useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { TipoContaContabil } from '../../../domain/plano-contas';
import { actionListarPlanoContas } from '../../../actions/plano-contas';

interface FiltroContaContabilProps {
  value: string;
  onChange: (value: string) => void;
  tiposConta?: TipoContaContabil[];
  placeholder?: string;
  className?: string;
}

export function FiltroContaContabil({
  value,
  onChange,
  tiposConta,
  placeholder = 'Conta Contábil',
  className = 'w-[220px]',
}: FiltroContaContabilProps) {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadContas() {
      setIsLoading(true);
      try {
        const result = await actionListarPlanoContas({
          limite: 100,
          ativo: true,
          tipoConta: tiposConta,
        });

        if (result.success && result.data) {
          const contasArray = Array.isArray(result.data) ? result.data : (result.data as { data?: PlanoContas[] }).data || [];
          const contasOptions: ComboboxOption[] = contasArray.map((conta: PlanoContas) => ({
            value: String(conta.id),
            label: `${conta.codigo} - ${conta.nome}`,
            searchText: `${conta.codigo} ${conta.nome}`,
          }));

          setOptions([
            { value: '', label: 'Todas as contas' },
            ...contasOptions,
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar contas contábeis:', error);
        setOptions([{ value: '', label: 'Erro ao carregar' }]);
      } finally {
        setIsLoading(false);
      }
    }

    loadContas();
  }, [tiposConta]);

  const selectedValues = useMemo(() => (value ? [value] : []), [value]);

  const handleChange = (values: string[]) => {
    onChange(values[0] || '');
  };

  return (
    <Combobox
      options={options}
      value={selectedValues}
      onValueChange={handleChange}
      placeholder={isLoading ? 'Carregando...' : placeholder}
      searchPlaceholder="Buscar conta..."
      emptyText="Nenhuma conta encontrada"
      multiple={false}
      disabled={isLoading}
      className={className}
    />
  );
}
