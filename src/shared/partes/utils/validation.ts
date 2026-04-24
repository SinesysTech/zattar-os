import { ZodSchema } from 'zod';
import { Result, ok, err, appError, AppError } from '@/types';

/**
 * Valida o input usando um schema Zod
 */
export function validarInput<T>(schema: ZodSchema, input: unknown): Result<T> {
  const validation = schema.safeParse(input);
  
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }
  
  return ok(validation.data as T);
}

/**
 * Verifica duplicidade de documento (CPF/CNPJ)
 * Retorna erro se encontrar registro duplicado
 */
export async function verificarDuplicidadeDocumento<T extends { id: number }>(
  documento: string | undefined | null,
  finder: (doc: string) => Promise<Result<T | null>>,
  errorFactory: (doc: string, id: number) => AppError
): Promise<Result<void>> {
  if (!documento) return ok(undefined);
  
  const result = await finder(documento);
  if (!result.success) return err(result.error);
  
  if (result.data) {
    return err(errorFactory(documento, result.data.id));
  }
  
  return ok(undefined);
}

/**
 * Verifica duplicidade de documento para atualização (ignora o próprio ID)
 */
export async function verificarDuplicidadeDocumentoUpdate<T extends { id: number }>(
  documento: string | undefined | null,
  currentId: number,
  finder: (doc: string) => Promise<Result<T | null>>,
  errorFactory: (doc: string, id: number) => AppError
): Promise<Result<void>> {
  if (!documento) return ok(undefined);

  const result = await finder(documento);
  if (!result.success) return err(result.error);

  if (result.data && result.data.id !== currentId) {
    return err(errorFactory(documento, result.data.id));
  }

  return ok(undefined);
}

/**
 * Verifica duplicidade diferenciando cadastro ATIVO vs INATIVO.
 *
 * Usado em criação: permite à UI oferecer "reativar + atualizar" quando o
 * conflito é com um registro soft-deleted, em vez de travar o usuário.
 *
 * - finder: retorna a entidade pelo documento sem filtrar por `ativo`
 * - activeErrorFactory: erro quando o registro encontrado está ativo
 * - inactiveErrorFactory: erro quando o registro encontrado está inativo
 */
export async function verificarDuplicidadeDocumentoComSoftDelete<
  T extends { id: number; ativo: boolean | null | undefined }
>(
  documento: string | undefined | null,
  finder: (doc: string) => Promise<Result<T | null>>,
  activeErrorFactory: (doc: string, id: number) => AppError,
  inactiveErrorFactory: (doc: string, id: number) => AppError
): Promise<Result<void>> {
  if (!documento) return ok(undefined);

  const result = await finder(documento);
  if (!result.success) return err(result.error);

  if (result.data) {
    // `ativo === false` é o único estado que consideramos "inativo explícito".
    // `null`/`undefined` (registros legados sem preenchimento) são tratados
    // como ativos para manter o comportamento estrito anterior.
    const isAtivo = result.data.ativo !== false;
    const factory = isAtivo ? activeErrorFactory : inactiveErrorFactory;
    return err(factory(documento, result.data.id));
  }

  return ok(undefined);
}
