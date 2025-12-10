/**
 * PROCESSOS SERVICE - Camada de Regras de Negocio (Casos de Uso)
 *
 * Este arquivo contem a logica de negocio para Processos.
 *
 * CONVENCOES:
 * - Funcoes nomeadas como acoes: criar, atualizar, listar, buscar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositorio)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import {
  type Processo,
  type ProcessoUnificado,
  type Movimentacao,
  type CreateProcessoInput,
  type UpdateProcessoInput,
  type ListarProcessosParams,
  createProcessoSchema,
  updateProcessoSchema,
  validarNumeroCNJ,
} from './domain';
import {
  findProcessoById,
  findAllProcessos,
  findTimelineByProcessoId,
  saveProcesso,
  updateProcesso as updateProcessoRepo,
  advogadoExists,
  usuarioExists,
} from './repository';

// =============================================================================
// SERVICOS - PROCESSO
// =============================================================================

/**
 * Cria um novo processo
 *
 * Regras de negocio:
 * - Campos obrigatorios: idPje, advogadoId, origem, trt, grau, numeroProcesso, etc.
 * - Advogado deve existir no sistema
 * - Numero do processo deve seguir padrao CNJ
 * - Verifica unicidade (constraint do banco)
 */
export async function criarProcesso(input: CreateProcessoInput): Promise<Result<Processo>> {
  // 1. Validar input com Zod
  const validation = createProcessoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Validar numero CNJ (validacao adicional)
  if (!validarNumeroCNJ(dadosValidados.numeroProcesso)) {
    return err(
      appError('VALIDATION_ERROR', 'Numero do processo nao segue o padrao CNJ', {
        field: 'numeroProcesso',
        valor: dadosValidados.numeroProcesso,
      })
    );
  }

  // 3. Verificar se advogado existe
  const advogadoExistsResult = await advogadoExists(dadosValidados.advogadoId);
  if (!advogadoExistsResult.success) {
    return err(advogadoExistsResult.error);
  }
  if (!advogadoExistsResult.data) {
    return err(
      appError('NOT_FOUND', 'Advogado nao encontrado', {
        field: 'advogadoId',
        advogadoId: dadosValidados.advogadoId,
      })
    );
  }

  // 4. Verificar se responsavel existe (se fornecido)
  if (dadosValidados.responsavelId) {
    const usuarioExistsResult = await usuarioExists(dadosValidados.responsavelId);
    if (!usuarioExistsResult.success) {
      return err(usuarioExistsResult.error);
    }
    if (!usuarioExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Responsavel nao encontrado', {
          field: 'responsavelId',
          responsavelId: dadosValidados.responsavelId,
        })
      );
    }
  }

  // 5. Persistir via repositorio
  return saveProcesso(dadosValidados);
}

/**
 * Busca um processo pelo ID
 *
 * Retorna null se nao encontrar (nao e erro)
 */
export async function buscarProcesso(id: number): Promise<Result<Processo | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findProcessoById(id);
}

/**
 * Lista processos com filtros e paginacao
 *
 * Suporta 19 filtros:
 * - Paginacao: pagina, limite
 * - Busca geral: busca
 * - Ordenacao: ordenarPor, ordem
 * - Identificacao: origem, trt, grau, numeroProcesso, classeJudicial, codigoStatusProcesso
 * - Partes: nomeParteAutora, nomeParteRe, descricaoOrgaoJulgador
 * - Booleanos: segredoJustica, juizoDigital, temAssociacao, temProximaAudiencia, semResponsavel
 * - Datas: dataAutuacaoInicio/Fim, dataArquivamentoInicio/Fim, dataProximaAudienciaInicio/Fim
 * - Relacionamentos: advogadoId, responsavelId, clienteId
 */
export async function listarProcessos(
  params: ListarProcessosParams = {}
): Promise<Result<PaginatedResponse<Processo | ProcessoUnificado>>> {
  // Sanitizar parametros de paginacao
  const sanitizedParams: ListarProcessosParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  return findAllProcessos(sanitizedParams);
}

/**
 * Atualiza um processo existente
 *
 * Regras de negocio:
 * - Processo precisa existir
 * - Se alterar advogadoId, novo advogado deve existir
 * - Se alterar responsavelId, novo responsavel deve existir
 * - Se alterar numeroProcesso, validar formato CNJ
 * - Preserva estado anterior para auditoria
 */
export async function atualizarProcesso(
  id: number,
  input: UpdateProcessoInput
): Promise<Result<Processo>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Validar input com Zod
  const validation = updateProcessoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  // 3. Verificar se ha algo para atualizar
  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 4. Verificar se processo existe
  const existingResult = await findProcessoById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Processo com ID ${id} nao encontrado`));
  }

  const processoExistente = existingResult.data;

  // 5. Se alterando numeroProcesso, validar formato CNJ
  if (dadosValidados.numeroProcesso && dadosValidados.numeroProcesso !== processoExistente.numeroProcesso) {
    if (!validarNumeroCNJ(dadosValidados.numeroProcesso)) {
      return err(
        appError('VALIDATION_ERROR', 'Numero do processo nao segue o padrao CNJ', {
          field: 'numeroProcesso',
          valor: dadosValidados.numeroProcesso,
        })
      );
    }
  }

  // 6. Se alterando advogadoId, verificar se novo advogado existe
  if (dadosValidados.advogadoId && dadosValidados.advogadoId !== processoExistente.advogadoId) {
    const advogadoExistsResult = await advogadoExists(dadosValidados.advogadoId);
    if (!advogadoExistsResult.success) {
      return err(advogadoExistsResult.error);
    }
    if (!advogadoExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Novo advogado nao encontrado', {
          field: 'advogadoId',
          advogadoId: dadosValidados.advogadoId,
        })
      );
    }
  }

  // 7. Se alterando responsavelId, verificar se novo responsavel existe
  if (
    dadosValidados.responsavelId !== undefined &&
    dadosValidados.responsavelId !== null &&
    dadosValidados.responsavelId !== processoExistente.responsavelId
  ) {
    const usuarioExistsResult = await usuarioExists(dadosValidados.responsavelId);
    if (!usuarioExistsResult.success) {
      return err(usuarioExistsResult.error);
    }
    if (!usuarioExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Novo responsavel nao encontrado', {
          field: 'responsavelId',
          responsavelId: dadosValidados.responsavelId,
        })
      );
    }
  }

  // 8. Atualizar via repositorio
  return updateProcessoRepo(id, dadosValidados, processoExistente);
}

/**
 * Busca timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Sera implementado na Fase 4 (Integracao PJE)
 */
export async function buscarTimeline(processoId: number): Promise<Result<Movimentacao[]>> {
  if (!processoId || processoId <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findTimelineByProcessoId(processoId);
}
