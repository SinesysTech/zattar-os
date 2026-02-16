"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service-client";
import { requireAuth } from "./utils";
import { service as usuariosService } from "../service";
import { criarUsuarioSchema } from "../index";
import type { ListarUsuariosParams, UsuarioDados } from "../domain";

export async function actionListarUsuarios(params: ListarUsuariosParams = {}) {
  try {
    await requireAuth(["usuarios:visualizar"]);

    // Verificar permissão visualizar_todos?
    // O legacy backend/utils/auth/authorization.ts e services usavam permissões.
    // Assumimos que listar usuarios requer usuarios:visualizar.

    const result = await usuariosService.listarUsuarios(params);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar usuários",
    };
  }
}

export async function actionBuscarUsuario(id: number) {
  try {
    await requireAuth(["usuarios:visualizar"]);
    const usuario = await usuariosService.buscarUsuario(id);
    return { success: true, data: usuario };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar usuário",
    };
  }
}

export async function actionBuscarPorCpf(cpf: string) {
  try {
    await requireAuth(["usuarios:visualizar"]);
    const usuario = await usuariosService.buscarPorCpf(cpf);
    return { success: true, data: usuario };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar usuário por CPF",
    };
  }
}

export async function actionBuscarPorEmail(email: string) {
  try {
    await requireAuth(["usuarios:visualizar"]);
    const usuario = await usuariosService.buscarPorEmail(email);
    return { success: true, data: usuario };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar usuário por e-mail",
    };
  }
}

export async function actionCriarUsuario(
  dados: Omit<UsuarioDados, "authUserId"> & {
    senha?: string;
    emailConfirmado?: boolean;
  }
) {
  try {
    await requireAuth(["usuarios:criar"]);

    // Validar Zod
    const validation = criarUsuarioSchema.safeParse(dados);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    // Criar auth user se senha fornecida
    let authUserId: string | undefined;

    if (dados.senha && dados.senha.length >= 6) {
      const supabase = createServiceClient();
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: dados.emailCorporativo.trim().toLowerCase(),
          password: dados.senha,
          email_confirm: dados.emailConfirmado ?? true,
          user_metadata: { name: dados.nomeCompleto },
        });

      if (authError)
        return { success: false, error: `Erro Auth: ${authError.message}` };
      if (authUser?.user) authUserId = authUser.user.id;
    }

    // Criar usuario no banco
    const result = await usuariosService.criarUsuario({
      ...dados,
      authUserId,
    });

    if (!result.sucesso && authUserId) {
      // Rollback auth user
      const supabase = createServiceClient();
      await supabase.auth.admin.deleteUser(authUserId);
    }

    if (result.sucesso) {
      revalidatePath("/app/usuarios");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar usuário",
    };
  }
}

export async function actionAtualizarUsuario(
  id: number,
  dados: Partial<UsuarioDados>
) {
  try {
    await requireAuth(["usuarios:editar"]);

    // Se estiver desativando (ativo: false), usar lógica específica de desativação
    if (dados.ativo === false) {
      // Need to get userId - bug in original code, it was removed but still referenced
      const { userId } = await requireAuth(["usuarios:editar"]);
      const result = await usuariosService.desativarUsuario(id, userId);
      if (result.sucesso) {
        revalidatePath("/app/usuarios");
        revalidatePath(`/app/usuarios/${id}`);
      }
      // Garantir que retornamos o resultado completo, incluindo possíveis itensDesatribuidos
      return {
        success: result.sucesso,
        data: result.usuario,
        itensDesatribuidos: result.itensDesatribuidos,
        error: result.erro,
      };
    }

    const result = await usuariosService.atualizarUsuario(id, dados);

    if (result.sucesso) {
      revalidatePath("/app/usuarios");
      revalidatePath(`/app/usuarios/${id}`);
    }

    return {
      success: result.sucesso,
      data: result.usuario,
      error: result.erro,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar usuário",
    };
  }
}

export async function actionDesativarUsuario(id: number) {
  try {
    const { userId } = await requireAuth(["usuarios:deletar"]);
    const result = await usuariosService.desativarUsuario(id, userId);

    if (result.sucesso) {
      revalidatePath("/app/usuarios");
      revalidatePath(`/app/usuarios/${id}`);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao desativar usuário",
    };
  }
}

export async function actionSincronizarUsuarios() {
  try {
    await requireAuth(["usuarios:criar"]); // Permissão admin ou criar
    const resultados = await usuariosService.sincronizarUsuariosAuth();
    revalidatePath("/app/usuarios");
    return { success: true, data: resultados };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao sincronizar usuários",
    };
  }
}
