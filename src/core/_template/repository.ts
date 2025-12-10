/**
 * _TEMPLATE REPOSITORY - Camada de Persistência
 *
 * Este arquivo demonstra o padrão para:
 * 1. Funções que acessam o banco de dados
 * 2. Queries SQL/Supabase
 * 3. Mapeamento de dados do banco para entidades
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update, remove
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 * - NUNCA importar React/Next.js aqui
 */

import { createDbClient } from '@/core/common/db';
import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import type { Tarefa, CreateTarefaInput, UpdateTarefaInput, ListTarefasParams } from './domain';

const TABLE_NAME = 'tarefas';

/**
 * Busca uma tarefa pelo ID
 */
export async function findTarefaById(id: number): Promise<Result<Tarefa | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // .single() retorna erro quando não encontra, mas isso não é um erro de fato
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as Tarefa);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar tarefa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista tarefas com filtros e paginação
 */
export async function findAllTarefas(
  params: ListTarefasParams = {}
): Promise<Result<PaginatedResponse<Tarefa>>> {
  try {
    const db = createDbClient();
    const { concluida, prioridade, responsavel_id, page = 1, limit = 20 } = params;

    // Calcular offset
    const offset = (page - 1) * limit;

    // Query base
    let query = db.from(TABLE_NAME).select('*', { count: 'exact' });

    // Aplicar filtros
    if (concluida !== undefined) {
      query = query.eq('concluida', concluida);
    }
    if (prioridade) {
      query = query.eq('prioridade', prioridade);
    }
    if (responsavel_id) {
      query = query.eq('responsavel_id', responsavel_id);
    }

    // Paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return ok({
      data: (data as Tarefa[]) ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar tarefas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Salva uma nova tarefa no banco
 */
export async function saveTarefa(input: CreateTarefaInput): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_NAME)
      .insert({
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        prioridade: input.prioridade ?? 'media',
        responsavel_id: input.responsavel_id ?? null,
        concluida: false,
      })
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as Tarefa);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao salvar tarefa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza uma tarefa existente
 */
export async function updateTarefa(
  id: number,
  input: UpdateTarefaInput
): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_NAME)
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', `Tarefa com ID ${id} não encontrada`));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as Tarefa);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar tarefa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove uma tarefa do banco (soft delete ou hard delete conforme necessidade)
 */
export async function removeTarefa(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const { error } = await db.from(TABLE_NAME).delete().eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover tarefa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
