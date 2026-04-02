/**
 * CONTRATOS FEATURE - Camada de Regras de Negócio (Casos de Uso)
 *
 * Este arquivo contém a lógica de negócio para Contratos.
 *
 * CONVENÇÕES:
 * - Funções nomeadas como ações: criar, atualizar, listar, buscar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 */

import { Result, err, PaginatedResponse } from "@/types";
import {
  type Contrato,
  type CreateContratoInput,
  type UpdateContratoInput,
  type ListarContratosParams,
  type StatusContrato,
  createContratoSchema,
  updateContratoSchema,
} from "./domain";
import {
  findContratoById,
  findAllContratos,
  saveContrato,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
  countContratosPorStatus,
  countContratos,
  countContratosAteData,
  countContratosEntreDatas,
  deleteContrato,
} from "./repository";
import {
  contratoNotFoundError,
  clienteNotFoundError,
  parteContrariaNotFoundError,
  contratoValidationError,
  contratoIdInvalidError,
  contratoNoFieldsToUpdateError,
} from "./errors";

// =============================================================================
// SERVIÇOS - CONTRATO
// =============================================================================

/**
 * Cria um novo contrato jurídico
 *
 * @param input - Dados do contrato a ser criado
 * @returns Result contendo o contrato criado ou erro
 *
 * @remarks
 * Regras de negócio:
 * - Campos obrigatórios: tipoContrato, tipoCobranca, clienteId, poloCliente
 * - Cliente deve existir no sistema
 * - Se parteContrariaId fornecido, deve existir no sistema
 * - Status padrão: 'em_contratacao'
 * - Data de contratação padrão: data atual
 *
 * @example
 * ```typescript
 * const result = await criarContrato({
 *   tipoContrato: 'ajuizamento',
 *   tipoCobranca: 'pro_exito',
 *   clienteId: 123,
 *   poloCliente: 'autor',
 * });
 *
 * if (result.success) {
 *   console.log('Contrato criado:', result.data.id);
 * } else {
 *   console.error('Erro:', result.error.message);
 * }
 * ```
 */
export async function criarContrato(
  input: CreateContratoInput,
): Promise<Result<Contrato>> {
  // 1. Validar input com Zod
  const validation = createContratoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      contratoValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      }),
    );
  }

  const dadosValidados = validation.data;

  // 2. Verificar se cliente existe
  const clienteExistsResult = await clienteExists(dadosValidados.clienteId);
  if (!clienteExistsResult.success) {
    return err(clienteExistsResult.error);
  }
  if (!clienteExistsResult.data) {
    return err(clienteNotFoundError(dadosValidados.clienteId));
  }

  // 3. Validar entidades referenciadas nas partes (modelo relacional)
  for (const parte of dadosValidados.partes ?? []) {
    if (parte.tipoEntidade === "cliente") {
      const existsResult = await clienteExists(parte.entidadeId);
      if (!existsResult.success) return err(existsResult.error);
      if (!existsResult.data)
        return err(clienteNotFoundError(parte.entidadeId));
    }

    if (parte.tipoEntidade === "parte_contraria") {
      const existsResult = await parteContrariaExists(parte.entidadeId);
      if (!existsResult.success) return err(existsResult.error);
      if (!existsResult.data)
        return err(parteContrariaNotFoundError(parte.entidadeId));
    }
  }

  // 4. Persistir via repositório
  // Nota: Indexação semântica é feita na camada de Server Actions
  return saveContrato(dadosValidados);
}

/**
 * Busca um contrato pelo ID
 *
 * @param id - ID do contrato a buscar
 * @returns Result contendo o contrato ou null se não encontrado
 *
 * @remarks
 * Retorna null se não encontrar (não é erro).
 * Útil para verificações de existência.
 *
 * @example
 * ```typescript
 * const result = await buscarContrato(123);
 *
 * if (result.success) {
 *   if (result.data) {
 *     console.log('Contrato encontrado:', result.data);
 *   } else {
 *     console.log('Contrato não encontrado');
 *   }
 * }
 * ```
 */
export async function buscarContrato(
  id: number,
): Promise<Result<Contrato | null>> {
  if (!id || id <= 0) {
    return err(contratoIdInvalidError(id));
  }

  return findContratoById(id);
}

/**
 * Lista contratos com filtros e paginação
 *
 * @param params - Parâmetros de listagem (paginação, filtros, ordenação)
 * @returns Result contendo lista paginada de contratos
 *
 * @remarks
 * Parâmetros de paginação são sanitizados automaticamente:
 * - pagina: mínimo 1
 * - limite: entre 1 e 100 (default: 50)
 *
 * @example
 * ```typescript
 * const result = await listarContratos({
 *   pagina: 1,
 *   limite: 10,
 *   status: 'contratado',
 *   tipoContrato: 'ajuizamento',
 *   ordenarPor: 'data_contratacao',
 *   ordem: 'desc',
 * });
 *
 * if (result.success) {
 *   console.log(`${result.data.pagination.total} contratos encontrados`);
 *   result.data.data.forEach(c => console.log(c.id));
 * }
 * ```
 */
