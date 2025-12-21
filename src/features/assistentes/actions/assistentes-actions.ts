"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "./utils";
import * as service from "../service";
import { Assistente, AssistentesParams } from "../types";

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function actionListarAssistentes(
  params: AssistentesParams = {}
): Promise<ActionResponse<Assistente[]>> {
  try {
    await requireAuth(["assistentes:listar"]);
    // Sempre passar ativo: true para listar apenas assistentes não deletados
    const result = await service.listarAssistentes({ ...params, ativo: true });
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao listar assistentes",
    };
  }
}

export async function actionBuscarAssistente(
  id: number
): Promise<ActionResponse<Assistente>> {
  try {
    await requireAuth(["assistentes:listar"]);
    const assistente = await service.buscarAssistentePorId(id);
    if (!assistente) {
      return { success: false, error: "Assistente não encontrado" };
    }
    return { success: true, data: assistente };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao buscar assistente",
    };
  }
}

export async function actionCriarAssistente(
  formData: FormData
): Promise<ActionResponse<Assistente>> {
  try {
    const { userId } = await requireAuth(["assistentes:criar"]);

    // Extract data from FormData
    const data = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      iframe_code: formData.get("iframe_code"),
    };

    const assistente = await service.criarAssistente(data, userId);

    revalidatePath("/assistentes");
    return { success: true, data: assistente };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao criar assistente",
    };
  }
}

export async function actionAtualizarAssistente(
  id: number,
  formData: FormData
): Promise<ActionResponse<Assistente>> {
  try {
    await requireAuth(["assistentes:editar"]);

    const data: Record<string, unknown> = {};
    if (formData.has("nome")) data.nome = formData.get("nome");
    if (formData.has("descricao")) data.descricao = formData.get("descricao");
    if (formData.has("iframe_code"))
      data.iframe_code = formData.get("iframe_code");
    if (formData.has("ativo")) data.ativo = formData.get("ativo") === "true";

    const assistente = await service.atualizarAssistente(id, data);

    revalidatePath("/assistentes");
    return { success: true, data: assistente };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar assistente",
    };
  }
}

export async function actionDeletarAssistente(
  id: number
): Promise<ActionResponse<boolean>> {
  try {
    await requireAuth(["assistentes:deletar"]);
    await service.deletarAssistente(id);
    revalidatePath("/assistentes");
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao deletar assistente",
    };
  }
}
