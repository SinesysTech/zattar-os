import { z } from "zod";
import { Result, err, appError, PaginatedResponse } from "@/lib/types";
import {
  Audiencia,
  createAudienciaSchema,
  updateAudienciaSchema,
  ListarAudienciasParams,
  StatusAudiencia,
} from "./domain";
import * as repo from "./repository";

export async function criarAudiencia(
  input: z.infer<typeof createAudienciaSchema>
): Promise<Result<Audiencia>> {
  const validation = createAudienciaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  try {
    const { processoId, tipoAudienciaId } = validation.data;

    const processoExistsResult = await repo.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError("VALIDATION_ERROR", "Processo não encontrado."));
    }

    if (tipoAudienciaId) {
      const tipoExistsResult = await repo.tipoAudienciaExists(tipoAudienciaId);
      if (!tipoExistsResult.success || !tipoExistsResult.data) {
        return err(
          appError("VALIDATION_ERROR", "Tipo de audiência não encontrado.")
        );
      }
    }

    const result = await repo.saveAudiencia(validation.data);
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    return err(
      appError("INTERNAL_ERROR", "Erro ao criar audiência.", {
        originalError: message,
      })
    );
  }
}

export async function buscarAudiencia(
  id: number
): Promise<Result<Audiencia | null>> {
  if (id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID inválido."));
  }
  return repo.findAudienciaById(id);
}

export async function listarAudiencias(
  params: ListarAudienciasParams
): Promise<Result<PaginatedResponse<Audiencia>>> {
  const sanitizedParams: ListarAudienciasParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite:
      params.limite && params.limite > 0 && params.limite <= 100
        ? params.limite
        : 10,
    ordenarPor: params.ordenarPor || "dataInicio",
    ordem: params.ordem || "asc",
  };
  return repo.findAllAudiencias(sanitizedParams);
}

export async function atualizarAudiencia(
  id: number,
  input: z.infer<typeof updateAudienciaSchema>
): Promise<Result<Audiencia>> {
  const validation = updateAudienciaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  try {
    const audienciaExistenteResult = await repo.findAudienciaById(id);
    if (!audienciaExistenteResult.success || !audienciaExistenteResult.data) {
      return err(appError("NOT_FOUND", "Audiência não encontrada."));
    }

    const { processoId, tipoAudienciaId } = validation.data;

    if (processoId) {
      const processoExistsResult = await repo.processoExists(processoId);
      if (!processoExistsResult.success || !processoExistsResult.data) {
        return err(appError("VALIDATION_ERROR", "Processo não encontrado."));
      }
    }

    if (tipoAudienciaId) {
      const tipoExistsResult = await repo.tipoAudienciaExists(tipoAudienciaId);
      if (!tipoExistsResult.success || !tipoExistsResult.data) {
        return err(
          appError("VALIDATION_ERROR", "Tipo de audiência não encontrado.")
        );
      }
    }

    const result = await repo.updateAudiencia(
      id,
      validation.data,
      audienciaExistenteResult.data
    );
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    return err(
      appError("INTERNAL_ERROR", "Erro ao atualizar audiência.", {
        originalError: message,
      })
    );
  }
}

export async function atualizarStatusAudiencia(
  id: number,
  status: StatusAudiencia,
  statusDescricao?: string
): Promise<Result<Audiencia>> {
  if (!Object.values(StatusAudiencia).includes(status)) {
    return err(appError("VALIDATION_ERROR", "Status inválido."));
  }

  const audienciaExistenteResult = await repo.findAudienciaById(id);
  if (!audienciaExistenteResult.success || !audienciaExistenteResult.data) {
    return err(appError("NOT_FOUND", "Audiência não encontrada."));
  }

  // TODO: Log the user who made the change if a logging system exists
  // logService.log(`User ${userId} changed status of audiencia ${id} to ${status}`);

  return repo.atualizarStatus(id, status, statusDescricao);
}

/**
 * Helper para Portal do Cliente: Lista audiências associadas ao CPF retornando array tipado.
 */
export async function listarAudienciasPorBuscaCpf(
  cpf: string
): Promise<Audiencia[]> {
  const result = await repo.findAudienciasByClienteCpf(cpf);
  if (!result.success) return [];
  return result.data;
}
