import { createDbClient } from '@/core/common/db';
import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import { fromSnakeToCamel, fromCamelToSnake } from '@/lib/utils';
import {
    Audiencia,
    ListarAudienciasParams,
    StatusAudiencia,
} from './domain';

type AudienciaRow = Record<string, unknown>;

function converterParaAudiencia(data: AudienciaRow): Audiencia {
    const converted = fromSnakeToCamel(data) as unknown as Audiencia;
    if (data.endereco_presencial && typeof data.endereco_presencial === 'object') {
        converted.enderecoPresencial = fromSnakeToCamel(data.endereco_presencial);
    }
    return converted;
}

export async function findAudienciaById(id: number): Promise<Result<Audiencia | null>> {
    try {
        const db = createDbClient();
        const { data, error } = await db
            .from('audiencias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return ok(null);
            }
            console.error('Error finding audiencia by id:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao buscar audiência.', { code: error.code }));
        }

        return ok(data ? converterParaAudiencia(data) : null);
    } catch (e: any) {
        console.error('Unexpected error finding audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao buscar audiência.', { originalError: e.message }));
    }
}

export async function findAllAudiencias(params: ListarAudienciasParams): Promise<Result<PaginatedResponse<Audiencia>>> {
    try {
        const db = createDbClient();
        let query = db.from('audiencias').select('*', { count: 'exact' });

        if (params.busca) {
            query = query.or(
                `numero_processo.ilike.%${params.busca}%,` +
                `polo_ativo_nome.ilike.%${params.busca}%,` +
                `polo_passivo_nome.ilike.%${params.busca}%,` +
                `observacoes.ilike.%${params.busca}%`
            );
        }

        if (params.trt) query = query.eq('trt', params.trt);
        if (params.grau) query = query.eq('grau', params.grau);
        if (params.status) query = query.eq('status', params.status);
        if (params.modalidade) query = query.eq('modalidade', params.modalidade);
        if (params.tipoAudienciaId) query = query.eq('tipo_audiencia_id', params.tipoAudienciaId);

        if (params.responsavelId === 'null' || params.semResponsavel) {
            query = query.is('responsavel_id', null);
        } else if (params.responsavelId) {
            query = query.eq('responsavel_id', params.responsavelId);
        }

        if (params.dataInicioInicio) query = query.gte('data_inicio', params.dataInicioInicio);
        if (params.dataInicioFim) query = query.lte('data_inicio', params.dataInicioFim);
        if (params.dataFimInicio) query = query.gte('data_fim', params.dataFimInicio);
        if (params.dataFimFim) query = query.lte('data_fim', params.dataFimFim);

        const page = params.pagina || 1;
        const limit = params.limite || 10;
        const offset = (page - 1) * limit;

        query = query.range(offset, offset + limit - 1);

        const sortBy = params.ordenarPor || 'dataInicio';
        const ascending = params.ordem ? params.ordem === 'asc' : true;
        query = query.order(fromCamelToSnake(sortBy) as string, { ascending });

        const { data, error, count } = await query;

        if (error) {
            console.error('Error finding all audiencias:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao listar audiências.', { code: error.code }));
        }

        const total = count || 0;
        const totalPages = total ? Math.ceil(total / limit) : 1;

        return ok({
            data: data.map(converterParaAudiencia),
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (e: any) {
        console.error('Unexpected error finding all audiencias:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao listar audiências.', { originalError: e.message }));
    }
}

export async function processoExists(processoId: number): Promise<Result<boolean>> {
    try {
        const db = createDbClient();
        const { data, error } = await db
            .from('processos')
            .select('id')
            .eq('id', processoId)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error checking processo existence:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao verificar processo.', { code: error.code }));
        }
        return ok(!!data);
    } catch (e: any) {
        console.error('Unexpected error checking processo existence:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar processo.', { originalError: e.message }));
    }
}

export async function tipoAudienciaExists(tipoId: number): Promise<Result<boolean>> {
    try {
        const db = createDbClient();
        const { data, error } = await db
            .from('tipos_audiencia')
            .select('id')
            .eq('id', tipoId)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking tipo_audiencia existence:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao verificar tipo de audiência.', { code: error.code }));
        }
        return ok(!!data);
    } catch (e: any) {
        console.error('Unexpected error checking tipo_audiencia existence:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar tipo de audiência.', { originalError: e.message }));
    }
}

export async function saveAudiencia(input: Partial<Audiencia>): Promise<Result<Audiencia>> {
    try {
        const db = createDbClient();
        const snakeInput = fromCamelToSnake(input) as Record<string, any>;
        const { data, error } = await db
            .from('audiencias')
            .insert(snakeInput)
            .select()
            .single();

        if (error) {
            console.error('Error saving audiencia:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao salvar audiência.', { code: error.code }));
        }
        return ok(converterParaAudiencia(data));
    } catch (e: any) {
        console.error('Unexpected error saving audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao salvar audiência.', { originalError: e.message }));
    }
}

export async function updateAudiencia(id: number, input: Partial<Audiencia>, audienciaExistente: Audiencia): Promise<Result<Audiencia>> {
    try {
        const db = createDbClient();
        const snakeInput = fromCamelToSnake(input) as Record<string, any>;
        // Preserve previous state for auditing
        snakeInput.dados_anteriores = fromCamelToSnake(audienciaExistente);

        const { data, error } = await db
            .from('audiencias')
            .update(snakeInput)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating audiencia:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao atualizar audiência.', { code: error.code }));
        }
        return ok(converterParaAudiencia(data));
    } catch (e: any) {
        console.error('Unexpected error updating audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar audiência.', { originalError: e.message }));
    }
}

export async function atualizarStatus(id: number, status: StatusAudiencia, statusDescricao?: string): Promise<Result<Audiencia>> {
    try {
        const db = createDbClient();
        const updateData: Partial<AudienciaRow> = { status };
        if (statusDescricao) {
            updateData.status_descricao = statusDescricao;
        }
        const { data, error } = await db
            .from('audiencias')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating audiencia status:', error);
            return err(appError('DATABASE_ERROR', 'Erro ao atualizar status da audiência.', { code: error.code }));
        }
        return ok(converterParaAudiencia(data));
    } catch (e: any) {
        console.error('Unexpected error updating audiencia status:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar status da audiência.', { originalError: e.message }));
    }
}
