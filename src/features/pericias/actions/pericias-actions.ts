"use server";

import { revalidatePath } from "next/cache";

import { authenticateRequest } from "@/lib/auth";
import type { ListarPericiasParams } from "../domain";
import * as service from "../service";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

export async function actionListarPericias(
  params: ListarPericiasParams
): Promise<ActionResult> {
  try {
    const result = await service.listarPericias(params);
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
      message: "Perícias carregadas com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar perícias. Tente novamente.",
    };
  }
}

export async function actionObterPericia(id: number): Promise<ActionResult> {
  try {
    const result = await service.obterPericia(id);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    if (!result.data) {
      return {
        success: false,
        error: "Perícia não encontrada",
        message: "Perícia não encontrada",
      };
    }
    return { success: true, data: result.data, message: "Perícia carregada" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar perícia. Tente novamente.",
    };
  }
}

export async function actionAtribuirResponsavel(
  formData: FormData
): Promise<ActionResult> {
  try {
    const params = {
      periciaId: Number(formData.get("periciaId")),
      responsavelId: Number(formData.get("responsavelId")),
    };

    const result = await service.atribuirResponsavel(params);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/pericias");
    revalidatePath("/pericias/semana");
    revalidatePath("/pericias/mes");
    revalidatePath("/pericias/ano");
    revalidatePath("/pericias/lista");

    return { success: true, data: true, message: "Responsável atribuído" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atribuir responsável. Tente novamente.",
    };
  }
}

export async function actionAdicionarObservacao(
  formData: FormData
): Promise<ActionResult> {
  try {
    const params = {
      periciaId: Number(formData.get("periciaId")),
      observacoes: String(formData.get("observacoes") ?? ""),
    };

    const result = await service.adicionarObservacao(params);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/pericias");
    revalidatePath("/pericias/semana");
    revalidatePath("/pericias/mes");
    revalidatePath("/pericias/ano");
    revalidatePath("/pericias/lista");

    return { success: true, data: true, message: "Observações atualizadas" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar observações. Tente novamente.",
    };
  }
}

export async function actionListarEspecialidadesPericia(): Promise<ActionResult> {
  try {
    const result = await service.listarEspecialidadesPericia();
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    return {
      success: true,
      data: { especialidades: result.data },
      message: "Especialidades carregadas",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar especialidades. Tente novamente.",
    };
  }
}

export async function actionCriarPericia(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: "Não autenticado",
        message: "Você precisa estar autenticado para criar uma perícia.",
      };
    }

    const params = {
      numeroProcesso: String(formData.get("numeroProcesso") ?? ""),
      trt: String(formData.get("trt") ?? ""),
      grau: String(formData.get("grau") ?? ""),
      prazoEntrega: formData.get("prazoEntrega")
        ? String(formData.get("prazoEntrega"))
        : undefined,
      situacaoCodigo: formData.get("situacaoCodigo")
        ? String(formData.get("situacaoCodigo"))
        : undefined,
      especialidadeId: formData.get("especialidadeId")
        ? Number(formData.get("especialidadeId"))
        : undefined,
      peritoId: formData.get("peritoId")
        ? Number(formData.get("peritoId"))
        : undefined,
      observacoes: formData.get("observacoes")
        ? String(formData.get("observacoes"))
        : undefined,
    };

    // Usar o ID do usuário autenticado como advogadoId
    const advogadoId = user.id;

    const result = await service.criarPericia(params, advogadoId);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/pericias");
    revalidatePath("/pericias/semana");
    revalidatePath("/pericias/mes");
    revalidatePath("/pericias/ano");
    revalidatePath("/pericias/lista");

    return {
      success: true,
      data: result.data,
      message: "Perícia criada com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar perícia. Tente novamente.",
    };
  }
}


