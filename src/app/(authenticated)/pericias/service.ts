/**
 * PERÍCIAS SERVICE - Camada de Negócio
 */

import "server-only";

import type { Result, PaginatedResponse } from "@/types";
import { err, appError } from "@/types";
import {
  adicionarObservacaoSchema,
  atribuirResponsavelSchema,
  criarPericiaSchema,
  type Pericia,
  type ListarPericiasParams,
  SituacaoPericiaCodigo,
} from "./domain";
import * as repository from "./repository";

export async function listarPericias(
  params: ListarPericiasParams
): Promise<Result<PaginatedResponse<Pericia>>> {
  const saneParams: ListarPericiasParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite:
      params.limite && params.limite > 0 && params.limite <= 1000
        ? params.limite
        : 50,
    ordenarPor: params.ordenarPor ?? "prazo_entrega",
    ordem: params.ordem ?? "asc",
  };

  return repository.findAllPericias(saneParams);
}

export async function obterPericia(id: number): Promise<Result<Pericia | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da perícia inválido."));
  }
  return repository.findPericiaById(id);
}

export async function atribuirResponsavel(
  params: unknown
): Promise<Result<boolean>> {
  const validacao = atribuirResponsavelSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  return repository.atribuirResponsavelPericia(
    validacao.data.periciaId,
    validacao.data.responsavelId
  );
}

export async function adicionarObservacao(
  params: unknown
): Promise<Result<boolean>> {
  const validacao = adicionarObservacaoSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  return repository.adicionarObservacaoPericia(
    validacao.data.periciaId,
    validacao.data.observacoes
  );
}

export async function listarEspecialidadesPericia(): Promise<
  Result<{ id: number; descricao: string }[]>
> {
  return repository.listEspecialidadesPericia();
}

export async function listarTodasEspecialidadesPericia(): Promise<
  Result<repository.EspecialidadePericiaRow[]>
> {
  return repository.listAllEspecialidadesPericia();
}

export async function alterarAtivoEspecialidade(
  id: number,
  ativo: boolean
): Promise<Result<boolean>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da especialidade inválido."));
  }
  return repository.setEspecialidadePericiaAtivo(id, ativo);
}

export async function criarPericia(
  params: unknown,
  advogadoId: number
): Promise<Result<Pericia>> {
  const validacao = criarPericiaSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  if (!advogadoId || advogadoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do advogado inválido."));
  }

  return repository.criarPericia(validacao.data, advogadoId);
}

export async function atualizarSituacao(
  periciaId: number,
  situacaoCodigo: SituacaoPericiaCodigo
): Promise<Result<boolean>> {
  if (!periciaId || periciaId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da perícia inválido."));
  }
  // TODO: Adicionar validação de transição de status se necessário
  return repository.atualizarSituacaoPericia(periciaId, situacaoCodigo);
}

// =============================================================================
// PULSE STATS (KPI Strip — dados agregados reais)
// =============================================================================

export interface PericiasPulseStats {
  ativas: number;
  aguardandoLaudo: number;
  laudoJuntado: number;
  finalizadas: number;
  prazosCriticos7d: number;
  semResponsavel: number;
  porSituacao: Record<string, number>;
  trendMensal: number[];
}

export async function calcularPulseStats(): Promise<Result<PericiasPulseStats>> {
  const [porSituacao, prazosCriticos, semResponsavel, trend] = await Promise.all([
    repository.countPericiasPorSituacao(),
    repository.countPericiasComPrazoCritico(7),
    repository.countPericiasSemResponsavel(),
    repository.countPericiasTrendMensal(6),
  ]);

  if (!porSituacao.success) {
    return err(porSituacao.error);
  }

  const counts = porSituacao.data;
  const aguardandoLaudo = counts[SituacaoPericiaCodigo.AGUARDANDO_LAUDO] ?? 0;
  const laudoJuntado = counts[SituacaoPericiaCodigo.LAUDO_JUNTADO] ?? 0;
  const finalizadas = counts[SituacaoPericiaCodigo.FINALIZADA] ?? 0;
  const canceladas = counts[SituacaoPericiaCodigo.CANCELADA] ?? 0;
  const totalCounts = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const ativas = totalCounts - finalizadas - canceladas;

  return {
    success: true as const,
    data: {
      ativas,
      aguardandoLaudo,
      laudoJuntado,
      finalizadas,
      prazosCriticos7d: prazosCriticos.success ? prazosCriticos.data : 0,
      semResponsavel: semResponsavel.success ? semResponsavel.data : 0,
      porSituacao: counts,
      trendMensal: trend.success ? trend.data.map((t) => t.count) : [],
    },
  };
}


