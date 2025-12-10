import { SupabaseClient } from ' @supabase/supabase-js';
import { Result, ok, err } from 'neverthrow';
import { Database } from ' @/lib/database.types';
import { getSupabase } from ' @/core/app/_lib/supabase';
import { fromSnakeToCamel, fromCamelToSnake } from ' @/lib/utils';
import {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  ListarSalasParams,
  ListarMensagensParams,
} from './domain';
import { PaginatedResponse } from ' @/core/types';

type SalaChatRow = Database['public']['Tables']['salas_chat']['Row'];
type MensagemChatRow = Database['public']['Tables']['mensagens_chat']['Row'];

function converterParaSalaChat(data: SalaChatRow): SalaChat {
  return fromSnakeToCamel(data) as unknown as SalaChat;
}

function converterParaMensagemChat(data: MensagemChatRow): MensagemChat {
  return fromSnakeToCamel(data) as unknown as MensagemChat;
}

export class ChatRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase || getSupabase();
  }

  // ========== SALAS ==========
  
  async findSalaById(id: number): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('salas_chat')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return err(new Error('Erro ao buscar sala de chat.'));
      }

      return ok(converterParaSalaChat(data));
    } catch (e) {
      return err(new Error('Erro inesperado ao buscar sala.'));
    }
  }

  async findSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('salas_chat')
        .select('*')
        .eq('tipo', 'geral')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return err(new Error('Erro ao buscar Sala Geral.'));
      }

      return ok(converterParaSalaChat(data));
    } catch (e) {
      return err(new Error('Erro inesperado ao buscar Sala Geral.'));
    }
  }

  async findSalasByUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<SalaChat>, Error>> {
    try {
      let query = this.supabase
        .from('salas_chat')
        .select('*', { count: 'exact' })
        .or(`tipo.eq.geral,criado_por.eq.${usuarioId},participante_id.eq.${usuarioId}`);

      if (params.tipo) query = query.eq('tipo', params.tipo);
      if (params.documentoId) query = query.eq('documento_id', params.documentoId);

      const limite = params.limite || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limite - 1);
      query = query.order('updated_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) return err(new Error('Erro ao listar salas.'));

      return ok({
        data: data.map(converterParaSalaChat),
        pagination: {
          currentPage: Math.floor(offset / limite) + 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: count ? Math.ceil(count / limite) : 1,
        },
      });
    } catch (e) {
      return err(new Error('Erro inesperado ao listar salas.'));
    }
  }

  async saveSala(input: Partial<SalaChat>): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from('salas_chat')
        .insert(snakeInput)
        .select()
        .single();

      if (error) return err(new Error('Erro ao criar sala.'));
      return ok(converterParaSalaChat(data));
    } catch (e) {
      return err(new Error('Erro inesperado ao criar sala.'));
    }
  }

  async updateSala(id: number, input: Partial<SalaChat>): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from('salas_chat')
        .update(snakeInput)
        .eq('id', id)
        .select()
        .single();

      if (error) return err(new Error('Erro ao atualizar sala.'));
      return ok(converterParaSalaChat(data));
    } catch (e) {
      return err(new Error('Erro inesperado ao atualizar sala.'));
    }
  }

  async deleteSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from('salas_chat')
        .delete()
        .eq('id', id);

      if (error) return err(new Error('Erro ao deletar sala.'));
      return ok(undefined);
    } catch (e) {
      return err(new Error('Erro inesperado ao deletar sala.'));
    }
  }

  // ========== MENSAGENS ==========

  async findMensagensBySala(
    params: ListarMensagensParams
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    try {
      let query = this.supabase
        .from('mensagens_chat')
        .select(`
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `, { count: 'exact' })
        .eq('sala_id', params.salaId)
        .is('deleted_at', null);

      if (params.antesDe) {
        query = query.lt('created_at', params.antesDe);
      }

      const limite = params.limite || 50;
      query = query.order('created_at', { ascending: true }).limit(limite);

      const { data, error, count } = await query;

      if (error) return err(new Error('Erro ao buscar mensagens.'));

      return ok({
        data: (data as unknown as MensagemComUsuario[]).map(msg => fromSnakeToCamel(msg) as MensagemComUsuario),
        pagination: {
          currentPage: 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: 1,
        },
      });
    } catch (e) {
      return err(new Error('Erro inesperado ao buscar mensagens.'));
    }
  }

  async findUltimasMensagens(
    salaId: number,
    limite: number
  ): Promise<Result<MensagemComUsuario[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from('mensagens_chat')
        .select(`
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `)
        .eq('sala_id', salaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) return err(new Error('Erro ao buscar últimas mensagens.'));

      const mensagens = (data as unknown as MensagemComUsuario[])
        .map(msg => fromSnakeToCamel(msg) as MensagemComUsuario)
        .reverse();

      return ok(mensagens);
    } catch (e) {
      return err(new Error('Erro inesperado ao buscar últimas mensagens.'));
    }
  }

  async saveMensagem(input: Partial<MensagemChat>): Promise<Result<MensagemChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from('mensagens_chat')
        .insert(snakeInput)
        .select()
        .single();

      if (error) return err(new Error('Erro ao salvar mensagem.'));
      return ok(converterParaMensagemChat(data));
    } catch (e) {
      return err(new Error('Erro inesperado ao salvar mensagem.'));
    }
  }

  async softDeleteMensagem(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from('mensagens_chat')
        .update({
          deleted_at: new Date().toISOString(),
          conteudo: '[Mensagem deletada]',
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) return err(new Error('Erro ao deletar mensagem.'));
      return ok(undefined);
    } catch (e) {
      return err(new Error('Erro inesperado ao deletar mensagem.'));
    }
  }
}
