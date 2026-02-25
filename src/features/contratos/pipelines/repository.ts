/**
 * CONTRATOS PIPELINES - Camada de Persistência
 *
 * Funções de acesso ao banco de dados para Pipelines e Estágios de Contratos.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 * - Conversores snake_case (DB) → camelCase (interfaces TypeScript)
 */

import { createDbClient } from "@/lib/supabase";
import { Result, ok, err, appError } from "@/types";
import type {
  ContratoPipeline,
  ContratoPipelineEstagio,
  CreatePipelineInput,
  UpdatePipelineInput,
  CreateEstagioInput,
  UpdateEstagioInput,
  ListarPipelinesParams,
} from "./types";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_PIPELINES = "contrato_pipelines";
const TABLE_ESTAGIOS = "contrato_pipeline_estagios";
const TABLE_CONTRATOS = "contratos";

// =============================================================================
// CONVERSORES (snake_case DB → camelCase Interface)
// =============================================================================

function converterParaEstagio(
  data: Record<string, unknown>,
): ContratoPipelineEstagio {
  return {
    id: data.id as number,
    pipelineId: data.pipeline_id as number,
    nome: data.nome as string,
    slug: data.slug as string,
    cor: data.cor as string,
    ordem: (data.ordem as number) ?? 0,
    isDefault: (data.is_default as boolean) ?? false,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function converterParaPipeline(
  data: Record<string, unknown>,
): ContratoPipeline {
  const estagiosRaw =
    (data.contrato_pipeline_estagios as unknown[] | null) ?? [];

  return {
    id: data.id as number,
    segmentoId: data.segmento_id as number,
    nome: data.nome as string,
    descricao: (data.descricao as string | null) ?? null,
    ativo: (data.ativo as boolean) ?? true,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    estagios: estagiosRaw.map((e) =>
      converterParaEstagio(e as Record<string, unknown>),
    ),
  };
}

// =============================================================================
// FUNÇÕES DE LEITURA — PIPELINES
// =============================================================================

/**
 * Lista todos os pipelines com seus estágios, opcionalmente filtrados
 */
export async function findAllPipelines(
  params: ListarPipelinesParams = {},
): Promise<Result<ContratoPipeline[]>> {
  try {
    const db = createDbClient();

    let query = db
      .from(TABLE_PIPELINES)
      .select(
        `*, ${TABLE_ESTAGIOS}(*)`,
      )
      .order("nome", { ascending: true })
      .order("ordem", {
        foreignTable: TABLE_ESTAGIOS,
        ascending: true,
      });

    if (params.segmentoId !== undefined) {
      query = query.eq("segmento_id", params.segmentoId);
    }

    if (params.ativo !== undefined) {
      query = query.eq("ativo", params.ativo);
    }

    const { data, error } = await query;

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    const pipelines = (data || []).map((item) =>
      converterParaPipeline(item as Record<string, unknown>),
    );

    return ok(pipelines);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar pipelines",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Busca um pipeline pelo ID, incluindo seus estágios ordenados
 */
export async function findPipelineById(
  id: number,
): Promise<Result<ContratoPipeline | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_PIPELINES)
      .select(`*, ${TABLE_ESTAGIOS}(*)`)
      .eq("id", id)
      .order("ordem", {
        foreignTable: TABLE_ESTAGIOS,
        ascending: true,
      })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(converterParaPipeline(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar pipeline",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Busca o pipeline vinculado a um segmento específico
 */
export async function findPipelineBySegmentoId(
  segmentoId: number,
): Promise<Result<ContratoPipeline | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_PIPELINES)
      .select(`*, ${TABLE_ESTAGIOS}(*)`)
      .eq("segmento_id", segmentoId)
      .eq("ativo", true)
      .order("ordem", {
        foreignTable: TABLE_ESTAGIOS,
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    if (!data) return ok(null);

    return ok(converterParaPipeline(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar pipeline por segmento",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// FUNÇÕES DE ESCRITA — PIPELINES
// =============================================================================

/**
 * Cria um novo pipeline
 */
export async function savePipeline(
  input: CreatePipelineInput,
): Promise<Result<ContratoPipeline>> {
  try {
    const db = createDbClient();

    const { data: inserted, error } = await db
      .from(TABLE_PIPELINES)
      .insert({
        segmento_id: input.segmentoId,
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() ?? null,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao criar pipeline: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    const pipelineId = (inserted as Record<string, unknown>).id as number;

    const result = await findPipelineById(pipelineId);
    if (!result.success) return result;
    if (!result.data) {
      return err(
        appError("DATABASE_ERROR", "Pipeline recém-criado não foi encontrado"),
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar pipeline",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Atualiza um pipeline existente
 */
export async function updatePipeline(
  id: number,
  input: UpdatePipelineInput,
): Promise<Result<ContratoPipeline>> {
  try {
    const db = createDbClient();

    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      dadosAtualizacao.nome = input.nome.trim();
    }
    if (input.descricao !== undefined) {
      dadosAtualizacao.descricao = input.descricao?.trim() ?? null;
    }
    if (input.ativo !== undefined) {
      dadosAtualizacao.ativo = input.ativo;
    }

    const { error } = await db
      .from(TABLE_PIPELINES)
      .update(dadosAtualizacao)
      .eq("id", id);

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar pipeline: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    const result = await findPipelineById(id);
    if (!result.success) return result;
    if (!result.data) {
      return err(
        appError("DATABASE_ERROR", "Pipeline atualizado não foi encontrado"),
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar pipeline",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Remove permanentemente um pipeline.
 * Deve ser chamado apenas após verificar que nenhum contrato referencia seus estágios.
 */
export async function deletePipeline(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Remove os estágios primeiro (FK constraint)
    const { error: estagiosError } = await db
      .from(TABLE_ESTAGIOS)
      .delete()
      .eq("pipeline_id", id);

    if (estagiosError) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao remover estágios do pipeline: ${estagiosError.message}`,
          { code: estagiosError.code },
        ),
      );
    }

    const { error } = await db
      .from(TABLE_PIPELINES)
      .delete()
      .eq("id", id);

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao excluir pipeline: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir pipeline",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// FUNÇÕES DE LEITURA — ESTÁGIOS
// =============================================================================

/**
 * Busca um estágio pelo ID
 */
export async function findEstagioById(
  id: number,
): Promise<Result<ContratoPipelineEstagio | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_ESTAGIOS)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(converterParaEstagio(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar estágio",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Busca o estágio marcado como padrão (is_default = true) de um pipeline
 */
export async function findEstagioDefaultByPipelineId(
  pipelineId: number,
): Promise<Result<ContratoPipelineEstagio | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_ESTAGIOS)
      .select("*")
      .eq("pipeline_id", pipelineId)
      .eq("is_default", true)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    if (!data) return ok(null);

    return ok(converterParaEstagio(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar estágio padrão",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// FUNÇÕES DE ESCRITA — ESTÁGIOS
// =============================================================================

/**
 * Cria um novo estágio para um pipeline.
 * Se isDefault for true, remove o is_default dos outros estágios do pipeline antes.
 */
export async function saveEstagio(
  pipelineId: number,
  input: CreateEstagioInput,
): Promise<Result<ContratoPipelineEstagio>> {
  try {
    const db = createDbClient();

    // Garante unicidade do is_default por pipeline
    if (input.isDefault) {
      const { error: resetError } = await db
        .from(TABLE_ESTAGIOS)
        .update({ is_default: false })
        .eq("pipeline_id", pipelineId)
        .eq("is_default", true);

      if (resetError) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao remover is_default anterior: ${resetError.message}`,
            { code: resetError.code },
          ),
        );
      }
    }

    const { data: inserted, error } = await db
      .from(TABLE_ESTAGIOS)
      .insert({
        pipeline_id: pipelineId,
        nome: input.nome.trim(),
        slug: input.slug.trim(),
        cor: input.cor,
        ordem: input.ordem,
        is_default: input.isDefault,
      })
      .select()
      .single();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao criar estágio: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    return ok(converterParaEstagio(inserted as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar estágio",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Atualiza um estágio existente.
 * Se isDefault for true, remove o is_default dos outros estágios do mesmo pipeline antes.
 */
export async function updateEstagio(
  id: number,
  input: UpdateEstagioInput,
): Promise<Result<ContratoPipelineEstagio>> {
  try {
    const db = createDbClient();

    // Se estiver tornando este estágio o padrão, desmarcar o anterior primeiro
    if (input.isDefault === true) {
      // Precisamos saber o pipelineId do estágio atual
      const estagioAtualResult = await findEstagioById(id);
      if (!estagioAtualResult.success) return estagioAtualResult;
      if (!estagioAtualResult.data) {
        return err(appError("NOT_FOUND", "Estágio não encontrado"));
      }

      const { error: resetError } = await db
        .from(TABLE_ESTAGIOS)
        .update({ is_default: false })
        .eq("pipeline_id", estagioAtualResult.data.pipelineId)
        .eq("is_default", true)
        .neq("id", id);

      if (resetError) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao remover is_default anterior: ${resetError.message}`,
            { code: resetError.code },
          ),
        );
      }
    }

    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      dadosAtualizacao.nome = input.nome.trim();
    }
    if (input.slug !== undefined) {
      dadosAtualizacao.slug = input.slug.trim();
    }
    if (input.cor !== undefined) {
      dadosAtualizacao.cor = input.cor;
    }
    if (input.ordem !== undefined) {
      dadosAtualizacao.ordem = input.ordem;
    }
    if (input.isDefault !== undefined) {
      dadosAtualizacao.is_default = input.isDefault;
    }

    const { data: updated, error } = await db
      .from(TABLE_ESTAGIOS)
      .update(dadosAtualizacao)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar estágio: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    return ok(converterParaEstagio(updated as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar estágio",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Remove permanentemente um estágio.
 * Deve ser chamado apenas após verificar que nenhum contrato referencia este estágio.
 */
export async function deleteEstagio(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const { error } = await db
      .from(TABLE_ESTAGIOS)
      .delete()
      .eq("id", id);

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao excluir estágio: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir estágio",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Reordena os estágios de um pipeline.
 * A posição de cada ID no array determina sua nova ordem (índice 0 = ordem 0).
 */
export async function reorderEstagios(
  pipelineId: number,
  estagioIds: number[],
): Promise<Result<ContratoPipelineEstagio[]>> {
  try {
    const db = createDbClient();

    // Atualiza a ordem de cada estágio em sequência
    for (let i = 0; i < estagioIds.length; i++) {
      const { error } = await db
        .from(TABLE_ESTAGIOS)
        .update({ ordem: i })
        .eq("id", estagioIds[i])
        .eq("pipeline_id", pipelineId);

      if (error) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao reordenar estágio ${estagioIds[i]}: ${error.message}`,
            { code: error.code },
          ),
        );
      }
    }

    // Retorna os estágios já ordenados
    const { data, error: fetchError } = await db
      .from(TABLE_ESTAGIOS)
      .select("*")
      .eq("pipeline_id", pipelineId)
      .order("ordem", { ascending: true });

    if (fetchError) {
      return err(
        appError("DATABASE_ERROR", fetchError.message, {
          code: fetchError.code,
        }),
      );
    }

    const estagios = (data || []).map((e) =>
      converterParaEstagio(e as Record<string, unknown>),
    );

    return ok(estagios);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao reordenar estágios",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// FUNÇÕES DE VERIFICAÇÃO
// =============================================================================

/**
 * Conta quantos contratos estão no estágio informado.
 * Usado para verificar se um estágio pode ser deletado sem perda de dados.
 */
export async function countContratosByEstagioId(
  estagioId: number,
): Promise<Result<number>> {
  try {
    const db = createDbClient();

    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .eq("pipeline_estagio_id", estagioId);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos por estágio",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos que referenciam qualquer estágio de um pipeline.
 * Usado para verificar se um pipeline pode ser deletado.
 */
export async function countContratosByPipelineId(
  pipelineId: number,
): Promise<Result<number>> {
  try {
    const db = createDbClient();

    // Busca os IDs dos estágios do pipeline
    const { data: estagios, error: estagiosError } = await db
      .from(TABLE_ESTAGIOS)
      .select("id")
      .eq("pipeline_id", pipelineId);

    if (estagiosError) {
      return err(
        appError("DATABASE_ERROR", estagiosError.message, {
          code: estagiosError.code,
        }),
      );
    }

    if (!estagios || estagios.length === 0) {
      return ok(0);
    }

    const estagioIds = (estagios as Array<{ id: number }>).map((e) => e.id);

    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .in("pipeline_estagio_id", estagioIds);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos por pipeline",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}
