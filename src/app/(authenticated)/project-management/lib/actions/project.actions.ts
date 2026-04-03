"use server";

import { revalidatePath } from "next/cache";
import { type Result, type PaginatedResponse } from "@/types/result";
import type { Projeto, CreateProjetoInput, UpdateProjetoInput, ListarProjetosParams } from "../domain";
import * as projectService from "../services/project.service";

const PM_PATH = "/app/project-management";

export async function actionListarProjetos(
  params: ListarProjetosParams
): Promise<Result<PaginatedResponse<Projeto>>> {
  return projectService.listarProjetos(params);
}

export async function actionBuscarProjeto(id: string): Promise<Result<Projeto>> {
  return projectService.buscarProjeto(id);
}

export async function actionCriarProjeto(
  input: CreateProjetoInput,
  criadoPor: number
): Promise<Result<Projeto>> {
  const result = await projectService.criarProjeto(input, criadoPor);

  if (result.success) {
    revalidatePath(PM_PATH);
    revalidatePath(`${PM_PATH}/projects`);
  }

  return result;
}

export async function actionAtualizarProjeto(
  id: string,
  input: UpdateProjetoInput
): Promise<Result<Projeto>> {
  const result = await projectService.atualizarProjeto(id, input);

  if (result.success) {
    revalidatePath(PM_PATH);
    revalidatePath(`${PM_PATH}/projects`);
    revalidatePath(`${PM_PATH}/projects/${id}`);
  }

  return result;
}

export async function actionExcluirProjeto(id: string): Promise<Result<void>> {
  const result = await projectService.excluirProjeto(id);

  if (result.success) {
    revalidatePath(PM_PATH);
    revalidatePath(`${PM_PATH}/projects`);
  }

  return result;
}
