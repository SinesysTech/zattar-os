'use client';

/**
 * Hook para buscar contas bancárias
 * Usado para selects de conta bancária em formulários de pagamento
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/_lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface ContaBancaria {
  id: number;
  nome: string;
  banco?: string | null;
  tipo?: string;
  agencia?: string | null;
  numeroConta?: string | null;
}

interface UseContasBancariasResult {
  contasBancarias: ContaBancaria[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook para buscar contas bancárias ativas para uso em selects
 * Retorna apenas contas ativas ordenadas por nome
 */
export const useContasBancarias = (): UseContasBancariasResult => {
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarContasBancarias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from('contas_bancarias')
        .select('id, nome, banco_nome, tipo, agencia, numero_conta')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (queryError) {
        // Se a tabela não existe ainda, retorna array vazio sem erro
        if (queryError.code === '42P01') {
          console.warn('Tabela contas_bancarias ainda não existe');
          setContasBancarias([]);
          return;
        }
        throw new Error(queryError.message);
      }

      // Mapear para o formato esperado pelo componente
      const contasMapeadas: ContaBancaria[] = (data || []).map((cb) => ({
        id: cb.id,
        nome: cb.nome,
        banco: cb.banco_nome,
        tipo: cb.tipo,
        agencia: cb.agencia,
        numeroConta: cb.numero_conta,
      }));

      setContasBancarias(contasMapeadas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contas bancárias';
      console.error('Erro ao buscar contas bancárias:', err);
      setError(errorMessage);
      setContasBancarias([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarContasBancarias();
  }, [buscarContasBancarias]);

  return {
    contasBancarias,
    isLoading,
    error,
    refetch: buscarContasBancarias,
  };
};
