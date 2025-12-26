import {
  CriarAcordoComParcelasParams,
  ListarAcordosParams,
  AtualizarAcordoParams,
  MarcarParcelaRecebidaParams,
  AtualizarParcelaParams,
  FiltrosRepasses,
  RegistrarRepasseParams,
  Parcela,
  AcordoCondenacao,
  AcordoComParcelas,
} from "./types";
import { TipoObrigacao, StatusAcordo } from "./domain";
import { ObrigacoesRepository } from "./repository";

import { calcularDataVencimento } from "./utils";

// --- Services ---

export async function criarAcordoComParcelas(
  params: CriarAcordoComParcelasParams
) {
  // 1. Validation logic is mostly handled by Zod in Actions, but we can double check logic here if needed.
  // Assuming params are valid.

  // 2. Create Agreement
  const acordo = await ObrigacoesRepository.criarAcordo({
    processoId: params.processoId,
    tipo: params.tipo,
    direcao: params.direcao,
    valorTotal: params.valorTotal,
    dataVencimentoPrimeiraParcela: params.dataVencimentoPrimeiraParcela,
    numeroParcelas: params.numeroParcelas,
    formaDistribuicao: params.formaDistribuicao,
    percentualEscritorio: params.percentualEscritorio,
    honorariosSucumbenciaisTotal: params.honorariosSucumbenciaisTotal,
    createdBy: params.createdBy,
  });

  // 3. Calculate Parcels
  const parcelasData = calcularParcelasDoAcordo(acordo, params);

  // 4. Create Parcels
  const parcelas = await ObrigacoesRepository.criarParcelas(parcelasData);

  // Retornar com id na raiz para facilitar navegação
  return {
    id: acordo.id,
    acordo,
    parcelas,
  };
}

export async function listarAcordos(params: ListarAcordosParams) {
  return await ObrigacoesRepository.listarAcordos(params);
}

export async function buscarAcordo(id: number) {
  const acordo = await ObrigacoesRepository.buscarAcordoPorId(id);
  if (!acordo) throw new Error("Acordo não encontrado");
  return acordo;
}

export async function atualizarAcordo(
  id: number,
  dados: AtualizarAcordoParams
) {
  // If changing critical numbers (value or parcels), might need to recalculate parcels.
  // For now, implementing simple update.
  // Advanced logic: if changing values, check if parcels are already paid. If not, maybe allow recalc?
  // Current scope: simple update.
  return await ObrigacoesRepository.atualizarAcordo(id, dados);
}

export async function deletarAcordo(id: number) {
  return await ObrigacoesRepository.deletarAcordo(id);
}

export async function marcarParcelaRecebida(
  parcelaId: number,
  dados: MarcarParcelaRecebidaParams
) {
  const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
  if (!parcela) throw new Error("Parcela não encontrada");

  // Logic: update status and date
  // In future: Create 'Lancamento Financeiro' here.

  return await ObrigacoesRepository.marcarParcelaComoRecebida(parcelaId, {
    dataEfetivacao: dados.dataRecebimento,
    valor: dados.valorRecebido,
  });
}

export async function atualizarParcela(
  parcelaId: number,
  valores: AtualizarParcelaParams
) {
  return await ObrigacoesRepository.atualizarParcela(parcelaId, valores);
}

