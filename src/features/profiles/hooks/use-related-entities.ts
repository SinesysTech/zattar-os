import { useState, useEffect, useCallback } from "react";
import { actionBuscarProcessosPorEntidade } from "../../partes/actions/processo-partes-actions";

// This hook handles specific additional relationships if not loaded by main useProfileData
// For example, fetching 'clientes' for a 'representante'.

export function useRelatedEntities(
  entityType: string,
  entityId: number,
  relationType: string
) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRelations = useCallback(async () => {
    // Logic to switch on relationType and fetch data
    // For now, if relationType is 'processos' and we want to lazy load (though useProfileData tries to eager load)
    // we could put logic here.

    // Implement placeholder for 'clientes' of 'representante' etc if needed
    // Currently using empty implementation as the plan moved most logic to useProfileData or assumed logic.
    // But related-entities-cards.tsx calls this.

    setIsLoading(true);
    try {
      if (
        relationType === "processos" &&
        ["cliente", "parte_contraria", "terceiro"].includes(entityType)
      ) {
        // Redundant if useProfileData fetches, but useful for lazy loading tabs
        const res = await actionBuscarProcessosPorEntidade(
          entityType as any,
          entityId
        );
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);
        }
      } else {
        // Mock/Empty for now or implement specific additional fetchers
        console.log(
          `Fetching ${relationType} for ${entityType} ${entityId} - Not implemented yet`
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
