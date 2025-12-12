import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { actionListarPlanoContas } from '../actions/plano-contas';
import { PlanoContas } from '../types/plano-contas';

export function usePlanoContas() {
    const [contas, setContas] = useState<PlanoContas[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        startTransition(() => {
            setIsLoading(true);
        });
        
        const result = await actionListarPlanoContas();
        
        startTransition(() => {
            if (result.success && result.data) {
                setContas(result.data);
                setError(null);
            } else {
                setError(result.error || 'Erro ao carregar plano de contas');
            }
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { contas, isLoading, error, refetch: load };
}

export function usePlanoContasAnaliticas() {
    const { contas, isLoading, error, refetch } = usePlanoContas();

    const contasAnaliticas = useMemo(() => {
        return (contas ?? []).filter((c) => c.ativo === true && c.nivel === 'analitica');
    }, [contas]);

    return { contas: contasAnaliticas, isLoading, error, refetch };
}

export type PlanoContaHierarquico = PlanoContas & {
    nivelIndentacao: number;
    filhas?: PlanoContaHierarquico[];
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
             } as PlanoContaHierarquico;
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
  conta: PlanoContaHierarquico
): string {
  const prefixo = '\u00A0\u00A0'.repeat(conta.nivelIndentacao);
  return `${prefixo}${conta.codigo} - ${conta.nome}`;
}
