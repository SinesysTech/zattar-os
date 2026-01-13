"use server";

import { createDbClient } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  descricao?: string | null;
  detalhes?: string | null;
  created_at: string;
  type: string;
  processo_numero?: string;
  trt?: string;
  status?: string;
};

type ActionResult<T = unknown> =
  | { success: true; data: T; message: string; totalCount?: number }
  | { success: false; error: string; message: string };

interface BuscarAtividadesParams {
  page?: number;
  pageSize?: number;
}

/**
 * Busca atividades relacionadas a uma entidade
 * Agrega eventos de criação, processo_partes, atualizações de entidades, audiências e documentos
 */
export async function actionBuscarAtividadesPorEntidade(
  entityType: string,
  entityId: number,
  params: BuscarAtividadesParams = {}
): Promise<ActionResult<Activity[]>> {
  try {
    if (!entityId || entityId <= 0) {
      return {
        success: false,
        error: "entityId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const { page = 1, pageSize = 50 } = params;
    const supabase = createDbClient();
    const activities: Activity[] = [];

    // Mapear tipo de entidade para nome da tabela
    let tableName: string | null = null;
    if (entityType === "cliente") tableName = "clientes";
    else if (entityType === "parte_contraria") tableName = "partes_contrarias";
    else if (entityType === "terceiro") tableName = "terceiros";
    else if (entityType === "representante") tableName = "representantes";
    else if (entityType === "usuario") tableName = "usuarios";

    // 1. Buscar evento de criação da entidade
    if (tableName) {
      const { data: entidade, error: entidadeError } = await supabase
        .from(tableName)
        .select("id, nome, created_at, updated_at")
        .eq("id", entityId)
        .single();

      if (!entidadeError && entidade) {
        // Evento de criação
        if (entidade.created_at) {
          const entityLabel = getEntityLabel(entityType);
          activities.push({
            id: `criacao_${entityId}`,
            title: `${entityLabel} cadastrado(a) no sistema`,
            description: `Registro de ${entidade.nome || entityLabel} criado no sistema`,
            descricao: `Registro de ${entidade.nome || entityLabel} criado no sistema`,
            created_at: entidade.created_at,
            type: "criacao",
          });
        }

        // Evento de atualização (se diferente de criação)
        if (entidade.updated_at && entidade.updated_at !== entidade.created_at) {
          const updatedAt = new Date(entidade.updated_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          if (updatedAt > thirtyDaysAgo) {
            activities.push({
              id: `update_${entityId}`,
              title: `Dados atualizados`,
              description: `Informações de ${entidade.nome || entityType} foram atualizadas`,
              descricao: `Informações de ${entidade.nome || entityType} foram atualizadas`,
              created_at: entidade.updated_at,
              type: "atualizacao_dados",
            });
          }
        }
      }
    }

    // 2. Buscar vinculações em processo_partes (quando a entidade foi vinculada a processos)
    if (["cliente", "parte_contraria", "terceiro", "representante"].includes(entityType)) {
      const { data: vinculos, error: vinculosError } = await supabase
        .from("processo_partes")
        .select("id, processo_id, numero_processo, trt, created_at")
        .eq("tipo_entidade", entityType)
        .eq("entidade_id", entityId)
        .order("created_at", { ascending: false });

      if (!vinculosError && vinculos) {
        for (const vinculo of vinculos) {
          activities.push({
            id: `vinculo_${vinculo.id}`,
            title: `Vinculado ao processo ${vinculo.numero_processo}`,
            description: `Processo ${vinculo.numero_processo} - TRT ${vinculo.trt}`,
            descricao: `Processo ${vinculo.numero_processo} - TRT ${vinculo.trt}`,
            created_at: vinculo.created_at,
            type: "vinculacao_processo",
            processo_numero: vinculo.numero_processo,
            trt: vinculo.trt,
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
        .order("data_inicio", { ascending: false });

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
            descricao: `Audiência do processo ${audiencia.numero_processo}`,
            created_at: audiencia.data_inicio,
            type: "audiencia",
            status: statusLabel.toLowerCase(),
          });
        }
      }

      // 4. Para usuários, buscar documentos criados por eles
      const { data: documentos, error: documentosError } = await supabase
        .from("documentos")
        .select("id, titulo, descricao, created_at")
        .eq("criado_por", entityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!documentosError && documentos) {
        for (const doc of documentos) {
          activities.push({
            id: `documento_${doc.id}`,
            title: `Documento criado: ${doc.titulo}`,
            description: doc.descricao || `Documento "${doc.titulo}" foi criado`,
            descricao: doc.descricao || `Documento "${doc.titulo}" foi criado`,
            created_at: doc.created_at,
            type: "documento",
          });
        }
      }
    }

    // 5. Para clientes e partes, buscar documentos através dos processos vinculados
    if (["cliente", "parte_contraria", "terceiro"].includes(entityType)) {
      // Primeiro, buscar os processos vinculados à entidade
      const { data: vinculos, error: vinculosError } = await supabase
        .from("processo_partes")
        .select("processo_id")
        .eq("tipo_entidade", entityType)
        .eq("entidade_id", entityId);

      if (!vinculosError && vinculos && vinculos.length > 0) {
        const processoIds = vinculos.map(v => v.processo_id);

        // Buscar documentos relacionados a esses processos (via pastas de processo)
        // Nota: Ajustar conforme a estrutura real do banco de dados
        const { data: pastas, error: pastasError } = await supabase
          .from("pastas")
          .select("id")
          .in("nome", processoIds.map(id => String(id)));

        if (!pastasError && pastas && pastas.length > 0) {
          const pastaIds = pastas.map(p => p.id);

          const { data: documentos, error: documentosError } = await supabase
            .from("documentos")
            .select("id, titulo, descricao, created_at")
            .in("pasta_id", pastaIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!documentosError && documentos) {
            for (const doc of documentos) {
              activities.push({
                id: `documento_${doc.id}`,
                title: `Documento anexado: ${doc.titulo}`,
                description: doc.descricao || `Documento "${doc.titulo}" relacionado ao processo`,
                descricao: doc.descricao || `Documento "${doc.titulo}" relacionado ao processo`,
                created_at: doc.created_at,
                type: "documento",
              });
            }
          }
        }
      }
    }

    // Ordenar todas as atividades por data (mais recentes primeiro)
    activities.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Total de atividades antes da paginação
    const totalCount = activities.length;

    // Aplicar paginação
    const offset = (page - 1) * pageSize;
    const paginatedActivities = activities.slice(offset, offset + pageSize);

    return {
      success: true,
      data: paginatedActivities,
      totalCount,
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

/**
 * Retorna o label em português para o tipo de entidade
 */
function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    cliente: "Cliente",
    parte_contraria: "Parte Contrária",
    terceiro: "Terceiro",
    representante: "Representante",
    usuario: "Usuário",
  };
  return labels[entityType] || entityType;
}
