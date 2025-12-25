'use client';

import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { actionListarPlanoContas } from '../actions/plano-contas';
import { PlanoContas, PlanoContasFilters, PlanoContaHierarquico } from '../domain/plano-contas';

export interface PlanoContasPaginacao {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export function usePlanoContas(filters?: PlanoContasFilters & { limite?: number; pagina?: number }) {
    const [contas, setContas] = useState<PlanoContas[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        startTransition(() => {
            setIsLoading(true);
        });

        const result = await actionListarPlanoContas(filters);

        startTransition(() => {
            if (result.success && result.data) {
                setContas(result.data);
                setError(null);
            } else {
                setError(result.error || 'Erro ao carregar plano de contas');
            }
            setIsLoading(false);
        });
    }, [filters]);

    useEffect(() => {
        load();
    }, [load]);

    // Paginação calculada no client (sem suporte server-side por enquanto)
    const limite = filters?.limite ?? 50;
    const pagina = filters?.pagina ?? 1;
    const total = contas.length;
    const paginacao: PlanoContasPaginacao = {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite) || 1,
    };

    return {
        contas,
        planoContas: contas,
        isLoading,
        error,
        refetch: load,
        mutate: load,
        paginacao,
    };
}

export function usePlanoContasAnaliticas() {
    const { contas, isLoading, error, refetch } = usePlanoContas();

    const contasAnaliticas = useMemo(() => {
        return (contas ?? []).filter((c) => c.ativo === true && c.nivel === 'analitica');
    }, [contas]);

    return { contas: contasAnaliticas, planoContas: contasAnaliticas, isLoading, error, refetch };
}

// Re-export from domain to avoid duplication
export type { PlanoContaHierarquico } from '../domain/plano-contas';

// Local type for flattened hierarchy with indent level
export type PlanoContaComIndentacao = PlanoContaHierarquico & {
    nivelIndentacao: number;
};

export function usePlanoContasHierarquiaAchatada() {
    const { contas, isLoading, error, refetch } = usePlanoContas();

    const contasAchatadas = useMemo(() => {
        if (!contas.length) return [];
        
        // As contas já vem ordenadas por código do backend (serviço garante order('codigo'))
        // Vamos calcular a indentação baseada no código (pontos) ou profundidade
        
        return contas.map(c => {
             // Ex: "1.1.01" -> 2 pontos -> nível 2 (se base 0, seria codigo.split('.').length - 1)
             const nivelIndentacao = c.codigo.split('.').length - 1;
             return {
                 ...c,
                 nivelIndentacao
             } as PlanoContaComIndentacao;
        });
    }, [contas]);

    return {
        contas: contasAchatadas,
        isLoading,
        error,
        mutate: refetch // alias for compatibility
    };
}

export function gerarLabelParaSeletor(
  conta: PlanoContaComIndentacao
): string {
  const prefixo = '\u00A0\u00A0'.repeat(conta.nivelIndentacao);
  return `${prefixo}${conta.codigo} - ${conta.nome}`;
}
