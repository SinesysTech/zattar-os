/**
 * TAREFAS REPOSITORY - Camada de Persistência
 * 
 * Funções de acesso ao banco de dados para Tarefas
 */

import 'server-only';

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import type { Tarefa, CreateTarefaInput, UpdateTarefaInput, ListarTarefasParams } from './domain';

const TABLE_TAREFAS = 'tarefas';

type TarefaRow = {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: number;
  data_vencimento: string | null;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Converte row do banco para entidade Tarefa
 */
function rowToTarefa(row: TarefaRow): Tarefa {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titulo: row.titulo,
    descricao: row.descricao,
    status: row.status,
    prioridade: row.prioridade,
    data_vencimento: row.data_vencimento,
    data_conclusao: row.data_conclusao,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Busca uma tarefa pelo ID
 */
export async function findTarefaById(id: number, usuarioId: number): Promise<Result<Tarefa | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_TAREFAS)
      .select('*')
      .eq('id', id)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    return ok(rowToTarefa(data as TarefaRow));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar tarefa', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista tarefas do usuário com filtros e paginação
 */
export async function findAllTarefas(
  usuarioId: number,
  params: ListarTarefasParams = {}
): Promise<Result<PaginatedResponse<Tarefa>>> {
  try {
    const db = createDbClient();
    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 20;
    const offset = (pagina - 1) * limite;

    let query = db
      .from(TABLE_TAREFAS)
      .select('*', { count: 'exact' })
      .eq('usuario_id', usuarioId);

    // Filtros
    if (params.busca) {
      query = query.or(`titulo.ilike.%${params.busca}%,descricao.ilike.%${params.busca}%`);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.prioridade !== undefined) {
      query = query.eq('prioridade', params.prioridade);
    }

    // Ordenação padrão: data de vencimento (asc), depois created_at (desc)
    query = query.order('data_vencimento', { ascending: true, nullsFirst: false });
    query = query.order('created_at', { ascending: false });

    // Paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const tarefas = (data || []).map(rowToTarefa);
    const total = count ?? 0;
    const totalPaginas = Math.ceil(total / limite);

    return ok({
      data: tarefas,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar tarefas', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Cria uma nova tarefa
 */
export async function createTarefa(usuarioId: number, input: CreateTarefaInput): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    const insertData = {
      usuario_id: usuarioId,
      titulo: input.titulo,
      descricao: input.descricao || null,
      status: input.status,
      prioridade: input.prioridade ?? 0,
      data_vencimento: input.data_vencimento || null,
    };

    const { data, error } = await db.from(TABLE_TAREFAS).insert(insertData).select().single();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(rowToTarefa(data as TarefaRow));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao criar tarefa', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Atualiza uma tarefa existente
 */
export async function updateTarefa(
  id: number,
  usuarioId: number,
  input: UpdateTarefaInput
): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    // Verificar se a tarefa existe e pertence ao usuário
    const tarefaResult = await findTarefaById(id, usuarioId);
    if (!tarefaResult.success) {
      return err(tarefaResult.error);
    }
    if (!tarefaResult.data) {
      return err(appError('NOT_FOUND', 'Tarefa não encontrada'));
    }

    // Preparar dados para update (apenas campos fornecidos)
    const updateData: Partial<TarefaRow> = {};
    if (input.titulo !== undefined) updateData.titulo = input.titulo;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;
    if (input.data_vencimento !== undefined) updateData.data_vencimento = input.data_vencimento;
    if (input.data_conclusao !== undefined) updateData.data_conclusao = input.data_conclusao;

    const { data, error } = await db
      .from(TABLE_TAREFAS)
      .update(updateData)
      .eq('id', id)
      .eq('usuario_id', usuarioId)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(rowToTarefa(data as TarefaRow));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao atualizar tarefa', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Remove uma tarefa
 */
export async function deleteTarefa(id: number, usuarioId: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Verificar se a tarefa existe e pertence ao usuário
    const tarefaResult = await findTarefaById(id, usuarioId);
    if (!tarefaResult.success) {
      return err(tarefaResult.error);
    }
    if (!tarefaResult.data) {
      return err(appError('NOT_FOUND', 'Tarefa não encontrada'));
    }

    const { error } = await db.from(TABLE_TAREFAS).delete().eq('id', id).eq('usuario_id', usuarioId);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao remover tarefa', undefined, error instanceof Error ? error : undefined)
    );
  }
}

