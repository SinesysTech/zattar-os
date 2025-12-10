import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from 'neverthrow';
import { Database } from '@/lib/database.types';
import { getSupabase } from '@/core/app/_lib/supabase';
import { fromSnakeToCamel, fromCamelToSnake } from '@/lib/utils';
import {
  Audiencia,
  ListarAudienciasParams,
} from './domain';
import { PaginatedResponse } from '@/core/types';

type AudienciaRow = Database['public']['Tables']['audiencias']['Row'];

function converterParaAudiencia(data: AudienciaRow): Audiencia {
  const converted = fromSnakeToCamel(data) as unknown as Audiencia;
  if (data.endereco_presencial && typeof data.endereco_presencial === 'object') {
    converted.enderecoPresencial = fromSnakeToCamel(data.endereco_presencial);
  }
  return converted;
}

export class AudienciasRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase || getSupabase();
  }

  async findAudienciaById(id: number): Promise<Result<Audiencia | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('audiencias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding audiencia by id:', error);
        return err(new Error('Erro ao buscar audiência.'));
      }

      return ok(data ? converterParaAudiencia(data) : null);
    } catch (e) {
      console.error('Unexpected error finding audiencia:', e);
      return err(new Error('Erro inesperado ao buscar audiência.'));
    }
  }

  async findAllAudiencias(params: ListarAudienciasParams): Promise<Result<PaginatedResponse<Audiencia>, Error>> {
    try {
      let query = this.supabase.from('audiencias').select('*', { count: 'exact' });

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

      const sortBy = params.ordenarPor || 'data_inicio';
      const ascending = params.ordem ? params.ordem === 'asc' : true;
      query = query.order(fromCamelToSnake(sortBy), { ascending });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error finding all audiencias:', error);
        return err(new Error('Erro ao listar audiências.'));
      }

      return ok({
        data: data.map(converterParaAudiencia),
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalCount: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 1,
        },
      });
    } catch (e) {
      console.error('Unexpected error finding all audiencias:', e);
      return err(new Error('Erro inesperado ao listar audiências.'));
    }
  }

  async processoExists(processoId: number): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('processos')
        .select('id')
        .eq('id', processoId)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking processo existence:', error);
        return err(new Error('Erro ao verificar processo.'));
      }
      return ok(!!data);
    } catch (e) {
      console.error('Unexpected error checking processo existence:', e);
      return err(new Error('Erro inesperado ao verificar processo.'));
    }
  }
  
  async tipoAudienciaExists(tipoId: number): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('tipos_audiencia')
        .select('id')
        .eq('id', tipoId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking tipo_audiencia existence:', error);
        return err(new Error('Erro ao verificar tipo de audiência.'));
      }
      return ok(!!data);
    } catch (e) {
      console.error('Unexpected error checking tipo_audiencia existence:', e);
      return err(new Error('Erro inesperado ao verificar tipo de audiência.'));
    }
  }

  async saveAudiencia(input: Partial<Audiencia>): Promise<Result<Audiencia, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from('audiencias')
        .insert(snakeInput)
        .select()
        .single();

      if (error) {
        console.error('Error saving audiencia:', error);
        return err(new Error('Erro ao salvar audiência.'));
      }
      return ok(converterParaAudiencia(data));
    } catch (e) {
      console.error('Unexpected error saving audiencia:', e);
      return err(new Error('Erro inesperado ao salvar audiência.'));
    }
  }
  
  async updateAudiencia(id: number, input: Partial<Audiencia>, audienciaExistente: Audiencia): Promise<Result<Audiencia, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      // Preserve previous state for auditing
      snakeInput.dados_anteriores = fromCamelToSnake(audienciaExistente);

      const { data, error } = await this.supabase
        .from('audiencias')
        .update(snakeInput)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating audiencia:', error);
        return err(new Error('Erro ao atualizar audiência.'));
      }
      return ok(converterParaAudiencia(data));
    } catch (e) {
      console.error('Unexpected error updating audiencia:', e);
      return err(new Error('Erro inesperado ao atualizar audiência.'));
    }
  }

  async atualizarStatus(id: number, status: string, statusDescricao?: string): Promise<Result<Audiencia, Error>> {
    try {
      const updateData: Partial<AudienciaRow> = { status };
      if (statusDescricao) {
        updateData.status_descricao = statusDescricao;
      }
      const { data, error } = await this.supabase
        .from('audiencias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating audiencia status:', error);
        return err(new Error('Erro ao atualizar status da audiência.'));
      }
      return ok(converterParaAudiencia(data));
    } catch (e) {
      console.error('Unexpected error updating audiencia status:', e);
      return err(new Error('Erro inesperado ao atualizar status da audiência.'));
    }
  }
}
