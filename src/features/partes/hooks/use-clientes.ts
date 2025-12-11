'use client';

/**
 * Hook para buscar clientes
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Cliente } from '../types';
import type { ListarClientesParams } from '../types';

interface PaginationInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface UseClientesResult {
  clientes: Cliente[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar clientes
 */
export const useClientes = (params: ListarClientesParams = {}): UseClientesResult => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const nome = params.nome || '';
  const cpf = params.cpf || '';
  const cnpj = params.cnpj || '';
  const ativo = params.ativo;
  const incluirEndereco = params.incluir_endereco ?? false;
  const incluirProcessos = params.incluir_processos ?? false;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipo_pessoa,
      nome,
      cpf,
      cnpj,
      ativo,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, nome, cpf, cnpj, ativo, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      searchParams.set('pagina', pagina.toString());
      searchParams.set('limite', limite.toString());

      if (busca) {
        searchParams.set('busca', busca);
      }
      if (tipo_pessoa) {
        searchParams.set('tipo_pessoa', tipo_pessoa);
      }
      if (nome) {
        searchParams.set('nome', nome);
      }
      if (cpf) {
        searchParams.set('cpf', cpf);
      }
      if (cnpj) {
        searchParams.set('cnpj', cnpj);
      }
      if (ativo !== undefined) {
        searchParams.set('ativo', ativo.toString());
      }
      if (incluirEndereco) {
        searchParams.set('incluir_endereco', 'true');
      }
      if (incluirProcessos) {
        searchParams.set('incluir_processos', 'true');
      }

      const response = await fetch(`/api/clientes?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      // A API retorna { success: true, data: { data: Cliente[], pagination: {...} } }
      const clientesData = data.data?.data || [];
      const paginationData = data.data?.pagination;

      setClientes(clientesData);
      if (paginationData) {
        setPaginacao({
          pagina: paginationData.page || pagina,
          limite: paginationData.limit || limite,
          total: paginationData.total || 0,
          totalPaginas: paginationData.totalPages || 0,
        });
      } else {
        setPaginacao(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes';
      setError(errorMessage);
      setClientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, nome, cpf, cnpj, ativo, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarClientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    clientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarClientes,
  };
};
