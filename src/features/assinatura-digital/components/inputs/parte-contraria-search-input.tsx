'use client';

import * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { searchParteContraria } from '@/features/assinatura-digital/actions/form-actions';
import type { ParteContraria } from '@/features/partes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateCPF, validateCNPJ } from '@/features/assinatura-digital/utils/validators';

export interface ParteContrariaSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onParteFound?: (parte: ParteContraria) => void;
  onParteNotFound?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  searchBy?: ('cpf' | 'cnpj' | 'nome')[];
}

export function ParteContrariaSearchInput({
  value = '',
  onChange,
  onParteFound,
  onParteNotFound,
  disabled = false,
  placeholder = 'Digite CPF, CNPJ ou nome',
  className,
  searchBy = ['cpf', 'cnpj', 'nome'],
}: ParteContrariaSearchInputProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'notFound' | 'error'>('idle');

  const detectSearchType = (value: string): { cpf?: string; cnpj?: string; nome?: string } => {
    const trimmed = value.trim().replace(/[^\d\w]/g, '');

    // Tenta CPF primeiro (11 dígitos)
    if (trimmed.length === 11 && validateCPF(trimmed)) {
      return { cpf: trimmed };
    }

    // Tenta CNPJ (14 dígitos)
    if (trimmed.length === 14 && validateCNPJ(trimmed)) {
      return { cnpj: trimmed };
    }

    // Se não for CPF nem CNPJ, assume que é nome
    if (value.trim().length >= 3) {
      return { nome: value.trim() };
    }

    return {};
  };

  const handleSearch = async () => {
    if (!searchValue || searchValue.trim().length === 0) {
      toast.error('Digite CPF, CNPJ ou nome para buscar');
      return;
    }

    setIsSearching(true);
    setSearchStatus('idle');

    try {
      const searchParams = detectSearchType(searchValue);

      // Filtra apenas os tipos de busca permitidos
      const filteredParams: { cpf?: string; cnpj?: string; nome?: string } = {};
      if (searchParams.cpf && searchBy.includes('cpf')) {
        filteredParams.cpf = searchParams.cpf;
      } else if (searchParams.cnpj && searchBy.includes('cnpj')) {
        filteredParams.cnpj = searchParams.cnpj;
      } else if (searchParams.nome && searchBy.includes('nome')) {
        filteredParams.nome = searchParams.nome;
      }

      if (Object.keys(filteredParams).length === 0) {
        toast.error('Tipo de busca não permitido para este campo');
        setIsSearching(false);
        return;
      }

      const result = await searchParteContraria(filteredParams);

      if (!result.success) {
        setSearchStatus('error');
        toast.error(result.error || 'Erro ao buscar parte contrária');
        return;
      }

      if (result.data) {
        setSearchStatus('found');
        toast.success('Parte contrária encontrada!');
        onParteFound?.(result.data);
      } else {
        setSearchStatus('notFound');
        toast.info('Parte contrária não encontrada. Você pode cadastrar uma nova.');
        onParteNotFound?.();
      }
    } catch (error) {
      setSearchStatus('error');
      toast.error('Erro ao buscar parte contrária');
      console.error('Erro ao buscar parte contrária:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
    // Reset status quando o usuário digita
    if (searchStatus !== 'idle') {
      setSearchStatus('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && !isSearching) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSearching}
            placeholder={placeholder}
            className="w-full"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchValue || searchValue.trim().length === 0}
          size="default"
          className="shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* Status indicator */}
      {searchStatus === 'found' && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Parte contrária encontrada e selecionada</span>
        </div>
      )}

      {searchStatus === 'notFound' && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <XCircle className="w-4 h-4" />
          <span>Parte contrária não encontrada. Preencha os dados manualmente.</span>
        </div>
      )}

      {searchStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="w-4 h-4" />
          <span>Erro ao buscar parte contrária. Tente novamente.</span>
        </div>
      )}
    </div>
  );
}
