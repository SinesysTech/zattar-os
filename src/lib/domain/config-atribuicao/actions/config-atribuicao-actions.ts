"use server";

import { revalidatePath } from "next/cache";

import type { RegiaoAtribuicao, MetodoBalanceamento } from "../domain";
import * as service from "../service";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

// ============================================================================
// LISTAR REGIÕES
// ============================================================================

export async function actionListarRegioesAtribuicao(): Promise<
  ActionResult<RegiaoAtribuicao[]>
> {
  try {
    const result = await service.listarRegioes();
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Regiões carregadas com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar regiões. Tente novamente.",
    };
  }
}

// ============================================================================
// CRIAR REGIÃO
// ============================================================================

export async function actionCriarRegiaoAtribuicao(
  formData: FormData
): Promise<ActionResult<RegiaoAtribuicao>> {
  try {
    const nome = formData.get("nome")?.toString() ?? "";
    const descricao = formData.get("descricao")?.toString() || undefined;
    const trtsJson = formData.get("trts")?.toString() ?? "[]";
    const responsaveisIdsJson =
      formData.get("responsaveisIds")?.toString() ?? "[]";
    const metodoBalanceamento = (formData.get("metodoBalanceamento")?.toString() ??
      "contagem_processos") as MetodoBalanceamento;
    const ativo = formData.get("ativo") === "true";
    const prioridade = Number(formData.get("prioridade") ?? "0");

    const trts: string[] = JSON.parse(trtsJson);
    const responsaveisIds: number[] = JSON.parse(responsaveisIdsJson);

    const input = {
      nome,
      descricao,
      trts,
      responsaveisIds,
      metodoBalanceamento,
      ativo,
      prioridade,
    };

    const result = await service.criarRegiao(input);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Região criada com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar região. Tente novamente.",
    };
  }
}

// ============================================================================
// ATUALIZAR REGIÃO
// ============================================================================

export async function actionAtualizarRegiaoAtribuicao(
  formData: FormData
): Promise<ActionResult<RegiaoAtribuicao>> {
  try {
    const id = Number(formData.get("id"));
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID da região inválido",
        message: "ID da região inválido",
      };
    }

    const nome = formData.get("nome")?.toString();
    const descricao = formData.get("descricao")?.toString();
    const trtsJson = formData.get("trts")?.toString();
    const responsaveisIdsJson = formData.get("responsaveisIds")?.toString();
    const metodoBalanceamento = formData
      .get("metodoBalanceamento")
      ?.toString() as MetodoBalanceamento | undefined;
    const ativoStr = formData.get("ativo")?.toString();
    const prioridadeStr = formData.get("prioridade")?.toString();

    const input: Record<string, unknown> = {};

    if (nome !== undefined && nome !== null) input.nome = nome;
    if (descricao !== undefined) input.descricao = descricao || undefined;
    if (trtsJson) input.trts = JSON.parse(trtsJson);
    if (responsaveisIdsJson)
      input.responsaveisIds = JSON.parse(responsaveisIdsJson);
    if (metodoBalanceamento) input.metodoBalanceamento = metodoBalanceamento;
    if (ativoStr !== undefined) input.ativo = ativoStr === "true";
    if (prioridadeStr !== undefined) input.prioridade = Number(prioridadeStr);

    const result = await service.atualizarRegiao(id, input);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Região atualizada com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar região. Tente novamente.",
    };
  }
}

// ============================================================================
// EXCLUIR REGIÃO
// ============================================================================

export async function actionExcluirRegiaoAtribuicao(
  id: number
): Promise<ActionResult<boolean>> {
  try {
    const result = await service.excluirRegiao(id);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: true,
      message: "Região excluída com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao excluir região. Tente novamente.",
    };
  }
}

// ============================================================================
// ALTERNAR STATUS ATIVO
// ============================================================================

export async function actionAlternarStatusRegiao(
  id: number,
  ativo: boolean
): Promise<ActionResult<RegiaoAtribuicao>> {
  try {
    const result = await service.alternarStatusRegiao(id, ativo);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: ativo ? "Região ativada" : "Região desativada",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao alterar status da região. Tente novamente.",
    };
  }
}

// ============================================================================
// VERIFICAR CONFLITOS
// ============================================================================

export async function actionVerificarConflitosAtribuicao(): Promise<
  ActionResult<{ trt: string; regioes: string[] }[]>
> {
  try {
    const result = await service.verificarConflitos();
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message:
        result.data.length > 0
          ? `${result.data.length} TRT(s) em conflito`
          : "Nenhum conflito encontrado",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao verificar conflitos. Tente novamente.",
    };
  }
}
