"use server";

import { revalidatePath } from "next/cache";
import { authenticateRequest as getCurrentUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/authorization";
import {
  listarCargos,
  buscarCargo,
  criarCargo,
  atualizarCargo,
  deletarCargo,
} from "../service";
import {
  criarCargoSchema,
  atualizarCargoSchema,
  type ListarCargosParams,
  type CriarCargoDTO,
  type AtualizarCargoDTO,
} from "../domain";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errorDetail?: unknown; // For structured errors like CargoComUsuariosError
};

export async function actionListarCargos(
  params: ListarCargosParams = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const hasPermission =
      (await checkPermission(user.id, "cargos", "visualizar")) ||
      (await checkPermission(user.id, "usuarios", "visualizar"));
    if (!hasPermission) return { success: false, error: "Sem permissão" };

    const result = await listarCargos(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarCargo(id: number): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const hasPermission = await checkPermission(
      user.id,
      "cargos",
      "visualizar"
    );
    if (!hasPermission) return { success: false, error: "Sem permissão" };

    const result = await buscarCargo(id);
    if (!result) return { success: false, error: "Cargo não encontrado" };

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarCargo(
  params: CriarCargoDTO
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const hasPermission =
      (await checkPermission(user.id, "cargos", "editar")) ||
      (await checkPermission(user.id, "usuarios", "editar"));
    if (!hasPermission) return { success: false, error: "Sem permissão" };

    const validation = criarCargoSchema.safeParse(params);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const result = await criarCargo(params, user.id);
    revalidatePath("/app/usuarios/cargos"); // Assuming UI location
    revalidatePath("/app/usuarios");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarCargo(
  id: number,
  params: AtualizarCargoDTO
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const hasPermission =
      (await checkPermission(user.id, "cargos", "editar")) ||
      (await checkPermission(user.id, "usuarios", "editar"));
    if (!hasPermission) return { success: false, error: "Sem permissão" };

    const validation = atualizarCargoSchema.safeParse(params);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const result = await atualizarCargo(id, params);
    revalidatePath("/app/usuarios/cargos");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarCargo(id: number): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const hasPermission =
      (await checkPermission(user.id, "cargos", "editar")) ||
      (await checkPermission(user.id, "usuarios", "editar"));
    if (!hasPermission) return { success: false, error: "Sem permissão" };

    await deletarCargo(id);
    revalidatePath("/app/usuarios/cargos");
    return { success: true };
  } catch (error) {
    // Check if error is JSON (CargoComUsuariosError)
    const errStr = String(error instanceof Error ? error.message : error);
    try {
      if (errStr.startsWith("{")) {
        const detail = JSON.parse(errStr);
        return { success: false, error: detail.error, errorDetail: detail };
      }
    } catch {
      // Ignore parse error
    }
    return { success: false, error: errStr };
  }
}
