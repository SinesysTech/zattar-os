/**
 * CONTRATOS FEATURE - Erros Customizados
 *
 * Factories para criar AppError específicos do domínio de contratos.
 * Facilita rastreabilidade e tratamento específico de erros.
 */

import { type AppError, appError } from '@/lib/types';

// =============================================================================
// ERROS DE ENTIDADE NÃO ENCONTRADA
// =============================================================================

/**
 * Cria erro para contrato não encontrado
 *
 * @param contratoId - ID do contrato buscado
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * return err(contratoNotFoundError(123));
 * ```
 */
export function contratoNotFoundError(contratoId: number): AppError {
  return appError('NOT_FOUND', `Contrato com ID ${contratoId} não encontrado`, {
    entity: 'contrato',
    contratoId,
  });
}

/**
 * Cria erro para cliente não encontrado
 *
 * @param clienteId - ID do cliente buscado
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * return err(clienteNotFoundError(456));
 * ```
 */
export function clienteNotFoundError(clienteId: number): AppError {
  return appError('NOT_FOUND', 'Cliente não encontrado', {
    entity: 'cliente',
    field: 'clienteId',
    clienteId,
  });
}

/**
 * Cria erro para parte contrária não encontrada
 *
 * @param parteContrariaId - ID da parte contrária buscada
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * return err(parteContrariaNotFoundError(789));
 * ```
 */
export function parteContrariaNotFoundError(parteContrariaId: number): AppError {
  return appError('NOT_FOUND', 'Parte contrária não encontrada', {
    entity: 'parte_contraria',
    field: 'parteContrariaId',
    parteContrariaId,
  });
}

// =============================================================================
// ERROS DE VALIDAÇÃO
// =============================================================================

/**
 * Cria erro para validação de contrato
 *
 * @param message - Mensagem de erro
 * @param details - Detalhes adicionais (campo, valor inválido, etc.)
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * return err(contratoValidationError('Status inválido', { field: 'status', value: 'invalid' }));
 * ```
 */
export function contratoValidationError(
  message: string,
  details?: Record<string, unknown>
): AppError {
  return appError('VALIDATION_ERROR', message, {
    entity: 'contrato',
    ...details,
  });
}

/**
 * Cria erro para ID de contrato inválido
 *
 * @param id - ID inválido fornecido
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * if (!id || id <= 0) {
 *   return err(contratoIdInvalidError(id));
 * }
 * ```
 */
export function contratoIdInvalidError(id?: number | null): AppError {
  return appError('VALIDATION_ERROR', 'ID do contrato inválido', {
    entity: 'contrato',
    field: 'id',
    providedValue: id,
  });
}

/**
 * Cria erro para atualização sem campos
 *
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * if (Object.keys(dados).length === 0) {
 *   return err(contratoNoFieldsToUpdateError());
 * }
 * ```
 */
export function contratoNoFieldsToUpdateError(): AppError {
  return appError('VALIDATION_ERROR', 'Nenhum campo para atualizar', {
    entity: 'contrato',
  });
}

// =============================================================================
// ERROS DE BANCO DE DADOS
// =============================================================================

/**
 * Cria erro para falha de banco de dados
 *
 * @param operation - Operação que falhou (criar, atualizar, buscar, etc.)
 * @param cause - Erro original (opcional)
 * @param details - Detalhes adicionais
 * @returns AppError configurado
 *
 * @example
 * ```typescript
 * return err(contratoDatabaseError('criar', error, { code: error.code }));
 * ```
 */
export function contratoDatabaseError(
  operation: 'criar' | 'atualizar' | 'buscar' | 'listar' | 'deletar',
  cause?: Error,
  details?: Record<string, unknown>
): AppError {
  const messages: Record<string, string> = {
    criar: 'Erro ao criar contrato',
    atualizar: 'Erro ao atualizar contrato',
    buscar: 'Erro ao buscar contrato',
    listar: 'Erro ao listar contratos',
    deletar: 'Erro ao deletar contrato',
  };

  return appError(
    'DATABASE_ERROR',
    messages[operation],
    {
      entity: 'contrato',
      operation,
      ...details,
    },
    cause
  );
}

// =============================================================================
// HELPERS DE VERIFICAÇÃO
// =============================================================================

/**
 * Verifica se um erro é específico de contrato não encontrado
 *
 * @param error - Erro a verificar
 * @returns true se for erro de contrato não encontrado
 *
 * @example
 * ```typescript
 * if (isContratoNotFoundError(result.error)) {
 *   // Tratar caso específico
 * }
 * ```
 */
export function isContratoNotFoundError(error: AppError): boolean {
  return error.code === 'NOT_FOUND' && error.details?.entity === 'contrato';
}

/**
 * Verifica se um erro é específico de cliente não encontrado
 *
 * @param error - Erro a verificar
 * @returns true se for erro de cliente não encontrado
 */
export function isClienteNotFoundError(error: AppError): boolean {
  return error.code === 'NOT_FOUND' && error.details?.entity === 'cliente';
}

/**
 * Verifica se um erro é específico de parte contrária não encontrada
 *
 * @param error - Erro a verificar
 * @returns true se for erro de parte contrária não encontrada
 */
export function isParteContrariaNotFoundError(error: AppError): boolean {
  return error.code === 'NOT_FOUND' && error.details?.entity === 'parte_contraria';
}

/**
 * Verifica se um erro é de validação de contrato
 *
 * @param error - Erro a verificar
 * @returns true se for erro de validação
 */
export function isContratoValidationError(error: AppError): boolean {
  return error.code === 'VALIDATION_ERROR' && error.details?.entity === 'contrato';
}
