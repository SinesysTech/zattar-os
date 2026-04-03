import { ok, err, appError, type Result, type PaginatedResponse } from "@/types/result";
import {
  type Projeto,
  type CreateProjetoInput,
  type UpdateProjetoInput,
  type ListarProjetosParams,
  createProjetoSchema,
  updateProjetoSchema,
} from "../domain";
import * as projectRepo from "../repositories/project.repository";
import * as teamRepo from "../repositories/team.repository";
import * as taskRepo from "../repositories/task.repository";

export async function listarProjetos(
  params: ListarProjetosParams
): Promise<Result<PaginatedResponse<Projeto>>> {
  return projectRepo.listProjetos(params);
}

export async function buscarProjeto(id: string): Promise<Result<Projeto>> {
  return projectRepo.findProjetoById(id);
}

export async function criarProjeto(
  input: CreateProjetoInput,
  criadoPor: number
): Promise<Result<Projeto>> {
  // Validação
  const validation = createProjetoSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  // Criar projeto
  const result = await projectRepo.saveProjeto(validation.data, criadoPor);
  if (!result.success) return result;

  // Auto-adicionar criador como gerente
  await teamRepo.addMembro({
    projetoId: result.data.id,
    usuarioId: criadoPor,
    papel: "gerente",
  });

  // Se o responsável for diferente do criador, adicionar como gerente também
  if (validation.data.responsavelId !== criadoPor) {
    await teamRepo.addMembro({
      projetoId: result.data.id,
      usuarioId: validation.data.responsavelId,
      papel: "gerente",
    });
  }

  return result;
}

export async function atualizarProjeto(
  id: string,
  input: UpdateProjetoInput
): Promise<Result<Projeto>> {
  const validation = updateProjetoSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  return projectRepo.updateProjeto(id, validation.data);
}

export async function excluirProjeto(id: string): Promise<Result<void>> {
  // Verificar se o projeto existe
  const projeto = await projectRepo.findProjetoById(id);
  if (!projeto.success) return projeto;

  return projectRepo.deleteProjeto(id);
}

export async function recalcularProgresso(projetoId: string): Promise<Result<void>> {
  // Verificar se há override manual
  const projeto = await projectRepo.findProjetoById(projetoId);
  if (!projeto.success) return projeto;

  if (projeto.data.progressoManual !== null) {
    // Override manual está ativo, não recalcular
    return ok(undefined);
  }

  // Contar tarefas
  const counts = await taskRepo.countTarefasByProject(projetoId);
  if (!counts.success) return counts;

  const { total, concluidas } = counts.data;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return projectRepo.updateProjetoProgresso(projetoId, progresso);
}
