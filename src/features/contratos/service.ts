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

import { Result, ok, err, appError, PaginatedResponse } from '@/lib/types';
import {
  type Contrato,
  type CreateContratoInput,
  type UpdateContratoInput,
  type ListarContratosParams,
  createContratoSchema,
  updateContratoSchema,
} from './domain';
import {
  findContratoById,
  findAllContratos,
  saveContrato,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
} from './repository';

// =============================================================================
// SERVIÇOS - CONTRATO
// =============================================================================

/**
 * Cria um novo contrato
 *
 * Regras de negócio:
 * - Campos obrigatórios: areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente
 * - Cliente deve existir no sistema
 * - Se parteContrariaId fornecido, deve existir no sistema
 * - Status padrão: 'em_contratacao'
 * - Data de contratação padrão: data atual
 */
export async function criarContrato(input: CreateContratoInput): Promise<Result<Contrato>> {
  // 1. Validar input com Zod
  const validation = createContratoSchema.safeParse(input);

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

  // 2. Verificar se cliente existe
  const clienteExistsResult = await clienteExists(dadosValidados.clienteId);
  if (!clienteExistsResult.success) {
    return err(clienteExistsResult.error);
  }
  if (!clienteExistsResult.data) {
    return err(
      appError('NOT_FOUND', 'Cliente não encontrado', {
        field: 'clienteId',
        clienteId: dadosValidados.clienteId,
      })
    );
  }

  // 3. Verificar se parte contrária existe (se fornecida)
  if (dadosValidados.parteContrariaId) {
    const parteContrariaExistsResult = await parteContrariaExists(dadosValidados.parteContrariaId);
    if (!parteContrariaExistsResult.success) {
      return err(parteContrariaExistsResult.error);
    }
    if (!parteContrariaExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Parte contrária não encontrada', {
          field: 'parteContrariaId',
          parteContrariaId: dadosValidados.parteContrariaId,
        })
      );
    }
  }

  // 4. Persistir via repositório
  return saveContrato(dadosValidados);
}

/**
 * Busca um contrato pelo ID
 *
 * Retorna null se não encontrar (não é erro)
 */
export async function buscarContrato(id: number): Promise<Result<Contrato | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  return findContratoById(id);
}

/**
 * Lista contratos com filtros e paginação
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
 * Regras de negócio:
 * - Contrato precisa existir
 * - Se alterar clienteId, novo cliente deve existir
 * - Se alterar parteContrariaId, nova parte contrária deve existir
 * - Preserva estado anterior para auditoria
 */
export async function atualizarContrato(
  id: number,
  input: UpdateContratoInput
): Promise<Result<Contrato>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  // 2. Validar input com Zod
  const validation = updateContratoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  // 3. Verificar se há algo para atualizar
  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 4. Verificar se contrato existe
  const existingResult = await findContratoById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Contrato com ID ${id} não encontrado`));
  }

  const contratoExistente = existingResult.data;

  // 5. Se alterando clienteId, verificar se novo cliente existe
  if (dadosValidados.clienteId && dadosValidados.clienteId !== contratoExistente.clienteId) {
    const clienteExistsResult = await clienteExists(dadosValidados.clienteId);
    if (!clienteExistsResult.success) {
      return err(clienteExistsResult.error);
    }
    if (!clienteExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Novo cliente não encontrado', {
          field: 'clienteId',
          clienteId: dadosValidados.clienteId,
        })
      );
    }
  }

  // 6. Se alterando parteContrariaId, verificar se nova parte contrária existe
  if (
    dadosValidados.parteContrariaId !== undefined &&
    dadosValidados.parteContrariaId !== null &&
    dadosValidados.parteContrariaId !== contratoExistente.parteContrariaId
  ) {
    const parteContrariaExistsResult = await parteContrariaExists(dadosValidados.parteContrariaId);
    if (!parteContrariaExistsResult.success) {
      return err(parteContrariaExistsResult.error);
    }
    if (!parteContrariaExistsResult.data) {
      return err(
        appError('NOT_FOUND', 'Nova parte contrária não encontrada', {
          field: 'parteContrariaId',
          parteContrariaId: dadosValidados.parteContrariaId,
        })
      );
    }
  }

  // 7. Atualizar via repositório
  return updateContratoRepo(id, dadosValidados, contratoExistente);
}
