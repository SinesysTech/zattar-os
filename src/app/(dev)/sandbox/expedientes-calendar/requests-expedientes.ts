/**
 * Funções para buscar dados reais de expedientes para o calendário
 * Usa serviços do backend diretamente (Server Component)
 */

import { expedientesToEvents } from "./adapters/expediente-to-event.adapter";
import type { IEvent, IUser } from "@/components/calendar/interfaces";
import type { TEventColor } from "@/components/calendar/types";
import { COLORS } from "@/components/calendar/constants";
import type { ListarExpedientesParams } from "@/features/expedientes/domain";
import { listarExpedientes } from "@/features/expedientes/service";
import { service as usuariosService } from "@/features/usuarios/service";
import { listar } from "@/features/tipos-expedientes";
import type { ListarTiposExpedientesParams } from "@/features/tipos-expedientes";

/**
 * Busca expedientes usando serviços do backend e converte para eventos do calendário
 */
export async function getExpedientesEvents(params?: {
  dataInicio?: string;
  dataFim?: string;
  responsavelId?: number;
  baixado?: boolean;
  limite?: number;
}): Promise<IEvent[]> {
  try {
    // Construir parâmetros para o serviço
    const listarParams: ListarExpedientesParams = {
      pagina: 1,
      limite: params?.limite || 1000,
    };

    if (params?.dataInicio) {
      listarParams.dataPrazoLegalInicio = params.dataInicio;
    }
    if (params?.dataFim) {
      listarParams.dataPrazoLegalFim = params.dataFim;
    }
    if (params?.responsavelId !== undefined) {
      listarParams.responsavelId = params.responsavelId;
    }
    if (params?.baixado !== undefined) {
      listarParams.baixado = params.baixado;
    }

    // Buscar expedientes usando o serviço diretamente
    const result = await listarExpedientes(listarParams);

    if (!result.success) {
      console.error("Erro ao buscar expedientes:", result.error);
      return [];
    }

    const expedientes = result.data.data || [];

    // Buscar usuários e tipos de expedientes em paralelo
    const [usuariosResult, tiposResult] = await Promise.all([
      usuariosService.listarUsuarios({ ativo: true, limite: 100 }),
      listar({ limite: 100 } as ListarTiposExpedientesParams),
    ]);

    const usuarios = usuariosResult.usuarios || [];
    const tiposExpedientes = tiposResult.data || [];

    // Converter expedientes para eventos
    return expedientesToEvents(
      expedientes,
      COLORS as TEventColor[],
      usuarios,
      tiposExpedientes
    );
  } catch (error) {
    console.error("Erro ao buscar expedientes:", error);
    return [];
  }
}

/**
 * Busca usuários usando serviços do backend e converte para formato do calendário
 */
export async function getExpedientesUsers(): Promise<IUser[]> {
  try {
    const resultado = await usuariosService.listarUsuarios({
      ativo: true,
      limite: 100,
    });
    const usuarios = resultado.usuarios || [];

    return usuarios.map((usuario) => ({
      id: usuario.id.toString(),
      name: usuario.nomeExibicao,
      picturePath: null,
    }));
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}
