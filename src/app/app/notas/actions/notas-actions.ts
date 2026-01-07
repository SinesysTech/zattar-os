/**
 * Server Actions - Notas
 */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import {
  createEtiquetaSchema,
  createNotaSchema,
  deleteEtiquetaSchema,
  deleteNotaSchema,
  listNotasSchema,
  setNotaArquivadaSchema,
  updateEtiquetaSchema,
  updateNotaSchema,
} from "../domain";
import * as service from "../service";

export const actionListarDadosNotas = authenticatedAction(
  listNotasSchema,
  async (data, { user }) => {
    const result = await service.listarDadosNotas(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

export const actionCriarNota = authenticatedAction(
  createNotaSchema,
  async (data, { user }) => {
    const result = await service.criarNota(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return result.data;
  }
);

export const actionAtualizarNota = authenticatedAction(
  updateNotaSchema,
  async (data, { user }) => {
    const result = await service.atualizarNota(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return result.data;
  }
);

export const actionArquivarNota = authenticatedAction(
  setNotaArquivadaSchema,
  async (data, { user }) => {
    const result = await service.arquivarNota(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return { success: true };
  }
);

export const actionExcluirNota = authenticatedAction(
  deleteNotaSchema,
  async (data, { user }) => {
    const result = await service.excluirNota(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return { success: true };
  }
);

export const actionCriarEtiqueta = authenticatedAction(
  createEtiquetaSchema,
  async (data, { user }) => {
    const result = await service.criarEtiqueta(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return result.data;
  }
);

export const actionAtualizarEtiqueta = authenticatedAction(
  updateEtiquetaSchema,
  async (data, { user }) => {
    const result = await service.atualizarEtiqueta(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return result.data;
  }
);

export const actionExcluirEtiqueta = authenticatedAction(
  deleteEtiquetaSchema,
  async (data, { user }) => {
    const result = await service.excluirEtiqueta(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/notas");
    return { success: true };
  }
);

const emptySchema = z.object({});

export const actionPingNotas = authenticatedAction(
  emptySchema,
  async (_data, { user }) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado.");
    }
    return { ok: true };
  }
);