export async function recalcularDistribuicao(acordoId: number) {
  const acordo = await ObrigacoesRepository.buscarAcordoPorId(acordoId);
  if (!acordo) throw new Error("Acordo não encontrado");

  // Get current parcels
  // This logic reconstructs parcels based on CURRENT agreement values
  // Only for unpaid parcels

  const parcelas = await ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);
  const parcelasPagas = parcelas.filter((p) =>
    ["recebida", "paga"].includes(p.status)
  );

  if (parcelasPagas.length > 0) {
    throw new Error(
      "Não é possível recalcular distribuição com parcelas pagas."
    );
  }

  // Delete existing parcels
  await ObrigacoesRepository.deletarParcelasDoAcordo(acordoId);

  // Re-calculate
  const params: CriarAcordoComParcelasParams = {
    processoId: acordo.processoId,
    tipo: acordo.tipo,
    direcao: acordo.direcao,
    valorTotal: acordo.valorTotal,
    dataVencimentoPrimeiraParcela: acordo.dataVencimentoPrimeiraParcela,
    numeroParcelas: acordo.numeroParcelas,
    formaDistribuicao: acordo.formaDistribuicao,
    percentualEscritorio: acordo.percentualEscritorio,
    honorariosSucumbenciaisTotal: acordo.honorariosSucumbenciaisTotal,
    formaPagamentoPadrao: "transferencia_direta", // Default or fetch from somewhere? Assuming default for recalc
    intervaloEntreParcelas: 30, // Default
    createdBy: acordo.createdBy || undefined,
  };
  // Note: We might be missing original parameters like 'formaPagamentoPadrao' if not stored in Acordo.
  // Ideally, we should check the first old parcel to guess the payment method.
  if (parcelas.length > 0) {
    params.formaPagamentoPadrao =
      parcelas[0].formaPagamento || "transferencia_direta";
  }

  const novasParcelasData = calcularParcelasDoAcordo(acordo, params);
  const novasParcelas = await ObrigacoesRepository.criarParcelas(
    novasParcelasData
  );

  return novasParcelas;
}

// --- Repasses Services ---

export async function listarRepassesPendentes(filtros?: FiltrosRepasses) {
  return await ObrigacoesRepository.listarRepassesPendentes(filtros);
}

export async function anexarDeclaracaoPrestacaoContas(
  parcelaId: number,
  url: string
) {
  return await ObrigacoesRepository.anexarDeclaracaoPrestacaoContas(
    parcelaId,
    url
  );
}

export async function registrarRepasse(
  parcelaId: number,
  dados: RegistrarRepasseParams
) {
  // Validate if decoration is attached
  const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
  if (!parcela) throw new Error("Parcela não encontrada");
  if (!parcela.declaracaoPrestacaoContasUrl) {
    throw new Error("Declaração de prestação de contas obrigatória");
  }

  return await ObrigacoesRepository.registrarRepasse(parcelaId, dados);
}

// --- Helpers ---

function calcularParcelasDoAcordo(
  acordo: AcordoCondenacao,
  params: CriarAcordoComParcelasParams
): Partial<Parcela>[] {
  const parcelas: Partial<Parcela>[] = [];
  const numeroParcelas = acordo.numeroParcelas;
  const intervalo = params.intervaloEntreParcelas || 30;

  const valorPorParcelaBase = acordo.valorTotal / numeroParcelas;
  const honorariosPorParcelaBase =
    acordo.honorariosSucumbenciaisTotal / numeroParcelas;

  for (let i = 0; i < numeroParcelas; i++) {
    const isLast = i === numeroParcelas - 1;

    // Values
    const valorParcela = isLast
      ? acordo.valorTotal -
        parseFloat(valorPorParcelaBase.toFixed(2)) * (numeroParcelas - 1)
      : parseFloat(valorPorParcelaBase.toFixed(2));

    const honorariosParcela = isLast
      ? acordo.honorariosSucumbenciaisTotal -
        parseFloat(honorariosPorParcelaBase.toFixed(2)) * (numeroParcelas - 1)
      : parseFloat(honorariosPorParcelaBase.toFixed(2));

    // Date
    const dataVencimento = calcularDataVencimento(
      acordo.dataVencimentoPrimeiraParcela,
      i + 1,
      intervalo
    );

    parcelas.push({
      acordoCondenacaoId: acordo.id,
      numeroParcela: i + 1,
      valorBrutoCreditoPrincipal: parseFloat(valorParcela.toFixed(2)),
      honorariosSucumbenciais: parseFloat(honorariosParcela.toFixed(2)),
      dataVencimento,
      formaPagamento: params.formaPagamentoPadrao,
      editadoManualmente: false,
    });
  }
  return parcelas;
}

/**
 * Helper para Portal do Cliente: Lista acordos filtrados por busca (CPF) retornando array tipado.
 */
