'use client';

/**
 * useContratosPage — Hook de listagem de contratos para a página redesenhada.
 *
 * Estratégia:
 *  - Recebe params de filtro (segmentoId, busca, pagina, limite)
 *  - Debounce de 300ms na busca
 *  - Chama actionListarContratos com os params
 *  - Resolve nomes via actionResolverNomesEntidadesContrato em paralelo
 *  - Mapeia cada Contrato para ContratoCardData via contratoToCardData
 *  - Retorna { contratos, total, isLoading, error, refetch }
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ContratoCardData } from '../adapters/contrato-card-adapter';
import { contratoToCardData } from '../adapters/contrato-card-adapter';
import { actionListarContratos, actionResolverNomesEntidadesContrato } from '../actions';
import { actionListarSegmentos } from '../actions';
import type { Contrato, ContratoParte } from '../domain';

// =============================================================================
// TYPES
// =============================================================================

export interface UseContratosPageParams {
  segmentoId?: number;
  busca?: string;
  pagina?: number;
  limite?: number;
}

export interface UseContratosPageResult {
  contratos: ContratoCardData[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useContratosPage({
  segmentoId,
  busca = '',
  pagina = 1,
  limite = 50,
}: UseContratosPageParams = {}): UseContratosPageResult {
  const [contratos, setContratos] = useState<ContratoCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce busca 300ms
  const [debouncedBusca, setDebouncedBusca] = useState(busca);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const paramsKey = useMemo(
    () => JSON.stringify({ segmentoId, debouncedBusca, pagina, limite }),
    [segmentoId, debouncedBusca, pagina, limite],
  );

  const paramsKeyRef = useRef('');

  const fetchContratos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Buscar contratos paginados
      const result = await actionListarContratos({
        segmentoId,
        busca: debouncedBusca || undefined,
        pagina,
        limite,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Erro ao buscar contratos');
      }
      if (!result.data) {
        throw new Error('Resposta sem dados');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = result.data as any;
      const items: Contrato[] = payload.data ?? [];
      const paginationTotal: number = payload.pagination?.total ?? items.length;

      // 2. Extrair IDs únicos para resolução de nomes
      const clienteIds = Array.from(
        new Set(items.map((c) => c.clienteId).filter(Boolean)),
      );

      const partesContrariasIds = Array.from(
        new Set(
          items.flatMap((c) =>
            (c.partes ?? [])
              .filter(
                (p: ContratoParte) =>
                  p.tipoEntidade === 'parte_contraria' && p.papelContratual === 're',
              )
              .map((p: ContratoParte) => p.entidadeId),
          ),
        ),
      );

      const responsavelIds = Array.from(
        new Set(
          items.map((c) => c.responsavelId).filter((id): id is number => id != null),
        ),
      );

      // 3. Resolver nomes e segmentos em paralelo
      const [nomesResult, segmentosResult] = await Promise.all([
        actionResolverNomesEntidadesContrato({
          clienteIds,
          partesContrariasIds,
          usuariosIds: responsavelIds,
        }),
        actionListarSegmentos(),
      ]);

      // Construir maps id → nome
      const clientesMap = new Map<number, string>();
      const partesContrariasMap = new Map<number, string>();
      const usuariosMap = new Map<number, string>();

      if (nomesResult.success && nomesResult.data) {
        for (const c of nomesResult.data.clientes) {
          clientesMap.set(c.id, c.nome);
        }
        for (const p of nomesResult.data.partesContrarias) {
          partesContrariasMap.set(p.id, p.nome);
        }
        for (const u of nomesResult.data.usuarios) {
          usuariosMap.set(u.id, u.nome);
        }
      }

      const segmentosMap = new Map<number, string>();
      if (segmentosResult.success && Array.isArray(segmentosResult.data)) {
        for (const s of segmentosResult.data as Array<{ id: number; nome: string }>) {
          segmentosMap.set(s.id, s.nome);
        }
      }

      // 4. Mapear para ContratoCardData
      const cards = items.map((contrato) =>
        contratoToCardData(
          contrato,
          {
            clientes: clientesMap,
            partesContrarias: partesContrariasMap,
            usuarios: usuariosMap,
          },
          segmentosMap,
        ),
      );

      setContratos(cards);
      setTotal(paginationTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setContratos([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [segmentoId, debouncedBusca, pagina, limite]);

  useEffect(() => {
    if (paramsKeyRef.current !== paramsKey) {
      paramsKeyRef.current = paramsKey;
      fetchContratos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { contratos, total, isLoading, error, refetch: fetchContratos };
}
