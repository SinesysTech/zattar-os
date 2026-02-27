import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result } from "@/types/result";
import {
  type MembroProjeto,
  type AddMembroInput,
  type PapelProjeto,
  converterParaMembro,
} from "../domain";

const TABLE = "pm_membros_projeto";

export async function listMembrosByProject(
  projetoId: string
): Promise<Result<MembroProjeto[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .select(
        `*,
        usuario:usuarios!pm_membros_projeto_usuario_id_fkey(nome_completo, avatar_url, email_corporativo)`
      )
      .eq("projeto_id", projetoId)
      .order("papel", { ascending: true });

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const membros = (data ?? []).map((row) => {
      const flat = {
        ...row,
        usuario_nome: row.usuario?.nome_completo,
        usuario_avatar: row.usuario?.avatar_url,
        usuario_email: row.usuario?.email_corporativo,
      };
      return converterParaMembro(flat as Record<string, unknown>);
    });

    return ok(membros);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar membros", undefined, error as Error));
  }
}

export async function addMembro(input: AddMembroInput): Promise<Result<MembroProjeto>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        projeto_id: input.projetoId,
        usuario_id: input.usuarioId,
        papel: input.papel,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return err(appError("CONFLICT", "Usuário já é membro deste projeto"));
      }
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaMembro(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao adicionar membro", undefined, error as Error));
  }
}

export async function removeMembro(id: string): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).delete().eq("id", id);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover membro", undefined, error as Error));
  }
}

export async function updateMembroRole(
  id: string,
  papel: PapelProjeto
): Promise<Result<MembroProjeto>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .update({ papel })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaMembro(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao alterar papel", undefined, error as Error));
  }
}

export async function countGerentesByProject(projetoId: string): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("projeto_id", projetoId)
      .eq("papel", "gerente");

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao contar gerentes", undefined, error as Error));
  }
}

export async function findMembroById(id: string): Promise<Result<MembroProjeto>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE).select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", `Membro com ID ${id} não encontrado`));
      }
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaMembro(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao buscar membro", undefined, error as Error));
  }
}

export async function isUserMemberOfProject(
  projetoId: string,
  usuarioId: number
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("projeto_id", projetoId)
      .eq("usuario_id", usuarioId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok((count ?? 0) > 0);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao verificar membro", undefined, error as Error)
    );
  }
}
