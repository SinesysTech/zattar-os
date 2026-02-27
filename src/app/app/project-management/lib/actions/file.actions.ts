"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result } from "@/types/result";
import { type Anexo, converterParaAnexo } from "../domain";
import {
  uploadToSupabase,
  deleteFromSupabase,
} from "@/lib/storage/supabase-storage.service";

const PM_PATH = "/app/project-management";
const TABLE = "pm_anexos";
const STORAGE_FOLDER = "project-management";

export async function actionListarAnexos(
  projetoId: string
): Promise<Result<Anexo[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .select(
        `*,
        usuario:usuarios!pm_anexos_usuario_id_fkey(nome_completo)`
      )
      .eq("projeto_id", projetoId)
      .order("created_at", { ascending: false });

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const anexos = (data ?? []).map((row) => {
      const flat = {
        ...row,
        usuario_nome: row.usuario?.nome_completo,
      };
      return converterParaAnexo(flat as Record<string, unknown>);
    });

    return ok(anexos);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar anexos",
        undefined,
        error as Error
      )
    );
  }
}

export async function actionUploadAnexo(
  formData: FormData
): Promise<Result<Anexo>> {
  try {
    const file = formData.get("file") as File;
    const projetoId = formData.get("projetoId") as string;
    const usuarioId = Number(formData.get("usuarioId"));

    if (!file) {
      return err(appError("VALIDATION_ERROR", "Nenhum arquivo enviado"));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${STORAGE_FOLDER}/${projetoId}/${Date.now()}-${file.name}`;

    const uploadResult = await uploadToSupabase({
      buffer,
      key,
      contentType: file.type,
    });

    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        projeto_id: projetoId,
        usuario_id: usuarioId,
        nome_arquivo: file.name,
        url: uploadResult.url,
        tamanho_bytes: file.size,
        tipo_mime: file.type,
      })
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    revalidatePath(`${PM_PATH}/projects/${projetoId}/files`);
    return ok(converterParaAnexo(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao fazer upload",
        undefined,
        error as Error
      )
    );
  }
}

export async function actionExcluirAnexo(
  anexoId: string,
  projetoId: string
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Buscar URL para extrair a key do storage
    const { data: anexo, error: fetchError } = await db
      .from(TABLE)
      .select("url")
      .eq("id", anexoId)
      .single();

    if (fetchError) {
      return err(appError("DATABASE_ERROR", fetchError.message));
    }

    // Deletar do banco
    const { error } = await db.from(TABLE).delete().eq("id", anexoId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    // Tentar deletar do storage (best-effort)
    if (anexo?.url) {
      try {
        const url = new URL(anexo.url as string);
        const pathParts = url.pathname.split("/storage/v1/object/public/");
        if (pathParts[1]) {
          const [, ...keyParts] = pathParts[1].split("/");
          await deleteFromSupabase(keyParts.join("/"));
        }
      } catch {
        // Deleção do storage é best-effort
      }
    }

    revalidatePath(`${PM_PATH}/projects/${projetoId}/files`);
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir anexo",
        undefined,
        error as Error
      )
    );
  }
}
