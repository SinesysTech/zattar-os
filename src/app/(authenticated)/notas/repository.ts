/**
 * NOTAS REPOSITORY
 *
 * Camada de persistência do módulo Notas.
 * Padrão semelhante ao `app/(dashboard)/kanban/repository.ts`.
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { appError, err, ok, Result } from "@/types";
import type { Note, NoteLabel } from "./domain";

const TABLE_NOTAS = "notas";
const TABLE_ETIQUETAS = "nota_etiquetas";
const TABLE_VINCULOS = "nota_etiqueta_vinculos";

type NotaRow = {
  id: number;
  usuario_id: number;
  titulo: string | null;
  conteudo: string;
  is_archived: boolean;
  tipo: "text" | "checklist" | "image";
  items: unknown | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type EtiquetaRow = {
  id: number;
  usuario_id: number;
  title: string;
  color: string;
  created_at: string;
  updated_at: string;
};

type VinculoRow = {
  nota_id: number;
  etiqueta_id: number;
};

function rowToEtiqueta(row: EtiquetaRow): NoteLabel {
  return { id: row.id, title: row.title, color: row.color };
}

function rowToNota(row: NotaRow, labelIds: number[]): Note {
  return {
    id: row.id,
    title: row.titulo ?? "",
    content: row.conteudo || undefined,
    labels: labelIds,
    isArchived: row.is_archived,
    type: row.tipo,
    items: (row.items as Note["items"]) ?? undefined,
    image: row.image_url ?? undefined,
  };
}

export async function listEtiquetas(usuarioId: number): Promise<Result<NoteLabel[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ETIQUETAS)
      .select("id, usuario_id, title, color, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .order("title", { ascending: true });

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(((data as EtiquetaRow[]) ?? []).map(rowToEtiqueta));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar etiquetas",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function listNotas(
  usuarioId: number,
  includeArchived: boolean
): Promise<Result<Note[]>> {
  try {
    const db = createDbClient();

    let query = db
      .from(TABLE_NOTAS)
      .select("id, usuario_id, titulo, conteudo, is_archived, tipo, items, image_url, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .order("updated_at", { ascending: false });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data: notasData, error: notasError } = await query;
    if (notasError) return err(appError("DATABASE_ERROR", notasError.message, { code: notasError.code }));

    const notasRows = (notasData as NotaRow[]) ?? [];
    const notaIds = notasRows.map((n) => n.id);

    const labelIdsByNota: Record<number, number[]> = {};
    for (const id of notaIds) labelIdsByNota[id] = [];

    if (notaIds.length > 0) {
      const { data: vinculosData, error: vinculosError } = await db
        .from(TABLE_VINCULOS)
        .select("nota_id, etiqueta_id")
        .in("nota_id", notaIds);

      if (vinculosError) {
        return err(appError("DATABASE_ERROR", vinculosError.message, { code: vinculosError.code }));
      }

      for (const v of (vinculosData as VinculoRow[]) ?? []) {
        if (!labelIdsByNota[v.nota_id]) labelIdsByNota[v.nota_id] = [];
        labelIdsByNota[v.nota_id].push(v.etiqueta_id);
      }
    }

    const notas = notasRows.map((row) => rowToNota(row, labelIdsByNota[row.id] ?? []));
    return ok(notas);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar notas",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function createEtiqueta(
  usuarioId: number,
  input: { title: string; color: string }
): Promise<Result<NoteLabel>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ETIQUETAS)
      .insert({ usuario_id: usuarioId, title: input.title, color: input.color })
      .select("id, usuario_id, title, color, created_at, updated_at")
      .single();

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(rowToEtiqueta(data as EtiquetaRow));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar etiqueta",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function updateEtiqueta(
  usuarioId: number,
  input: { id: number; title?: string; color?: string }
): Promise<Result<NoteLabel>> {
  try {
    const db = createDbClient();
    const payload: Record<string, unknown> = {};
    if (typeof input.title === "string") payload.title = input.title;
    if (typeof input.color === "string") payload.color = input.color;

    const { data, error } = await db
      .from(TABLE_ETIQUETAS)
      .update(payload)
      .eq("id", input.id)
      .eq("usuario_id", usuarioId)
      .select("id, usuario_id, title, color, created_at, updated_at")
      .single();

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(rowToEtiqueta(data as EtiquetaRow));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar etiqueta",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function deleteEtiqueta(usuarioId: number, id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_ETIQUETAS).delete().eq("id", id).eq("usuario_id", usuarioId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir etiqueta",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function createNota(
  usuarioId: number,
  input: {
    title: string;
    content?: string;
    type: Note["type"];
    isArchived: boolean;
    items?: Note["items"];
    image?: string;
    labels: number[];
  }
): Promise<Result<Note>> {
  try {
    const db = createDbClient();

    const { data: notaData, error: notaError } = await db
      .from(TABLE_NOTAS)
      .insert({
        usuario_id: usuarioId,
        titulo: input.title,
        conteudo: input.content ?? "",
        tipo: input.type,
        is_archived: input.isArchived,
        items: input.items ?? null,
        image_url: input.image ?? null,
      })
      .select("id, usuario_id, titulo, conteudo, is_archived, tipo, items, image_url, created_at, updated_at")
      .single();

    if (notaError) return err(appError("DATABASE_ERROR", notaError.message, { code: notaError.code }));
    const row = notaData as NotaRow;

    const labelIds = input.labels ?? [];
    if (labelIds.length > 0) {
      const vinculosPayload = labelIds.map((labelId) => ({
        nota_id: row.id,
        etiqueta_id: labelId,
      }));

      const { error: vincErr } = await db.from(TABLE_VINCULOS).insert(vinculosPayload);
      if (vincErr) return err(appError("DATABASE_ERROR", vincErr.message, { code: vincErr.code }));
    }

    return ok(rowToNota(row, labelIds));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar nota",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function updateNota(
  usuarioId: number,
  input: {
    id: number;
    title?: string;
    content?: string;
    type?: Note["type"];
    isArchived?: boolean;
    items?: Note["items"];
    image?: string;
    labels?: number[];
  }
): Promise<Result<Note>> {
  try {
    const db = createDbClient();

    const payload: Record<string, unknown> = {};
    if (typeof input.title === "string") payload.titulo = input.title;
    if (typeof input.content === "string") payload.conteudo = input.content;
    if (typeof input.type === "string") payload.tipo = input.type;
    if (typeof input.isArchived === "boolean") payload.is_archived = input.isArchived;
    if (typeof input.items !== "undefined") payload.items = input.items ?? null;
    if (typeof input.image === "string") payload.image_url = input.image || null;

    const shouldUpdateRow = Object.keys(payload).length > 0;
    if (shouldUpdateRow) {
      const { error: updateError } = await db
        .from(TABLE_NOTAS)
        .update(payload)
        .eq("id", input.id)
        .eq("usuario_id", usuarioId);

      if (updateError) return err(appError("DATABASE_ERROR", updateError.message, { code: updateError.code }));
    }

    if (Array.isArray(input.labels)) {
      const { error: delErr } = await db.from(TABLE_VINCULOS).delete().eq("nota_id", input.id);
      if (delErr) return err(appError("DATABASE_ERROR", delErr.message, { code: delErr.code }));

      if (input.labels.length > 0) {
        const vinculosPayload = input.labels.map((labelId) => ({
          nota_id: input.id,
          etiqueta_id: labelId,
        }));
        const { error: insErr } = await db.from(TABLE_VINCULOS).insert(vinculosPayload);
        if (insErr) return err(appError("DATABASE_ERROR", insErr.message, { code: insErr.code }));
      }
    }

    const { data: notaData, error: notaError } = await db
      .from(TABLE_NOTAS)
      .select("id, usuario_id, titulo, conteudo, is_archived, tipo, items, image_url, created_at, updated_at")
      .eq("id", input.id)
      .eq("usuario_id", usuarioId)
      .single();

    if (notaError) return err(appError("DATABASE_ERROR", notaError.message, { code: notaError.code }));
    const row = notaData as NotaRow;

    let labelIds: number[] = [];
    if (Array.isArray(input.labels)) {
      labelIds = input.labels;
    } else {
      const { data: vinculosData, error: vinculosError } = await db
        .from(TABLE_VINCULOS)
        .select("nota_id, etiqueta_id")
        .eq("nota_id", input.id);

      if (vinculosError) {
        return err(appError("DATABASE_ERROR", vinculosError.message, { code: vinculosError.code }));
      }

      labelIds = ((vinculosData as VinculoRow[]) ?? []).map((v) => v.etiqueta_id);
    }

    return ok(rowToNota(row, labelIds));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar nota",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function setNotaArquivada(
  usuarioId: number,
  input: { id: number; isArchived: boolean }
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_NOTAS)
      .update({ is_archived: input.isArchived })
      .eq("id", input.id)
      .eq("usuario_id", usuarioId);

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao arquivar/desarquivar nota",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function deleteNota(usuarioId: number, id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_NOTAS).delete().eq("id", id).eq("usuario_id", usuarioId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir nota",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}