export async function listarContratos(
  params: ListarContratosParams = {},
): Promise<Result<PaginatedResponse<Contrato>>> {
  // Sanitizar parâmetros de paginação
  const sanitizedParams: ListarContratosParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  return findAllContratos(sanitizedParams);
}

/**
 * Atualiza um contrato existente
 *
 * @param id - ID do contrato a atualizar
 * @param input - Dados a serem atualizados (partial update)
 * @returns Result contendo o contrato atualizado ou erro
 *
 * @remarks
 * Regras de negócio:
 * - Contrato precisa existir
 * - Se alterar clienteId, novo cliente deve existir
 * - Se alterar parteContrariaId, nova parte contrária deve existir
 * - Estado anterior é preservado em dadosAnteriores para auditoria
 *
 * @example
 * ```typescript
 * const result = await atualizarContrato(123, {
 *   status: 'contratado',
 *   dataAssinatura: '2024-01-15',
 * });
 *
 * if (result.success) {
 *   console.log('Contrato atualizado:', result.data);
 * } else {
 *   console.error('Erro:', result.error.message);
 * }
 * ```
 */
export async function atualizarContrato(
  id: number,
  input: UpdateContratoInput,
): Promise<Result<Contrato>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(contratoIdInvalidError(id));
  }

  // 2. Validar input com Zod
  const validation = updateContratoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      contratoValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      }),
    );
  }

  // 3. Verificar se há algo para atualizar
  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(contratoNoFieldsToUpdateError());
  }

  // 4. Verificar se contrato existe
  const existingResult = await findContratoById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(contratoNotFoundError(id));
  }

  const contratoExistente = existingResult.data;

  // 5. Se alterando clienteId, verificar se novo cliente existe
  if (
    dadosValidados.clienteId &&
    dadosValidados.clienteId !== contratoExistente.clienteId
  ) {
    const clienteExistsResult = await clienteExists(dadosValidados.clienteId);
    if (!clienteExistsResult.success) {
      return err(clienteExistsResult.error);
    }
    if (!clienteExistsResult.data) {
      return err(clienteNotFoundError(dadosValidados.clienteId));
    }
  }

  // 6. Validar entidades referenciadas nas partes (se enviadas)
  if (dadosValidados.partes !== undefined) {
    for (const parte of dadosValidados.partes ?? []) {
      if (parte.tipoEntidade === "cliente") {
        const existsResult = await clienteExists(parte.entidadeId);
        if (!existsResult.success) return err(existsResult.error);
        if (!existsResult.data)
          return err(clienteNotFoundError(parte.entidadeId));
      }

      if (parte.tipoEntidade === "parte_contraria") {
        const existsResult = await parteContrariaExists(parte.entidadeId);
        if (!existsResult.success) return err(existsResult.error);
        if (!existsResult.data)
          return err(parteContrariaNotFoundError(parte.entidadeId));
      }
    }
  }

  // 7. Atualizar via repositório
  // Nota: Indexação semântica é feita na camada de Server Actions
  return updateContratoRepo(id, dadosValidados, contratoExistente);
}

/**
 * Lista contratos de um cliente específico
 *
 * Helper para Portal do Cliente: retorna array tipado ao invés de Result.
 * Em caso de erro, retorna array vazio.
 *
 * @param clienteId - ID do cliente
 * @returns Array de contratos do cliente (vazio se erro ou nenhum encontrado)
 *
 * @example
 * ```typescript
 * const contratos = await listarContratosPorClienteId(123);
 * console.log(`Cliente tem ${contratos.length} contratos`);
 * ```
 */
export async function listarContratosPorClienteId(
  clienteId: number,
): Promise<Contrato[]> {
  const result = await listarContratos({ clienteId, limite: 100 });
  if (result.success && result.data) {
    return result.data.data;
  }
  return [];
}

/**
 * Conta contratos agrupados por status
 *
 * @returns Result contendo objeto com contagem por status
 *
 * @example
 * ```typescript
 * const result = await contarContratosPorStatus();
 * if (result.success) {
 *   console.log(`Em contratação: ${result.data.em_contratacao}`);
 *   console.log(`Contratados: ${result.data.contratado}`);
 * }
 * ```
 */
export async function contarContratosPorStatus(params?: {
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<Result<Record<StatusContrato, number>>> {
  return countContratosPorStatus(params);
}

export async function contarContratos(): Promise<Result<number>> {
  return countContratos();
}

export async function contarContratosAteData(
  dataLimite: Date,
): Promise<Result<number>> {
  return countContratosAteData(dataLimite);
}

export async function contarContratosEntreDatas(
  dataInicio: Date,
  dataFim: Date,
): Promise<Result<number>> {
  return countContratosEntreDatas(dataInicio, dataFim);
}

/**
 * Remove um contrato (Hard Delete via Repository)
 */
export async function excluirContrato(id: number): Promise<Result<void>> {
  if (!id || id <= 0) {
    return err(contratoIdInvalidError(id));
  }

  // Garantir que existe antes de excluir (opcional, mas boa prática para retorno correto)
  const existingResult = await findContratoById(id);
  if (!existingResult.success) return existingResult;
  if (!existingResult.data) return err(contratoNotFoundError(id));

  return deleteContrato(id);
}
