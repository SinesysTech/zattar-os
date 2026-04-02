'use client';

/**
 * CONTRATOS FEATURE - useKanbanContratos Hook
 *
 * Gerencia o estado do Kanban de contratos:
 * - Busca o pipeline do segmento (com seus estágios)
 * - Busca contratos do segmento e os agrupa por estagio_id
 * - Fornece moveContrato() com atualização otimista + rollback em caso de erro
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContratoPipeline } from '../pipelines/types';
import { actionListarContratos } from '../actions';
import type { Contrato } from '../domain';
import { TIPO_CONTRATO_LABELS, TIPO_COBRANCA_LABELS } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

export interface KanbanContrato {
  id: number;
  clienteNome: string;
  tipoContrato: string;
  tipoCobranca: string;
  cadastradoEm: string;
  estagioId: number | null;
}

/**
 * Colunas do kanban: mapa de estagioId (como string para UniqueIdentifier) → contratos
 * A chave "sem_estagio" é usada para contratos sem estágio atribuído.
 */
export type KanbanColumns = Record<string, KanbanContrato[]>;

export const SEM_ESTAGIO_KEY = 'sem_estagio';

interface UseKanbanContratosResult {
  pipeline: ContratoPipeline | null;
  /** Colunas do kanban: estagioId.toString() → KanbanContrato[] */
  columns: KanbanColumns;
  isLoading: boolean;
  error: string | null;
  moveContrato: (contratoId: number, newEstagioId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildInitialColumns(pipeline: ContratoPipeline): KanbanColumns {
  const cols: KanbanColumns = {};
  for (const estagio of pipeline.estagios) {
    cols[String(estagio.id)] = [];
  }
  cols[SEM_ESTAGIO_KEY] = [];
  return cols;
}

function resolveClienteNome(contrato: Contrato): string {
  // Tenta extrair nome do cliente a partir das partes do contrato
  const partePrincipal = contrato.partes.find(
    (p) => p.tipoEntidade === 'cliente'
  );
  if (partePrincipal?.nomeSnapshot) {
    return partePrincipal.nomeSnapshot;
  }
  return `Cliente #${contrato.clienteId}`;
}

function contratoToKanban(contrato: Contrato): KanbanContrato {
  return {
    id: contrato.id,
    clienteNome: resolveClienteNome(contrato),
    tipoContrato: TIPO_CONTRATO_LABELS[contrato.tipoContrato] ?? contrato.tipoContrato,
    tipoCobranca: TIPO_COBRANCA_LABELS[contrato.tipoCobranca] ?? contrato.tipoCobranca,
    cadastradoEm: contrato.cadastradoEm,
    estagioId: contrato.estagioId ?? null,
  };
}

function groupByEstagio(
  contratos: Contrato[],
  pipeline: ContratoPipeline
): KanbanColumns {
  const cols = buildInitialColumns(pipeline);
  const validEstagioIds = new Set(pipeline.estagios.map((e) => e.id));

  for (const contrato of contratos) {
    const kanbanItem = contratoToKanban(contrato);
    const estagioId = contrato.estagioId;

    if (estagioId !== null && validEstagioIds.has(estagioId)) {
      cols[String(estagioId)]!.push(kanbanItem);
    } else {
      cols[SEM_ESTAGIO_KEY]!.push(kanbanItem);
    }
  }

  return cols;
}

// =============================================================================
// HOOK
// =============================================================================

export function useKanbanContratos(
  segmentoId: number | null
): UseKanbanContratosResult {
  const [pipeline, setPipeline] = useState<ContratoPipeline | null>(null);
  const [columns, setColumns] = useState<KanbanColumns>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para guardar os contratos em bruto para reconstruir colunas após rollback
  const rawContratosRef = useRef<Contrato[]>([]);

  const fetchData = useCallback(async () => {
    if (segmentoId === null) {
      setPipeline(null);
      setColumns({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Busca paralela: pipeline + contratos
      const [pipelineRes, contratosRes] = await Promise.all([
        fetch(`/api/contratos/pipelines?segmentoId=${segmentoId}&ativo=true`),
        actionListarContratos({ segmentoId, limite: 500, pagina: 1 }),
      ]);

      // Pipeline
      if (!pipelineRes.ok) {
        throw new Error(`Erro ao buscar pipeline: ${pipelineRes.statusText}`);
      }
      const pipelineData = (await pipelineRes.json()) as {
        success: boolean;
        data: ContratoPipeline[];
        error?: string;
      };

      if (!pipelineData.success) {
        throw new Error(pipelineData.error ?? 'Erro ao buscar pipeline');
      }

      const pipelines = pipelineData.data;
      const foundPipeline = pipelines[0] ?? null;

      if (!foundPipeline) {
        setPipeline(null);
        setColumns({});
        rawContratosRef.current = [];
        return;
      }

      // Contratos
      if (!contratosRes.success) {
        throw new Error(
          (contratosRes as { error?: string }).error ?? 'Erro ao buscar contratos'
        );
      }

      const payload = contratosRes.data as {
        data: Contrato[];
        pagination: unknown;
      };
      const contratos = payload.data ?? [];

      rawContratosRef.current = contratos;
      const grouped = groupByEstagio(contratos, foundPipeline);

      setPipeline(foundPipeline);
      setColumns(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar kanban');
      setPipeline(null);
      setColumns({});
    } finally {
      setIsLoading(false);
    }
  }, [segmentoId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /**
   * Move um contrato para um novo estágio.
   * Aplica atualização otimista imediatamente e reverte em caso de erro.
   */
  const moveContrato = useCallback(
    async (contratoId: number, newEstagioId: number) => {
      // Snapshot do estado atual para rollback
      const previousColumns = { ...columns };
      const previousRaw = [...rawContratosRef.current];

      // Atualização otimista: mover card entre colunas
      setColumns((prev) => {
        const updated: KanbanColumns = {};

        for (const [colKey, items] of Object.entries(prev)) {
          updated[colKey] = items.filter((item) => item.id !== contratoId);
        }

        const movedItem = Object.values(prev)
          .flat()
          .find((item) => item.id === contratoId);

        if (movedItem) {
          const updatedItem: KanbanContrato = {
            ...movedItem,
            estagioId: newEstagioId,
          };
          const targetKey = String(newEstagioId);
          updated[targetKey] = [...(updated[targetKey] ?? []), updatedItem];
        }

        return updated;
      });

      // Atualizar ref dos contratos brutos também
      rawContratosRef.current = rawContratosRef.current.map((c) =>
        c.id === contratoId ? { ...c, estagioId: newEstagioId } : c
      );

      // Chamada API
      try {
        const res = await fetch(`/api/contratos/${contratoId}/estagio`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estagio_id: newEstagioId }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Erro ${res.status}`);
        }
      } catch (err) {
        // Rollback em caso de falha
        setColumns(previousColumns);
        rawContratosRef.current = previousRaw;
        console.error('[useKanbanContratos] moveContrato falhou, revertendo:', err);
        throw err;
      }
    },
    [columns]
  );

  return {
    pipeline,
    columns,
    isLoading,
    error,
    moveContrato,
    refetch: fetchData,
  };
}
