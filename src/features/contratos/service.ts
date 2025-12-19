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

import { Result, err, PaginatedResponse } from '@/lib/types';
import { indexarDocumento, atualizarDocumentoNoIndice } from '@/lib/ai/indexing';
import {
  type Contrato,
  type CreateContratoInput,
  type UpdateContratoInput,
  type ListarContratosParams,
  createContratoSchema,
  updateContratoSchema,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from './domain';
import {
  findContratoById,
  findAllContratos,
  saveContrato,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
} from './repository';
import {
  contratoNotFoundError,
  clienteNotFoundError,
  parteContrariaNotFoundError,
  contratoValidationError,
  contratoIdInvalidError,
  contratoNoFieldsToUpdateError,
} from './errors';

// =============================================================================
// HELPERS - INDEXAÇÃO SEMÂNTICA
// =============================================================================

/**
 * Constrói texto para indexação semântica de um contrato
 *
 * Formato otimizado para busca semântica com RAG/pgvector.
 * Inclui todos os campos relevantes para queries como:
 * "contrato ajuizamento cliente X", "contratos pró-êxito pendentes"
 */
function buildContratoIndexText(contrato: Contrato): string {
  const tipoLabel = TIPO_CONTRATO_LABELS[contrato.tipoContrato] || contrato.tipoContrato;
  const statusLabel = STATUS_CONTRATO_LABELS[contrato.status] || contrato.status;
  const poloLabel = POLO_PROCESSUAL_LABELS[contrato.poloCliente] || contrato.poloCliente;
  const cobrancaLabel = TIPO_COBRANCA_LABELS[contrato.tipoCobranca] || contrato.tipoCobranca;

  return `Contrato #${contrato.id}: ${tipoLabel} - Cliente ID ${contrato.clienteId} - Status: ${statusLabel} - Polo: ${poloLabel} - Cobrança: ${cobrancaLabel} - Data Contratação: ${contrato.dataContratacao} - Observações: ${contrato.observacoes || 'N/A'}`;
}

/**
 * Indexa um contrato para busca semântica (async, não bloqueia)
 *
 * @remarks
 * Usa tipo 'outro' pois 'contrato' não está na lista de tipos suportados.
 * Categoria 'contrato' é adicionada aos metadados para identificação.
 * Usa queueMicrotask para execução async compatível com client/server.
 */
function indexarContratoAsync(contrato: Contrato): void {
  queueMicrotask(async () => {
    try {
      await indexarDocumento({
        texto: buildContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          poloCliente: contrato.poloCliente,
          createdAt: contrato.createdAt,
        },
      });
      console.log(`[Contratos] Contrato ${contrato.id} indexado para busca semântica`);
    } catch (error) {
      console.error(`[Contratos] Erro ao indexar contrato ${contrato.id}:`, error);
    }
  });
}

/**
 * Atualiza indexação de um contrato (async, não bloqueia)
 *
 * @remarks
 * Usa tipo 'outro' pois 'contrato' não está na lista de tipos suportados.
 * Categoria 'contrato' é adicionada aos metadados para identificação.
 * Usa queueMicrotask para execução async compatível com client/server.
 */
function atualizarIndexacaoContratoAsync(contrato: Contrato): void {
  queueMicrotask(async () => {
    try {
      await atualizarDocumentoNoIndice({
        texto: buildContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          poloCliente: contrato.poloCliente,
          updatedAt: contrato.updatedAt,
        },
      });
      console.log(`[Contratos] Indexação do contrato ${contrato.id} atualizada`);
    } catch (error) {
      console.error(`[Contratos] Erro ao atualizar indexação do contrato ${contrato.id}:`, error);
    }
  });
}

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
  input: CreateContratoInput
): Promise<Result<Contrato>> {
  // 1. Validar input com Zod
  const validation = createContratoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      contratoValidationError(firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
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

  // 3. Verificar se parte contrária existe (se fornecida)
  if (dadosValidados.parteContrariaId) {
    const parteContrariaExistsResult = await parteContrariaExists(
      dadosValidados.parteContrariaId
    );
    if (!parteContrariaExistsResult.success) {
      return err(parteContrariaExistsResult.error);
    }
    if (!parteContrariaExistsResult.data) {
      return err(parteContrariaNotFoundError(dadosValidados.parteContrariaId));
    }
  }

  // 4. Persistir via repositório
  const result = await saveContrato(dadosValidados);

  // 5. Indexar para busca semântica (async, não bloqueia resposta)
  if (result.success) {
    indexarContratoAsync(result.data);
  }

  return result;
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
  id: number
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
  params: ListarContratosParams = {}
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
  input: UpdateContratoInput
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
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
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

  // 6. Se alterando parteContrariaId, verificar se nova parte contrária existe
  if (
    dadosValidados.parteContrariaId !== undefined &&
    dadosValidados.parteContrariaId !== null &&
    dadosValidados.parteContrariaId !== contratoExistente.parteContrariaId
  ) {
    const parteContrariaExistsResult = await parteContrariaExists(
      dadosValidados.parteContrariaId
    );
    if (!parteContrariaExistsResult.success) {
      return err(parteContrariaExistsResult.error);
    }
    if (!parteContrariaExistsResult.data) {
      return err(parteContrariaNotFoundError(dadosValidados.parteContrariaId));
    }
  }

  // 7. Atualizar via repositório
  const result = await updateContratoRepo(id, dadosValidados, contratoExistente);

  // 8. Atualizar indexação semântica (async, não bloqueia resposta)
  if (result.success) {
    atualizarIndexacaoContratoAsync(result.data);
  }

  return result;
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
  clienteId: number
): Promise<Contrato[]> {
  const result = await listarContratos({ clienteId, limite: 100 });
  if (result.success && result.data) {
    return result.data.data;
  }
  return [];
}
