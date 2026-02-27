import { err, appError, type Result, type PaginatedResponse } from "@/types/result";
import {
  type Tarefa,
  type CreateTarefaInput,
  type UpdateTarefaInput,
  type UpdateKanbanOrderInput,
  type ListarTarefasParams,
  createTarefaSchema,
  updateTarefaSchema,
} from "../domain";
import * as taskRepo from "../repositories/task.repository";
import * as teamRepo from "../repositories/team.repository";
import { recalcularProgresso } from "./project.service";

export async function listarTarefasPorProjeto(
  projetoId: string,
  status?: string
): Promise<Result<Tarefa[]>> {
  return taskRepo.listTarefasByProject(projetoId, status);
}

export async function listarTarefasGlobal(
  params: ListarTarefasParams
): Promise<Result<PaginatedResponse<Tarefa>>> {
  return taskRepo.listTarefasGlobal(params);
}

export async function buscarTarefa(id: string): Promise<Result<Tarefa>> {
  return taskRepo.findTarefaById(id);
}

export async function criarTarefa(
  input: CreateTarefaInput,
  criadoPor: number
): Promise<Result<Tarefa>> {
  const validation = createTarefaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  // Se atribuiu responsável, verificar se é membro do projeto
  if (validation.data.responsavelId) {
    const isMember = await teamRepo.isUserMemberOfProject(
      validation.data.projetoId,
      validation.data.responsavelId
    );
    if (isMember.success && !isMember.data) {
      return err(
        appError("VALIDATION_ERROR", "O responsável deve ser membro do projeto")
      );
    }
  }

  const result = await taskRepo.saveTarefa(validation.data, criadoPor);

  // Recalcular progresso do projeto
  if (result.success) {
    await recalcularProgresso(validation.data.projetoId);
  }

  return result;
}

export async function atualizarTarefa(
  id: string,
  input: UpdateTarefaInput,
  projetoId?: string
): Promise<Result<Tarefa>> {
  const validation = updateTarefaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  const result = await taskRepo.updateTarefa(id, validation.data);

  // Recalcular progresso se o status mudou
  if (result.success && validation.data.status && projetoId) {
    await recalcularProgresso(projetoId);
  }

  return result;
}

export async function excluirTarefa(id: string): Promise<Result<void>> {
  // Buscar a tarefa para saber o projeto
  const tarefa = await taskRepo.findTarefaById(id);
  if (!tarefa.success) return tarefa;

  const result = await taskRepo.deleteTarefa(id);

  // Recalcular progresso do projeto
  if (result.success) {
    await recalcularProgresso(tarefa.data.projetoId);
  }

  return result;
}

export async function reordenarKanban(
  items: UpdateKanbanOrderInput[]
): Promise<Result<void>> {
  return taskRepo.updateKanbanOrder(items);
}
