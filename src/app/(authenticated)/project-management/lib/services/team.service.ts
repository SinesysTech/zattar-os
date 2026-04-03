import { err, appError, type Result } from "@/types/result";
import {
  type MembroProjeto,
  type AddMembroInput,
  type PapelProjeto,
  addMembroSchema,
} from "../domain";
import * as teamRepo from "../repositories/team.repository";

export async function listarMembros(projetoId: string): Promise<Result<MembroProjeto[]>> {
  return teamRepo.listMembrosByProject(projetoId);
}

export async function adicionarMembro(input: AddMembroInput): Promise<Result<MembroProjeto>> {
  const validation = addMembroSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos")
    );
  }

  return teamRepo.addMembro(validation.data);
}

export async function removerMembro(
  membroId: string,
  projetoId: string
): Promise<Result<void>> {
  // Buscar o membro para verificar o papel
  const membro = await teamRepo.findMembroById(membroId);
  if (!membro.success) return membro;

  // Se for gerente, verificar se é o último
  if (membro.data.papel === "gerente") {
    const countResult = await teamRepo.countGerentesByProject(projetoId);
    if (countResult.success && countResult.data <= 1) {
      return err(
        appError(
          "VALIDATION_ERROR",
          "Não é possível remover o único gerente do projeto. Atribua outro gerente antes."
        )
      );
    }
  }

  return teamRepo.removeMembro(membroId);
}

export async function alterarPapel(
  membroId: string,
  papel: PapelProjeto
): Promise<Result<MembroProjeto>> {
  return teamRepo.updateMembroRole(membroId, papel);
}
