/**
 * NOTAS SERVICE
 *
 * Regras de negócio e validação do módulo Notas.
 */

import { z } from "zod";
import { appError, err, ok, Result } from "@/types";
import type {
  CreateEtiquetaInput,
  CreateNotaInput,
  DeleteEtiquetaInput,
  DeleteNotaInput,
  ListNotasInput,
  NotasPayload,
  SetNotaArquivadaInput,
  UpdateNotaInput,
  UpdateEtiquetaInput,
} from "./domain";
import {
  createEtiquetaSchema,
  createNotaSchema,
  deleteEtiquetaSchema,
  deleteNotaSchema,
  listNotasSchema,
  notasPayloadSchema,
  noteTypeSchema,
  setNotaArquivadaSchema,
  updateEtiquetaSchema,
  updateNotaSchema,
} from "./domain";
import * as repo from "./repository";

function validate<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", parsed.error.errors[0]?.message || "Dados inválidos"));
  }
  return ok(parsed.data as T);
}

export async function listarDadosNotas(
  usuarioId: number,
  input?: ListNotasInput
): Promise<Result<NotasPayload>> {
  const val = validate<ListNotasInput>(listNotasSchema, input ?? {});
  if (!val.success) return err(val.error);

  const labelsResult = await repo.listEtiquetas(usuarioId);
  if (!labelsResult.success) return err(labelsResult.error);

  const notesResult = await repo.listNotas(usuarioId, Boolean(val.data.includeArchived));
  if (!notesResult.success) return err(notesResult.error);

  const payload: NotasPayload = {
    notes: notesResult.data,
    labels: labelsResult.data,
  };

  const parsed = notasPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", "Dados de notas inválidos"));
  }

  return ok(parsed.data);
}

export async function criarNota(usuarioId: number, input: CreateNotaInput) {
  const val = validate<CreateNotaInput>(createNotaSchema, input);
  if (!val.success) return err(val.error);

  const type = val.data.type ?? noteTypeSchema.Enum.text;
  const labels = val.data.labels ?? [];
  const isArchived = val.data.isArchived ?? false;

  return repo.createNota(usuarioId, {
    title: val.data.title,
    content: val.data.content,
    type,
    isArchived,
    items: val.data.items,
    image: val.data.image,
    labels,
  });
}

export async function atualizarNota(usuarioId: number, input: UpdateNotaInput) {
  const val = validate<UpdateNotaInput>(updateNotaSchema, input);
  if (!val.success) return err(val.error);

  const { id, ...patch } = val.data;
  if (Object.keys(patch).length === 0) {
    return err(appError("VALIDATION_ERROR", "Nenhuma alteração informada."));
  }

  return repo.updateNota(usuarioId, val.data);
}

export async function arquivarNota(usuarioId: number, input: SetNotaArquivadaInput): Promise<Result<void>> {
  const val = validate<SetNotaArquivadaInput>(setNotaArquivadaSchema, input);
  if (!val.success) return err(val.error);
  return repo.setNotaArquivada(usuarioId, val.data);
}

export async function excluirNota(usuarioId: number, input: DeleteNotaInput): Promise<Result<void>> {
  const val = validate<DeleteNotaInput>(deleteNotaSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteNota(usuarioId, val.data.id);
}

export async function criarEtiqueta(usuarioId: number, input: CreateEtiquetaInput) {
  const val = validate<CreateEtiquetaInput>(createEtiquetaSchema, input);
  if (!val.success) return err(val.error);
  return repo.createEtiqueta(usuarioId, val.data);
}

export async function atualizarEtiqueta(usuarioId: number, input: UpdateEtiquetaInput) {
  const val = validate<UpdateEtiquetaInput>(updateEtiquetaSchema, input);
  if (!val.success) return err(val.error);
  return repo.updateEtiqueta(usuarioId, val.data);
}

export async function excluirEtiqueta(usuarioId: number, input: DeleteEtiquetaInput): Promise<Result<void>> {
  const val = validate<DeleteEtiquetaInput>(deleteEtiquetaSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteEtiqueta(usuarioId, val.data.id);
}


