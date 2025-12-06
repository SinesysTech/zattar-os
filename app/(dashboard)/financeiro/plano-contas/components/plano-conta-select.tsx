'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePlanoContasHierarquiaAchatada,
  gerarLabelParaSeletor,
} from '@/app/_lib/hooks/use-plano-contas-hierarquia';
import type { NivelConta, TipoContaContabil } from '@/backend/types/financeiro/plano-contas.types';

interface PlanoContaSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  filtrarPor?: {
    nivel?: NivelConta;
    tipoConta?: TipoContaContabil;
    excluirId?: number;
  };
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

/**
 * Componente de seleção de conta do plano de contas
 * Exibe as contas em formato hierárquico com indentação visual
 */
export function PlanoContaSelect({
  value,
  onChange,
  filtrarPor,
  placeholder = 'Selecione uma conta...',
  disabled = false,
  allowClear = true,
}: PlanoContaSelectProps) {
  const { contas, isLoading, error } = usePlanoContasHierarquiaAchatada();

  // Filtrar contas baseado nos critérios
  const contasFiltradas = React.useMemo(() => {
    let resultado = contas;

    if (filtrarPor?.nivel) {
      resultado = resultado.filter((c) => c.nivel === filtrarPor.nivel);
    }

    if (filtrarPor?.tipoConta) {
      resultado = resultado.filter((c) => c.tipoConta === filtrarPor.tipoConta);
    }

    if (filtrarPor?.excluirId) {
      resultado = resultado.filter((c) => c.id !== filtrarPor.excluirId);
    }

    return resultado;
  }, [contas, filtrarPor]);

  const handleValueChange = (newValue: string) => {
    if (newValue === '__clear__') {
      onChange(null);
    } else {
      onChange(parseInt(newValue, 10));
    }
  };

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Erro ao carregar contas" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value?.toString() || ''}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Carregando...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="__clear__">
            <span className="text-muted-foreground">Nenhuma</span>
          </SelectItem>
        )}
        {contasFiltradas.map((conta) => (
          <SelectItem key={conta.id} value={conta.id.toString()}>
            {gerarLabelParaSeletor(conta)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Seletor específico para conta pai (apenas contas sintéticas)
 */
export function PlanoContaPaiSelect({
  value,
  onChange,
  excluirId,
  placeholder = 'Selecione a conta pai...',
  disabled = false,
}: Omit<PlanoContaSelectProps, 'filtrarPor'> & { excluirId?: number }) {
  return (
    <PlanoContaSelect
      value={value}
      onChange={onChange}
      filtrarPor={{ nivel: 'sintetica', excluirId }}
      placeholder={placeholder}
      disabled={disabled}
      allowClear
    />
  );
}

/**
 * Seletor para contas analíticas (que aceitam lançamentos)
 */
export function PlanoContaAnaliticaSelect({
  value,
  onChange,
  tipoConta,
  placeholder = 'Selecione a conta...',
  disabled = false,
}: Omit<PlanoContaSelectProps, 'filtrarPor' | 'allowClear'> & { tipoConta?: TipoContaContabil }) {
  return (
    <PlanoContaSelect
      value={value}
      onChange={onChange}
      filtrarPor={{ nivel: 'analitica', tipoConta }}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={false}
    />
  );
}
