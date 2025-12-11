import { createDbClient } from '@/core/common/db';
import { getCached, setCached, invalidateCacheOnUpdate, CACHE_PREFIXES } from '@/backend/utils/redis';
import type {
    TipoExpediente,
    CreateTipoExpedienteInput,
    UpdateTipoExpedienteInput,
    ListarTiposExpedientesParams,
    ListarTiposExpedientesResult,
} from './domain';

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaTipoExpediente(data: Record<string, unknown>): TipoExpediente {
    return {
        id: data.id as number,
        tipoExpediente: data.tipo_expediente as string,
        createdBy: data.created_by as number,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
    };
}

// =============================================================================
// FUNÇÕES DE LEITURA
// =============================================================================

/**
 * Buscar tipo de expediente por ID
 */
export async function findById(id: number): Promise<TipoExpediente | null> {
    const cacheKey = `${CACHE_PREFIXES.tiposExpedientes}:id:${id}`;

    const cached = await getCached<TipoExpediente>(cacheKey);
    if (cached) {
        return cached;
    }

    const db = createDbClient();
    const { data, error } = await db
        .from('tipos_expedientes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error(`Erro ao buscar tipo de expediente: ${error.message}`);
    }

    const result = converterParaTipoExpediente(data);
    await setCached(cacheKey, result, 3600);

    return result;
}

/**
 * Buscar tipo de expediente por nome
 */
export async function findByNome(nome: string): Promise<TipoExpediente | null> {
    const db = createDbClient();
    const { data, error } = await db
        .from('tipos_expedientes')
        .select('*')
        .eq('tipo_expediente', nome.trim())
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error(`Erro ao buscar tipo de expediente por nome: ${error.message}`);
    }

    return converterParaTipoExpediente(data);
}

/**
 * Verificar se está em uso na tabela expedientes
 */
export async function isInUse(id: number): Promise<boolean> {
    const db = createDbClient();
    const { data, error } = await db
        .from('expedientes')
        .select('id')
        .eq('tipo_expediente_id', id)
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return false;
        }
        throw new Error(`Erro ao verificar uso do tipo de expediente: ${error.message}`);
    }

    return !!data;
}

/**
 * Listar tipos de expedientes com filtros
 */
export async function findAll(
    params: ListarTiposExpedientesParams
): Promise<ListarTiposExpedientesResult> {
    // Cache key baseada nos parâmetros
    // Nota: Para simplificar, podemos usar hash dos params, mas aqui faremos uma string simples
    // O Redis util pode ter um helper para isso, mas vamos contruir conforme padrão anterior
    const cacheKey = `${CACHE_PREFIXES.tiposExpedientes}:list:${JSON.stringify(params)}`;

    const cached = await getCached<ListarTiposExpedientesResult>(cacheKey);
    if (cached) {
        return cached;
    }

    const db = createDbClient();

    const pagina = params.pagina;
    const limite = params.limite;
    const offset = (pagina - 1) * limite;

    let query = db.from('tipos_expedientes').select('*', { count: 'exact' });

    // Busca textual
    if (params.busca) {
        const busca = params.busca.trim();
        query = query.ilike('tipo_expediente', `%${busca}%`);
    }

    // Ordenação
    // Mapear campos camelCase para snake_case
    const mapaOrdenacao: Record<string, string> = {
        tipoExpediente: 'tipo_expediente',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };
    const colunaOrdenacao = mapaOrdenacao[params.ordenarPor] || 'tipo_expediente';

    query = query.order(colunaOrdenacao, { ascending: params.ordem === 'asc' });

    // Paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Erro ao listar tipos de expedientes: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPaginas = Math.ceil(total / limite);

    const result: ListarTiposExpedientesResult = {
        data: (data || []).map(converterParaTipoExpediente),
        meta: {
            total,
            pagina,
            limite,
            totalPaginas,
        },
    };

    await setCached(cacheKey, result, 3600);

    return result;
}

// =============================================================================
// FUNÇÕES DE ESCRITA
// =============================================================================

/**
 * Criar tipo de expediente
 */
export async function create(
    data: CreateTipoExpedienteInput,
    userId: number
): Promise<TipoExpediente> {
    const db = createDbClient();

    const { data: inserted, error } = await db
        .from('tipos_expedientes')
        .insert({
            tipo_expediente: data.tipoExpediente.trim(),
            created_by: userId,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar tipo de expediente: ${error.message}`);
    }

    // Invalidar cache
    // Nota: invalidateCacheOnUpdate espera um ID ou padrao?
    // No legacy era: invalidateCacheOnUpdate('tiposExpedientes', data.id.toString())
    // Isso invalida listas e o item especifico
    if (inserted) {
        await invalidateCacheOnUpdate('tiposExpedientes', inserted.id.toString());
    }

    return converterParaTipoExpediente(inserted);
}

/**
 * Atualizar tipo de expediente
 */
export async function update(
    id: number,
    data: UpdateTipoExpedienteInput
): Promise<TipoExpediente> {
    const db = createDbClient();

    const updateData: Record<string, any> = {};
    if (data.tipoExpediente !== undefined) {
        updateData.tipo_expediente = data.tipoExpediente.trim();
    }
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await db
        .from('tipos_expedientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('Tipo de expediente não encontrado');
        }
        throw new Error(`Erro ao atualizar tipo de expediente: ${error.message}`);
    }

    await invalidateCacheOnUpdate('tiposExpedientes', id.toString());

    return converterParaTipoExpediente(updated);
}

/**
 * Deletar tipo de expediente
 */
export async function deleteById(id: number): Promise<void> {
    const db = createDbClient();

    const { error } = await db
        .from('tipos_expedientes')
        .delete()
        .eq('id', id);

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('Tipo de expediente não encontrado');
        }
        throw new Error(`Erro ao deletar tipo de expediente: ${error.message}`);
    }

    await invalidateCacheOnUpdate('tiposExpedientes', id.toString());
}
