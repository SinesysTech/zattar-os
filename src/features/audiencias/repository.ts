import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/lib/types';
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error finding audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao buscar audiência.', { originalError: message }));
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error finding all audiencias:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao listar audiências.', { originalError: message }));
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error checking processo existence:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar processo.', { originalError: message }));
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error checking tipo_audiencia existence:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar tipo de audiência.', { originalError: message }));
    }
}

export async function saveAudiencia(input: Partial<Audiencia>): Promise<Result<Audiencia>> {
    try {
        const db = createDbClient();
        const snakeInput = fromCamelToSnake(input) as Record<string, unknown>;
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error saving audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao salvar audiência.', { originalError: message }));
    }
}

export async function updateAudiencia(id: number, input: Partial<Audiencia>, audienciaExistente: Audiencia): Promise<Result<Audiencia>> {
    try {
        const db = createDbClient();
        const snakeInput = fromCamelToSnake(input) as Record<string, unknown>;
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error updating audiencia:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar audiência.', { originalError: message }));
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Unexpected error updating audiencia status:', e);
        return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar status da audiência.', { originalError: message }));
    }
}

// ============================================================================
// AI Agent Persistence (migrado de backend/audiencias/services/persistence)
// ============================================================================

import type { AudienciaClienteCpfRow } from './types/ai-agent.types';

export interface BuscarAudienciasPorCpfResult {
  cliente: {
    id: number;
    nome: string;
    cpf: string;
  } | null;
  audiencias: AudienciaClienteCpfRow[];
}

export async function buscarAudienciasPorCpf(
  cpf: string
): Promise<BuscarAudienciasPorCpfResult> {
  const supabase = createDbClient(); // Usando createDbClient do FSD

  // Normalizar CPF (remover formatação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  console.log('🔍 [BuscarAudienciasCPF] Buscando audiências para CPF:', cpfNormalizado);

  // Buscar cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('cpf', cpfNormalizado)
    .eq('ativo', true)
    .single();

  if (errorCliente || !cliente) {
    console.log('ℹ️ [BuscarAudienciasCPF] Cliente não encontrado:', cpfNormalizado);
    return { cliente: null, audiencias: [] };
  }

  // Buscar processo_partes do cliente
  const { data: participacoes, error: errorPart } = await supabase
    .from('processo_partes')
    .select('processo_id, tipo_parte, polo')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', cliente.id);

  if (errorPart || !participacoes || participacoes.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma participação encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Buscar audiências dos processos
  const processoIds = participacoes.map(p => p.processo_id);

  const { data: audienciasData, error: errorAudiencias } = await supabase
    .from('audiencias')
    .select(`
      id,
      id_pje,
      numero_processo,
      trt,
      grau,
      data_inicio,
      data_fim,
      hora_inicio,
      hora_fim,
      status,
      status_descricao,
      modalidade,
      url_audiencia_virtual,
      endereco_presencial,
      presenca_hibrida,
      polo_ativo_nome,
      polo_passivo_nome,
      segredo_justica,
      observacoes,
      sala_audiencia_nome,
      processo_id,
      tipo_audiencia!tipo_audiencia_id(descricao),
      orgao_julgador!orgao_julgador_id(descricao),
      classe_judicial!classe_judicial_id(descricao)
    `)
    .in('processo_id', processoIds)
    .order('data_inicio', { ascending: true });

  if (errorAudiencias) {
    console.error('❌ [BuscarAudienciasCPF] Erro ao buscar audiências:', errorAudiencias);
    throw new Error(`Erro ao buscar audiências: ${errorAudiencias.message}`);
  }

  if (!audienciasData || audienciasData.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma audiência encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Mapear para formato esperado
  const audiencias: AudienciaClienteCpfRow[] = audienciasData.map(aud => {
    const participacao = participacoes.find(p => p.processo_id === aud.processo_id);

    return {
      audiencia_id: aud.id,
      id_pje: aud.id_pje,
      numero_processo: aud.numero_processo,
      trt: aud.trt,
      grau: aud.grau as 'primeiro_grau' | 'segundo_grau',
      data_inicio: aud.data_inicio,
      data_fim: aud.data_fim,
      hora_inicio: aud.hora_inicio,
      hora_fim: aud.hora_fim,
      status: aud.status,
      status_descricao: aud.status_descricao,
      modalidade: aud.modalidade as 'virtual' | 'presencial' | 'hibrida' | null,
      url_audiencia_virtual: aud.url_audiencia_virtual,
      endereco_presencial: aud.endereco_presencial as Record<string, unknown> | null,
      presenca_hibrida: aud.presenca_hibrida as 'advogado' | 'cliente' | null,
      polo_ativo_nome: aud.polo_ativo_nome,
      polo_passivo_nome: aud.polo_passivo_nome,
      segredo_justica: aud.segredo_justica,
      observacoes: aud.observacoes,
      tipo_audiencia_descricao: (aud.tipo_audiencia as unknown as { descricao: string } | null)?.descricao || null,
      orgao_julgador_descricao: (aud.orgao_julgador as unknown as { descricao: string } | null)?.descricao || null,
      sala_audiencia_nome: aud.sala_audiencia_nome,
      classe_judicial_descricao: (aud.classe_judicial as unknown as { descricao: string } | null)?.descricao || null,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      cpf: cliente.cpf,
      tipo_parte: participacao?.tipo_parte || 'OUTRO',
      polo: participacao?.polo || 'NEUTRO',
    };
  });

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
    },
    audiencias,
  };
}
