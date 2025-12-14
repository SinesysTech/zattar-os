import { useState, useEffect, useCallback } from "react";
// We import actions locally; it is fine for client side to call them if they are Server Actions 'use server'
import { actionBuscarProcessosPorEntidade } from "../../partes/actions/processo-partes-actions";
// Note: We might need specific actions for relations.
// For "clients of representative", we don't have a direct action, but we would implement it here or call a generic one.
// Since specific actions for unrelated tables weren't requested to *be created* unless needed, and we want to avoid error,
// I will implement safe checks.

export function useRelatedEntities(
  entityType: string,
  entityId: number,
  relationType: string
) {
  const [data, setData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRelations = useCallback(async () => {
    setIsLoading(true);
    try {
      if (
        relationType === "processos" &&
        ["cliente", "parte_contraria", "terceiro"].includes(entityType)
      ) {
        const res = await actionBuscarProcessosPorEntidade(
          entityType as "cliente" | "parte_contraria" | "terceiro",
          entityId
        );
        if (res.success && Array.isArray(res.data)) {
          // Normalize data structure for cards if needed, or assume adapter handles it in component
          // The component RelatedEntitiesCards expects certain fields (title, subtitle)
          // We might need to map them here or in the component config.
          // Config defines mapping, so raw data is fine.
          setData(res.data);
        } else {
          setData([]);
        }
      } else if (
        entityType === "cliente" &&
        relationType === "representantes"
      ) {
        // Logic to fetch representatives for a client
        // currently placeholder as we don't have actionBuscarRepresentantesPorCliente
        console.log(
          "Fetching representatives for client - Not Implemented Fully"
        );
        setData([]);
      } else if (
        entityType === "representante" &&
        relationType === "clientes"
      ) {
        // Logic to fetch clients for a representative
        console.log(
          "Fetching clients for representative - Not Implemented Fully"
        );
        setData([]);
      } else {
        console.log(
          `Fetching ${relationType} for ${entityType} ${entityId} - Handler not found`
        );
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, relationType]);

  useEffect(() => {
    if (entityId && relationType) {
      fetchRelations();
    }
  }, [fetchRelations, entityId, relationType]);

  return { data, isLoading, error, refetch: fetchRelations };
}
