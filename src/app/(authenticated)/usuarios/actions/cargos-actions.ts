"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "./utils";
import { createServiceClient } from "@/lib/supabase/service-client";
import { getCargosListKey, deleteCached } from "@/lib/redis";
import { service as usuariosService } from "../service";

export async function actionListarCargos() {
  try {
    await requireAuth(["usuarios:visualizar"]);
    const cargos = await usuariosService.listarCargos();
    return { success: true, data: cargos };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar cargos",
    };
  }
}

export async function actionCriarCargo(dados: {
  nome: string;
  descricao?: string;
}) {
  try {
    await requireAuth(["usuarios:editar"]); // Or specific cargo permission

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cargos")
      .insert({
        nome: dados.nome.trim(),
        descricao: dados.descricao?.trim(),
        ativo: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Invalidate cache
    await deleteCached(getCargosListKey({}));
    revalidatePath("/app/usuarios");

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar cargo",
    };
  }
}

export async function actionAtualizarCargo(
  id: number,
  dados: { nome?: string; descricao?: string; ativo?: boolean }
) {
  try {
    await requireAuth(["usuarios:editar"]);
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cargos")
      .update(dados)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await deleteCached(getCargosListKey({}));
    revalidatePath("/app/usuarios");

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar cargo",
    };
  }
}

export async function actionDeletarCargo(id: number) {
  try {
    await requireAuth(["usuarios:editar"]);
    const supabase = createServiceClient();

    // Check usage?
    const { count } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("cargo_id", id);
    if (count && count > 0) {
      return {
        success: false,
        error: "Não é possível excluir cargo em uso por usuários.",
      };
    }

    const { error } = await supabase.from("cargos").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    await deleteCached(getCargosListKey({}));
    revalidatePath("/app/usuarios");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir cargo",
    };
  }
}
