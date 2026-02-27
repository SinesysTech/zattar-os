"use server";

import { revalidatePath } from "next/cache";
import { type Result } from "@/types/result";
import type { Lembrete, CreateLembreteInput } from "../domain";
import * as reminderService from "../services/reminder.service";

const PM_PATH = "/app/project-management";

export async function actionListarLembretes(
  usuarioId: number,
  options?: { concluido?: boolean; limite?: number }
): Promise<Result<Lembrete[]>> {
  return reminderService.listarLembretes(usuarioId, options);
}

export async function actionCriarLembrete(
  input: CreateLembreteInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  const result = await reminderService.criarLembrete(input, usuarioId);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionConcluirLembrete(
  id: string,
  concluido: boolean
): Promise<Result<void>> {
  const result = await reminderService.concluirLembrete(id, concluido);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionExcluirLembrete(id: string): Promise<Result<void>> {
  const result = await reminderService.excluirLembrete(id);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}