export async function listarAcordosPorBuscaCpf(
  cpf: string
): Promise<AcordoComParcelas[]> {
  const result = await listarAcordos({ busca: cpf, limite: 100 });
  return result.acordos || [];
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca acordos e condenações vinculados a um cliente por CPF
 */
export async function buscarAcordosPorClienteCPF(
  cpf: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
): Promise<import("@/lib/types").Result<AcordoComParcelas[]>> {
  const { normalizarDocumento } = await import("@/features/partes/domain");
  const { findClienteByCPF } = await import("@/features/partes/repositories");
  const { err, appError } = await import("@/lib/types");

  if (!cpf || !cpf.trim()) {
    return err(appError("VALIDATION_ERROR", "CPF e obrigatorio"));
  }

  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return err(appError("VALIDATION_ERROR", "CPF deve conter 11 digitos"));
  }

  try {
    // Busca cliente por CPF
    const clienteResult = await findClienteByCPF(cpfNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    // const clienteId = clienteResult.data.id;

    // Busca processos do cliente
    const { buscarProcessosPorClienteCPF } = await import(
      "@/features/processos/service"
    );
    const processosResult = await buscarProcessosPorClienteCPF(cpf, 100);
    if (!processosResult.success) return err(processosResult.error);

    if (processosResult.data.length === 0) {
      return { success: true, data: [] };
    }

    const processoIds = processosResult.data.map((p) => p.id);

    // Busca acordos para cada processo e agrega resultados
    const allAcordos: AcordoComParcelas[] = [];
    for (const processoId of processoIds) {
      const result = await listarAcordos({
        processoId,
        tipo,
        status,
        limite: 200,
      });
      if (result.acordos) {
        allAcordos.push(...result.acordos);
      }
    }

    return { success: true, data: allAcordos };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}

/**
 * Busca acordos e condenações vinculados a um cliente por CNPJ
 */
export async function buscarAcordosPorClienteCNPJ(
  cnpj: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
): Promise<import("@/lib/types").Result<AcordoComParcelas[]>> {
  const { normalizarDocumento } = await import("@/features/partes/domain");
  const { findClienteByCNPJ } = await import("@/features/partes/repositories");
  const { err, appError } = await import("@/lib/types");

  if (!cnpj || !cnpj.trim()) {
    return err(appError("VALIDATION_ERROR", "CNPJ e obrigatorio"));
  }

  const cnpjNormalizado = normalizarDocumento(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return err(appError("VALIDATION_ERROR", "CNPJ deve conter 14 digitos"));
  }

  try {
    // Busca cliente por CNPJ
    const clienteResult = await findClienteByCNPJ(cnpjNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    const clienteId = clienteResult.data.id;

    // Busca processos do cliente
    const { buscarProcessosPorClienteCNPJ } = await import(
      "@/features/processos/service"
    );
    const processosResult = await buscarProcessosPorClienteCNPJ(cnpj, 100);
    if (!processosResult.success) return err(processosResult.error);

    if (processosResult.data.length === 0) {
      return { success: true, data: [] };
    }

    const processoIds = processosResult.data.map((p) => p.id);

    // Busca acordos para cada processo e agrega resultados
    const allAcordos: AcordoComParcelas[] = [];
    for (const processoId of processoIds) {
      const result = await listarAcordos({
        processoId,
        tipo,
        status,
        limite: 200,
      });
      if (result.acordos) {
        allAcordos.push(...result.acordos);
      }
    }

    return { success: true, data: allAcordos };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca acordos e condenações de um processo específico pelo número processual
 */
export async function buscarAcordosPorNumeroProcesso(
  numeroProcesso: string,
  tipo?: TipoObrigacao
): Promise<import("@/lib/types").Result<AcordoComParcelas[]>> {
  const { err, appError } = await import("@/lib/types");
  const { normalizarNumeroProcesso } = await import(
    "@/features/processos/utils"
  );

  if (!numeroProcesso || !numeroProcesso.trim()) {
    return err(
      appError("VALIDATION_ERROR", "Numero do processo e obrigatorio")
    );
  }

  try {
    // Normalizar número de processo antes de buscar
    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso.trim());

    // Busca processo por número normalizado
    const { actionBuscarProcessoPorNumero } = await import(
      "@/features/processos/actions"
    );
    const processoResult = await actionBuscarProcessoPorNumero(
      numeroNormalizado
    );

    if (!processoResult.success || !processoResult.data) {
      return err(appError("NOT_FOUND", "Processo nao encontrado"));
    }

    const processoId = (processoResult.data as { id: number }).id;

    // Busca acordos do processo
    const result = await listarAcordos({
      processoId,
      tipo,
      limite: 100,
    });

    return { success: true, data: result.acordos || [] };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}
