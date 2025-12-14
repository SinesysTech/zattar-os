import { useState, useEffect, useCallback } from "react";
import { actionBuscarCliente } from "../../partes/actions/clientes-actions";
import { actionBuscarParteContraria } from "../../partes/actions/partes-contrarias-actions";
import { actionBuscarTerceiro } from "../../partes/actions/terceiros-actions";
import { actionBuscarRepresentantePorId } from "../../partes/representantes/actions/representantes-actions";
import { actionBuscarUsuario } from "../../usuarios/actions/usuarios-actions";
import {
  adaptClienteToProfile,
  adaptParteContrariaToProfile,
  adaptTerceiroToProfile,
  adaptRepresentanteToProfile,
  adaptUsuarioToProfile,
} from "../utils/profile-adapters";

import { actionBuscarProcessosPorEntidade } from "../../partes/actions/processo-partes-actions";

interface UseProfileDataResult {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfileData(
  entityType: string,
  entityId: number
): UseProfileDataResult {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      let adapter;
      let typeForProcessos = entityType;

      switch (entityType) {
        case "cliente":
          result = await actionBuscarCliente(entityId);
          adapter = adaptClienteToProfile;
          break;
        case "parte_contraria":
          result = await actionBuscarParteContraria(entityId);
          adapter = adaptParteContrariaToProfile;
          break;
        case "terceiro":
          result = await actionBuscarTerceiro(entityId);
          adapter = adaptTerceiroToProfile;
          break;
        case "representante":
          result = await actionBuscarRepresentantePorId(entityId, {
            incluirEndereco: true,
          });
          adapter = adaptRepresentanteToProfile;
          typeForProcessos = "representante"; // Special handling might be needed
          break;
        case "usuario":
          result = await actionBuscarUsuario(entityId);
          adapter = adaptUsuarioToProfile;
          // Usuario process fetching might differ
          break;
        default:
          throw new Error(`Tipo de entidade desconhecido: ${entityType}`);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || "Erro ao buscar dados do perfil");
      }

      let profileData = adapter ? adapter(result.data) : result.data;

      // Fetch related processes if applicable (simple logical check)
      // Note: Repository for usuario/representante might differ.
      // For now, only fetch for main entities or if action exists.
      if (["cliente", "parte_contraria", "terceiro"].includes(entityType)) {
        try {
          // Assuming actionBuscarProcessosPorEntidade accepts string type matching repo
          // We'll interpret 'cliente', 'parte_contraria', 'terceiro'
          const procResult = await actionBuscarProcessosPorEntidade(
            entityType as any,
            entityId
          );
          if (procResult.success) {
            profileData.processos = procResult.data;
            profileData.stats = {
              ...profileData.stats,
              total_processos: procResult.data.length,
            };
          }
        } catch (e) {
          console.error("Erro ao buscar processos relacionados", e);
        }
      }

      setData(profileData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      fetchData();
    }
  }, [fetchData, entityId]);

  return { data, isLoading, error, refetch: fetchData };
}
