/**
 * TAREFAS SERVICE - Camada de Regras de Negócio
 * 
 * Este arquivo contém a lógica de negócio para Tarefas.
 * 
 * CONVENÇÕES:
 * - Funções nomeadas como ações: criar, atualizar, listar, buscar, remover
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import { z } from 'zod';
import type {
  Tarefa,
  CreateTarefaInput,
  UpdateTarefaInput,
  ListarTarefasParams,
} from './domain';
import {
  createTarefaSchema,
  updateTarefaSchema,
  listarTarefasSchema,
} from './domain';
import {
  findTarefaById,
  findAllTarefas,
  createTarefa as createTarefaRepo,
  updateTarefa as updateTarefaRepo,
  deleteTarefa as deleteTarefaRepo,
} from './repository';

/**
 * Valida input com schema Zod
 */
function validarInput<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    return err(appError('VALIDATION_ERROR', result.error.errors[0]?.message || 'Dados inválidos'));
  }
  return ok(result.data as T);
}

/**
 * Cria uma nova tarefa
 */
export async function criarTarefa(usuarioId: number, input: CreateTarefaInput): Promise<Result<Tarefa>> {
  // 1. Validar input
  const valResult = validarInput<CreateTarefaInput>(createTarefaSchema, input);
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  // 2. Persistir via repositório
  return createTarefaRepo(usuarioId, dadosValidados);
}

/**
 * Busca uma tarefa pelo ID
 */
export async function buscarTarefa(id: number, usuarioId: number): Promise<Result<Tarefa | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  return findTarefaById(id, usuarioId);
}

/**
 * Lista tarefas do usuário com filtros e paginação
 */
export async function listarTarefas(
  usuarioId: number,
  params: ListarTarefasParams = {}
): Promise<Result<PaginatedResponse<Tarefa>>> {
  // Validar parâmetros
  const valResult = validarInput<ListarTarefasParams>(listarTarefasSchema, params);
  if (!valResult.success) return err(valResult.error);
  const paramsValidados = valResult.data;

  return findAllTarefas(usuarioId, paramsValidados);
}

/**
 * Atualiza uma tarefa existente
 */
export async function atualizarTarefa(
  id: number,
  usuarioId: number,
  input: UpdateTarefaInput
): Promise<Result<Tarefa>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  // Validar input
  const valResult = validarInput<UpdateTarefaInput>(updateTarefaSchema, { ...input, id });
  if (!valResult.success) return err(valResult.error);
  const dadosValidados = valResult.data;

  return updateTarefaRepo(id, usuarioId, dadosValidados);
}

/**
 * Remove uma tarefa
 */
export async function removerTarefa(id: number, usuarioId: number): Promise<Result<void>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID inválido'));
  }

  return deleteTarefaRepo(id, usuarioId);
}

/**
 * Marca uma tarefa como concluída
 */
export async function concluirTarefa(id: number, usuarioId: number): Promise<Result<Tarefa>> {
  return atualizarTarefa(id, usuarioId, {
    id,
    status: 'concluida',
    data_conclusao: new Date().toISOString(),
  });
}

/**
 * Reabre uma tarefa (marca como pendente)
 */
export async function reabrirTarefa(id: number, usuarioId: number): Promise<Result<Tarefa>> {
  return atualizarTarefa(id, usuarioId, {
    id,
    status: 'pendente',
    data_conclusao: null,
  });
}

