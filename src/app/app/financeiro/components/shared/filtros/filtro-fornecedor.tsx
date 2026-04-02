'use client';

import { useState, useEffect, useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface Fornecedor {
  id: number;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  ativo: boolean;
}

interface FiltroFornecedorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Action para listar fornecedores
 */
async function listarFornecedores(): Promise<{ success: boolean; data?: { data: Fornecedor[] }; error?: string }> {
  try {
    const response = await fetch('/api/fornecedores?ativo=true&limite=1000', {
      credentials: 'include', // Garantir que cookies de autenticação sejam enviados
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verificar se a resposta é JSON válido
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta JSON:', parseError);
        return { 
          success: false, 
          error: `Erro ao processar resposta do servidor (${response.status})` 
        };
      }
    } else {
      // Se não for JSON, ler como texto para debug
      const text = await response.text();
      console.error('Resposta não é JSON:', { status: response.status, text });
      return { 
        success: false, 
        error: `Erro ${response.status}: ${response.statusText || 'Resposta inválida'}` 
      };
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Erro ${response.status}: ${response.statusText}`;
      console.error('Erro ao buscar fornecedores:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data,
      });
      return { success: false, error: errorMessage };
    }

    // Verificar se a resposta tem a estrutura esperada
    if (!data || !data.success || !data.data) {
      console.error('Resposta da API com estrutura inválida:', data);
      return { success: false, error: 'Resposta da API com estrutura inválida' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar fornecedores' 
    };
  }
}

export function FiltroFornecedor({
  value,
  onChange,
  placeholder = 'Fornecedor',
  className = 'w-[220px]',
}: FiltroFornecedorProps) {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadFornecedores() {
      setIsLoading(true);
      try {
        const result = await listarFornecedores();

        if (result.success && result.data) {
          const fornecedoresOptions: ComboboxOption[] = result.data.data.map((fornecedor: Fornecedor) => {
            const documento = fornecedor.tipo_pessoa === 'pf' ? fornecedor.cpf : fornecedor.cnpj;
            return {
              value: String(fornecedor.id),
              label: fornecedor.nome,
              searchText: `${fornecedor.nome} ${documento || ''}`,
            };
          });

          setOptions([
            { value: '', label: 'Todos os fornecedores' },
            ...fornecedoresOptions,
          ]);
        } else {
          // Tratar erro retornado pela função
          const errorMessage = result.error || 'Erro ao carregar fornecedores';
          console.error('Erro ao carregar fornecedores:', errorMessage);
          setOptions([{ value: '', label: `Erro: ${errorMessage}` }]);
        }
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        setOptions([{ 
          value: '', 
          label: error instanceof Error ? `Erro: ${error.message}` : 'Erro ao carregar' 
        }]);
      } finally {
        setIsLoading(false);
      }
    }

    loadFornecedores();
  }, []);

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
      searchPlaceholder="Buscar fornecedor..."
      emptyText="Nenhum fornecedor encontrado"
      multiple={false}
      disabled={isLoading}
      className={className}
    />
  );
}
