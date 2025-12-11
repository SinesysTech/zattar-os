/**
 * CHAT FEATURE - Repository
 *
 * Camada de acesso a dados do módulo de chat.
 * Usa Supabase como fonte de dados e retorna Result<T, Error> para error handling.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from 'neverthrow';
import { createClient } from '@/lib/supabase/server';
import { fromSnakeToCamel, fromCamelToSnake } from '@/lib/utils';
import type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  ListarSalasParams,
  ListarMensagensParams,
  PaginatedResponse,
} from './types';

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

type SalaChatRow = Record<string, unknown>;
type MensagemChatRow = Record<string, unknown>;

function converterParaSalaChat(data: SalaChatRow): SalaChat {
  return fromSnakeToCamel(data) as unknown as SalaChat;
}

function converterParaMensagemChat(data: MensagemChatRow): MensagemChat {
  return fromSnakeToCamel(data) as unknown as MensagemChat;
}

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

/**
 * Repository para operações de persistência do chat
 */
export class ChatRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ===========================================================================
  // SALAS
  // ===========================================================================

  /**
   * Busca uma sala por ID
   */
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
    } catch {
      return err(new Error('Erro inesperado ao buscar sala.'));
    }
  }

  /**
   * Busca a Sala Geral do sistema
   */
  async findSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('salas_chat')
        .select('*')
        .eq('tipo', 'geral')
        .eq('nome', 'Sala Geral')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return err(new Error('Erro ao buscar Sala Geral.'));
      }

      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error('Erro inesperado ao buscar Sala Geral.'));
    }
  }

  /**
   * Lista salas do usuário com paginação
   */
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
    } catch {
      return err(new Error('Erro inesperado ao listar salas.'));
    }
  }

  /**
   * Cria uma nova sala
   */
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
    } catch {
      return err(new Error('Erro inesperado ao criar sala.'));
    }
  }

  /**
   * Atualiza uma sala existente
   */
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
    } catch {
      return err(new Error('Erro inesperado ao atualizar sala.'));
    }
  }

  /**
   * Deleta uma sala
   */
  async deleteSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase.from('salas_chat').delete().eq('id', id);

      if (error) return err(new Error('Erro ao deletar sala.'));
      return ok(undefined);
    } catch {
      return err(new Error('Erro inesperado ao deletar sala.'));
    }
  }

  /**
   * Busca sala privada existente entre dois usuários
   */
  async findPrivateSalaBetweenUsers(
    criadorId: number,
    participanteId: number
  ): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('salas_chat')
        .select('*')
        .eq('tipo', 'privado')
        .or(
          `and(criado_por.eq.${criadorId},participante_id.eq.${participanteId}),` +
            `and(criado_por.eq.${participanteId},participante_id.eq.${criadorId})`
        )
        .maybeSingle();

      if (error) {
        return err(new Error('Erro ao buscar sala privada existente.'));
      }

      return ok(data ? converterParaSalaChat(data) : null);
    } catch {
      return err(new Error('Erro inesperado ao buscar sala privada.'));
    }
  }

  // ===========================================================================
  // MENSAGENS
  // ===========================================================================

  /**
   * Lista mensagens de uma sala com paginação
   */
  async findMensagensBySala(
    params: ListarMensagensParams
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    try {
      let query = this.supabase
        .from('mensagens_chat')
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `,
          { count: 'exact' }
        )
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
        data: (data as unknown as MensagemComUsuario[]).map(
          (msg) => fromSnakeToCamel(msg) as MensagemComUsuario
        ),
        pagination: {
          currentPage: 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: 1,
        },
      });
    } catch {
      return err(new Error('Erro inesperado ao buscar mensagens.'));
    }
  }

  /**
   * Busca últimas N mensagens de uma sala (ordem cronológica)
   */
  async findUltimasMensagens(
    salaId: number,
    limite: number
  ): Promise<Result<MensagemComUsuario[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from('mensagens_chat')
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `
        )
        .eq('sala_id', salaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) return err(new Error('Erro ao buscar últimas mensagens.'));

      const mensagens = (data as unknown as MensagemComUsuario[])
        .map((msg) => fromSnakeToCamel(msg) as MensagemComUsuario)
        .reverse();

      return ok(mensagens);
    } catch {
      return err(new Error('Erro inesperado ao buscar últimas mensagens.'));
    }
  }

  /**
   * Salva uma nova mensagem
   */
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
    } catch {
      return err(new Error('Erro inesperado ao salvar mensagem.'));
    }
  }

  /**
   * Soft delete de uma mensagem
   */
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
    } catch {
      return err(new Error('Erro inesperado ao deletar mensagem.'));
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Cria uma instância do ChatRepository com cliente Supabase
 * Use esta função em Server Components/Actions onde você pode usar await
 */
export async function createChatRepository(): Promise<ChatRepository> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  return new ChatRepository(supabase);
}
