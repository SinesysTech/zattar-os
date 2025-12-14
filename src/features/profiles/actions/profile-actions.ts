"use server";

import { createDbClient } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  type: string;
};

type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

/**
 * Busca atividades relacionadas a uma entidade
 * Agrega eventos de processo_partes, atualizações de entidades e audiências
 */
export async function actionBuscarAtividadesPorEntidade(
  entityType: string,
  entityId: number
): Promise<ActionResult<Activity[]>> {
  try {
    if (!entityId || entityId <= 0) {
      return {
        success: false,
        error: "entityId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();
    const activities: Activity[] = [];

    // 1. Buscar vinculações em processo_partes (quando a entidade foi vinculada a processos)
    if (["cliente", "parte_contraria", "terceiro", "representante"].includes(entityType)) {
      const { data: vinculos, error: vinculosError } = await supabase
        .from("processo_partes")
        .select("id, processo_id, numero_processo, trt, created_at")
        .eq("tipo_entidade", entityType)
        .eq("entidade_id", entityId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!vinculosError && vinculos) {
        for (const vinculo of vinculos) {
          activities.push({
            id: `vinculo_${vinculo.id}`,
            title: `Vinculado ao processo ${vinculo.numero_processo}`,
            description: `Processo ${vinculo.numero_processo} - TRT ${vinculo.trt}`,
            created_at: vinculo.created_at,
            type: "vinculacao_processo",
          });
        }
      }
    }

    // 2. Buscar atualizações da própria entidade
    let tableName: string | null = null;
    if (entityType === "cliente") tableName = "clientes";
    else if (entityType === "parte_contraria") tableName = "partes_contrarias";
    else if (entityType === "terceiro") tableName = "terceiros";
    else if (entityType === "representante") tableName = "representantes";
    else if (entityType === "usuario") tableName = "usuarios";

    if (tableName) {
      const { data: entidade, error: entidadeError } = await supabase
        .from(tableName)
        .select("updated_at, nome")
        .eq("id", entityId)
        .single();

      if (!entidadeError && entidade && entidade.updated_at) {
        // Adicionar apenas se houve atualização recente (últimos 30 dias)
        const updatedAt = new Date(entidade.updated_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (updatedAt > thirtyDaysAgo) {
          activities.push({
            id: `update_${entityId}`,
            title: `Dados atualizados`,
            description: `Informações de ${entidade.nome || entityType} foram atualizadas`,
            created_at: entidade.updated_at,
            type: "atualizacao_dados",
          });
        }
      }
    }

    // 3. Para usuários, buscar audiências onde são responsáveis
    if (entityType === "usuario") {
      const { data: audiencias, error: audienciasError } = await supabase
        .from("audiencias")
        .select("id, numero_processo, data_inicio, status, status_descricao")
        .eq("responsavel_id", entityId)
        .order("data_inicio", { ascending: false })
        .limit(10);

      if (!audienciasError && audiencias) {
        for (const audiencia of audiencias) {
          const statusLabel =
            audiencia.status === "M"
              ? "Marcada"
              : audiencia.status === "F"
              ? "Finalizada"
              : audiencia.status === "C"
              ? "Cancelada"
              : audiencia.status_descricao || "Desconhecido";

          activities.push({
            id: `audiencia_${audiencia.id}`,
            title: `Audiência ${statusLabel.toLowerCase()} - ${audiencia.numero_processo}`,
            description: `Audiência do processo ${audiencia.numero_processo}`,
            created_at: audiencia.data_inicio,
            type: "audiencia",
          });
        }
      }
    }

    // Ordenar todas as atividades por data (mais recentes primeiro)
    activities.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Limitar a 20 atividades mais recentes
    const limitedActivities = activities.slice(0, 20);

    return {
      success: true,
      data: limitedActivities,
      message: "Atividades carregadas com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar atividades da entidade.",
    };
  }
}
