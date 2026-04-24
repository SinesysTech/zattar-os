"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth";

import { bulkAtribuirResponsavel, bulkBaixar } from "../service";
import type { ActionResult } from "./types";

// =============================================================================
// SCHEMAS
// =============================================================================

const bulkTransferirResponsavelSchema = z.object({
  expedienteIds: z.array(z.number().int().positive()).min(1, "Selecione pelo menos um expediente"),
  responsavelId: z.number().int().positive().nullable(),
});

const bulkBaixarSchema = z.object({
  expedienteIds: z.array(z.number().int().positive()).min(1, "Selecione pelo menos um expediente"),
  justificativaBaixa: z.string().min(1, "Justificativa é obrigatória para baixa sem protocolo"),
});

// =============================================================================
// HELPER: resolver usuario.id do usuário autenticado
// =============================================================================

async function resolverUsuarioExecutouId(): Promise<
  | { success: true; usuarioId: number }
  | { success: false; error: string; message: string }
> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      success: false,
      error: "Não autenticado",
      message: "Usuário não autenticado.",
    };
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (usuarioError || !usuario) {
    return {
      success: false,
      error: "Usuário não encontrado",
      message: "Usuário não encontrado no sistema.",
    };
  }

  return { success: true, usuarioId: usuario.id };
}

// =============================================================================
// BULK ACTIONS
// =============================================================================

export async function actionBulkTransferirResponsavel(
  expedienteIds: number[],
  prevState: ActionResult | null,
  formData: FormData | ActionResult | null
): Promise<ActionResult> {
  try {
    await authenticateRequest();

    if (!(formData instanceof FormData)) {
      return prevState || {
        success: false,
        error: "Dados inválidos",
        message: "Formulário inválido",
      };
    }

    const responsavelIdValue = formData.get("responsavelId");
    const responsavelId =
      responsavelIdValue === "" || responsavelIdValue === "null"
        ? null
        : responsavelIdValue
        ? parseInt(responsavelIdValue as string, 10)
        : null;

    const validation = bulkTransferirResponsavelSchema.safeParse({
      expedienteIds,
      responsavelId,
    });

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const usuarioResult = await resolverUsuarioExecutouId();
    if (!usuarioResult.success) return usuarioResult;

    const resultado = await bulkAtribuirResponsavel(
      validation.data.expedienteIds,
      validation.data.responsavelId,
      usuarioResult.usuarioId
    );

    if (!resultado.success) {
      return {
        success: false,
        error: resultado.error.code,
        message: resultado.error.message,
      };
    }

    revalidatePath("/app/expedientes", "layout");

    return {
      success: true,
      data: resultado.data,
      message: `${resultado.data.atualizados} expediente(s) transferido(s) com sucesso.`,
    };
  } catch (error) {
    console.error("Erro ao transferir responsável em massa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao transferir responsável. Tente novamente.",
    };
  }
}

export async function actionBulkBaixar(
  expedienteIds: number[],
  prevState: ActionResult | null,
  formData: FormData | ActionResult | null
): Promise<ActionResult> {
  try {
    await authenticateRequest();

    if (!(formData instanceof FormData)) {
      return prevState || {
        success: false,
        error: "Dados inválidos",
        message: "Formulário inválido",
      };
    }

    const justificativaBaixa = formData.get("justificativaBaixa") as string;

    const validation = bulkBaixarSchema.safeParse({
      expedienteIds,
      justificativaBaixa,
    });

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const usuarioResult = await resolverUsuarioExecutouId();
    if (!usuarioResult.success) return usuarioResult;

    const resultado = await bulkBaixar(
      validation.data.expedienteIds,
      validation.data.justificativaBaixa,
      usuarioResult.usuarioId
    );

    if (!resultado.success) {
      return {
        success: false,
        error: resultado.error.code,
        message: resultado.error.message,
      };
    }

    revalidatePath("/app/expedientes", "layout");

    return {
      success: true,
      data: resultado.data,
      message: `${resultado.data.atualizados} expediente(s) baixado(s) com sucesso.`,
    };
  } catch (error) {
    console.error("Erro ao baixar expedientes em massa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao baixar expedientes. Tente novamente.",
    };
  }
}
