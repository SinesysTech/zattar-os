/**
 * _TEMPLATE SERVICE - Camada de Regras de Negócio (Casos de Uso)
 *
 * Este arquivo demonstra o padrão para:
 * 1. Validação de entrada com Zod
 * 2. Orquestração de repositórios
 * 3. Regras de negócio específicas do domínio
 *
 * CONVENÇÕES:
 * - Funções nomeadas como ações: criar, atualizar, listar, buscar, remover
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import {
  type Tarefa,
  type CreateTarefaInput,
  type UpdateTarefaInput,
  type ListTarefasParams,
  createTarefaSchema,
  updateTarefaSchema,
} from './domain';
import {
  findTarefaById,
  findAllTarefas,
  saveTarefa,
  updateTarefa as updateTarefaRepo,
  removeTarefa as removeTarefaRepo,
} from './repository';

/**
 * Cria uma nova tarefa
 *
 * Regras de negócio:
 * - Título é obrigatório e deve ter 3-200 caracteres
 * - Prioridade default é "media"
 */
export async function criarTarefa(input: CreateTarefaInput): Promise<Result<Tarefa>> {
  // 1. Validar input com Zod
  const validation = createTarefaSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  // 2. Aplicar regras de negócio (se houver)
  // Exemplo: verificar se responsável existe, normalizar dados, etc.

  // 3. Persistir via repositório
  return saveTarefa(validation.data);
}

/**
 * Busca uma tarefa pelo ID
 *
 * Retorna null se não encontrar (não é erro)
 */
export async function buscarTarefa(id: number): Promise<Result<Tarefa | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  return findTarefaById(id);
}

/**
 * Lista tarefas com filtros e paginação
 */
export async function listarTarefas(
  params: ListTarefasParams = {}
): Promise<Result<PaginatedResponse<Tarefa>>> {
  // Sanitizar parâmetros de paginação
  const sanitizedParams: ListTarefasParams = {
    ...params,
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 20)),
  };

  return findAllTarefas(sanitizedParams);
}

/**
 * Atualiza uma tarefa existente
 *
 * Regras de negócio:
 * - Tarefa precisa existir
 * - Validar campos que estão sendo atualizados
 */
export async function atualizarTarefa(
  id: number,
  input: UpdateTarefaInput
): Promise<Result<Tarefa>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  // 2. Validar input com Zod
  const validation = updateTarefaSchema.safeParse(input);

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
  if (Object.keys(validation.data).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 4. Verificar se tarefa existe
  const existingResult = await findTarefaById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Tarefa com ID ${id} não encontrada`));
  }

  // 5. Atualizar via repositório
  return updateTarefaRepo(id, validation.data);
}

/**
 * Marca uma tarefa como concluída
 *
 * Este é um caso de uso específico que encapsula a regra de negócio
 */
export async function concluirTarefa(id: number): Promise<Result<Tarefa>> {
  return atualizarTarefa(id, { concluida: true });
}

/**
 * Reabre uma tarefa já concluída
 */
export async function reabrirTarefa(id: number): Promise<Result<Tarefa>> {
  return atualizarTarefa(id, { concluida: false });
}

/**
 * Remove uma tarefa
 *
 * Regras de negócio:
 * - Tarefa precisa existir
 */
export async function removerTarefa(id: number): Promise<Result<void>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  // 2. Verificar se tarefa existe
  const existingResult = await findTarefaById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Tarefa com ID ${id} não encontrada`));
  }

  // 3. Remover via repositório
  return removeTarefaRepo(id);
}
