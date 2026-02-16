/**
 * EVENT REPLICATION SERVICE
 *
 * Cria/atualiza registros em todo_items quando eventos são criados ou alterados.
 * Usa upsert idempotente baseado no unique index (source, source_entity_id).
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { appError, err, ok, Result } from "@/types";
import type { UnifiedEventItem, EventSource, TodoStatusValue, PriorityValue } from "./domain";
import { mapSourceStatusToTodoStatus, calcularPrioridade, SOURCE_LABELS } from "./domain";
import { listarTodosEventos } from "./service";

// =============================================================================
// REPLICAR EVENTO → TODO
// =============================================================================

export interface ReplicarEventoInput {
  source: EventSource;
  sourceEntityId: string;
  titulo: string;
  descricao?: string;
  status: TodoStatusValue;
  priority: PriorityValue;
  dueDate?: string | null;
  responsavelId: number | null;
}

/**
 * Cria um todo_items para um evento (idempotente via unique index).
 * Se já existir, atualiza título, descrição, status, prioridade e data.
 */
export async function replicarEventoParaTodo(
  evento: UnifiedEventItem
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const status = mapSourceStatusToTodoStatus(evento.source, evento.statusOrigem);
    const priority = calcularPrioridade(evento.dataVencimento, evento.prazoVencido);
    const entityIdStr = String(evento.sourceEntityId);

    // Verificar se já existe
    const { data: existing, error: findError } = await db
      .from("todo_items")
      .select("id, usuario_id")
      .eq("source", evento.source)
      .eq("source_entity_id", entityIdStr)
      .maybeSingle();

    if (findError) {
      return err(appError("DATABASE_ERROR", findError.message, { code: findError.code }));
    }

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await db
        .from("todo_items")
        .update({
          title: `${SOURCE_LABELS[evento.source]} — ${evento.titulo}`,
          description: evento.descricao ?? null,
          status,
          priority,
          due_date: evento.dataVencimento ?? null,
        })
        .eq("id", existing.id);

      if (updateError) {
        return err(appError("DATABASE_ERROR", updateError.message, { code: updateError.code }));
      }
      return ok(undefined);
    }

    // Criar novo registro
    // Se não tem responsável (obrigações), usa usuario_id = 1 (admin default)
    const usuarioId = evento.responsavelId ?? 1;

    // Buscar última posição
    const { data: lastPosData } = await db
      .from("todo_items")
      .select("position")
      .eq("usuario_id", usuarioId)
      .order("position", { ascending: false })
      .limit(1);

    const lastPos = (lastPosData?.[0] as { position?: number } | undefined)?.position ?? -1;

    const { data: newItem, error: insertError } = await db
      .from("todo_items")
      .insert({
        usuario_id: usuarioId,
        title: `${SOURCE_LABELS[evento.source]} — ${evento.titulo}`,
        description: evento.descricao ?? null,
        status,
        priority,
        due_date: evento.dataVencimento ?? null,
        position: lastPos + 1,
        source: evento.source,
        source_entity_id: entityIdStr,
      })
      .select("id")
      .single();

    if (insertError) {
      // Unique violation = já existe (race condition), ignorar
      if (insertError.code === "23505") return ok(undefined);
      return err(appError("DATABASE_ERROR", insertError.message, { code: insertError.code }));
    }

    // Criar todo_assignees se há responsável
    if (evento.responsavelId && newItem) {
      await db.from("todo_assignees").insert({
        todo_id: newItem.id,
        usuario_id: evento.responsavelId,
      });
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao replicar evento para to-do",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// SINCRONIZAR TODO COM EVENTO (forward sync: source → todo)
// =============================================================================

export interface SincronizarTodoInput {
  status?: TodoStatusValue;
  titulo?: string;
  descricao?: string;
  dueDate?: string | null;
}

/**
 * Atualiza um todo_items existente quando a entidade de origem muda.
 * Busca pelo (source, source_entity_id).
 */
export async function sincronizarTodoComEvento(
  source: EventSource,
  sourceEntityId: string,
  updates: SincronizarTodoInput
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.titulo !== undefined) payload.title = updates.titulo;
    if (updates.descricao !== undefined) payload.description = updates.descricao;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;

    if (Object.keys(payload).length === 0) return ok(undefined);

    const { error } = await db
      .from("todo_items")
      .update(payload)
      .eq("source", source)
      .eq("source_entity_id", sourceEntityId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao sincronizar todo com evento",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// BACKFILL: cria todos para eventos existentes que não têm
// =============================================================================

export async function backfillTodosFromEvents(): Promise<
  Result<{ created: number; skipped: number }>
> {
  try {
    const eventos = await listarTodosEventos();

    let created = 0;
    let skipped = 0;

    for (const evento of eventos) {
      const result = await replicarEventoParaTodo(evento);
      if (result.success) {
        created++;
      } else {
        skipped++;
      }
    }

    return ok({ created, skipped });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro no backfill de todos",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
