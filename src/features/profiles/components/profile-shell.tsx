
import { ProfileShellClient } from "./profile-shell-client";
import { actionBuscarCliente } from "../../partes/actions/clientes-actions";
import { actionBuscarParteContraria } from "../../partes/actions/partes-contrarias-actions";
import { actionBuscarTerceiro } from "../../partes/actions/terceiros-actions";
import { actionBuscarRepresentantePorId } from "../../partes/representantes/actions/representantes-actions";
import { actionBuscarUsuario } from "../../usuarios/actions/usuarios-actions";
import { actionBuscarProcessosPorEntidade } from "../../partes/actions/processo-partes-actions";
import {
  adaptClienteToProfile,
  adaptParteContrariaToProfile,
  adaptTerceiroToProfile,
  adaptRepresentanteToProfile,
  adaptUsuarioToProfile,
} from "../utils/profile-adapters";

interface ProfileShellProps {
  entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario';
  entityId: number;
}

export async function ProfileShell({ entityType, entityId }: ProfileShellProps) {
  let result;
  let adapter;

  try {
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
          break;
        case "usuario":
          result = await actionBuscarUsuario(entityId);
          adapter = adaptUsuarioToProfile;
          break;
        default:
          throw new Error(`Tipo de entidade desconhecido: ${entityType}`);
    }
  } catch(e) {
      return <div>Erro ao carregar dados: {String(e)}</div>;
  }

  if (!result || !result.success || !result.data) {
    return <div>Perfil não encontrado ou erro ao carregar dados. {result?.error}</div>;
  }

  const profileData = adapter ? adapter(result.data) : result.data;

  // Fetch related processes server-side if applicable
  if (["cliente", "parte_contraria", "terceiro"].includes(entityType)) {
      try {
          const procResult = await actionBuscarProcessosPorEntidade(entityType as "cliente" | "parte_contraria" | "terceiro", entityId);
          if (procResult.success && Array.isArray(procResult.data)) {
              profileData.processos = procResult.data;
              profileData.stats = {
                  ...profileData.stats,
                  total_processos: procResult.data.length
              };
          }
      } catch (e) {
          console.error("Erro ao buscar processos no servidor", e);
      }
  }

  return (
    <ProfileShellClient 
        entityType={entityType} 
        entityId={entityId} 
        initialData={profileData} 
    />
  );
}
