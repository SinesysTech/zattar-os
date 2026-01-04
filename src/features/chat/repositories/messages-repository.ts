/**
 * CHAT FEATURE - Messages Repository
 *
 * Repositório para operações de persistência de mensagens de chat.
 * Responsabilidades:
 * - CRUD de mensagens
 * - Listagem paginada com informações de usuário
 * - Atualização de status
 * - Soft delete
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import { fromCamelToSnake } from "@/lib/utils";
import type {
  MensagemChat,
  MensagemComUsuario,
  ListarMensagensParams,
  PaginatedResponse,
  MensagemChatRow,
} from "../domain";
import {
  converterParaMensagemChat,
  converterParaMensagemComUsuario,
} from "./shared/converters";

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

/**
 * Repository para operações de persistência de mensagens
 */
export class MessagesRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lista mensagens de uma sala com paginação e dados completos
   */
  async findMensagensBySala(
    params: ListarMensagensParams,
    currentUserId?: number
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    try {
      let query = this.supabase
        .from("mensagens_chat")
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo,
            avatar_url
          )
        `,
          { count: "exact" }
        )
        .eq("sala_id", params.salaId)
        .is("deleted_at", null);

      if (params.antesDe) {
        query = query.lt("created_at", params.antesDe);
      }

      const limite = params.limite || 50;
      query = query.order("created_at", { ascending: true }).limit(limite);

      const { data, error, count } = await query;

      if (error) return err(new Error("Erro ao buscar mensagens."));

      const mensagens = (data as MensagemChatRow[]).map((msg) => {
        return converterParaMensagemComUsuario(msg, currentUserId);
      });

      return ok({
        data: mensagens,
        pagination: {
          currentPage: 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: 1,
        },
      });
    } catch {
      return err(new Error("Erro inesperado ao buscar mensagens."));
    }
  }

  /**
   * Busca últimas N mensagens de uma sala (ordem cronológica)
   */
  async findUltimasMensagens(
    salaId: number,
    limite: number,
    currentUserId?: number
  ): Promise<Result<MensagemComUsuario[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from("mensagens_chat")
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo,
            avatar_url
          )
        `
        )
        .eq("sala_id", salaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) return err(new Error("Erro ao buscar últimas mensagens."));

      const mensagens = (data as MensagemChatRow[])
        .map((msg) => {
          return converterParaMensagemComUsuario(msg, currentUserId);
        })
        .reverse();

      return ok(mensagens);
    } catch {
      return err(new Error("Erro inesperado ao buscar últimas mensagens."));
    }
  }

  /**
   * Salva uma nova mensagem
   */
  async saveMensagem(
    input: Partial<MensagemChat>
  ): Promise<Result<MensagemChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);

      // Garantir status inicial
      if (!snakeInput.status) {
        snakeInput.status = "sent";
      }

      const { data, error } = await this.supabase
        .from("mensagens_chat")
        .insert(snakeInput)
        .select()
        .single();

      if (error) {
        console.error("Erro saveMensagem:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return err(new Error(`Erro ao salvar mensagem: ${error.message}`));
      }
      return ok(converterParaMensagemChat(data));
    } catch (e) {
      console.error(e);
      return err(new Error("Erro inesperado ao salvar mensagem."));
    }
  }

  /**
   * Atualiza status da mensagem
   */
  async updateMessageStatus(
    id: number,
    status: "sent" | "forwarded" | "read"
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("mensagens_chat")
        .update({ status })
        .eq("id", id);

      if (error)
        return err(new Error("Erro ao atualizar status da mensagem."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao atualizar status."));
    }
  }

  /**
   * Soft delete de uma mensagem
   */
  async softDeleteMensagem(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("mensagens_chat")
        .update({
          deleted_at: new Date().toISOString(),
          conteudo: "[Mensagem deletada]",
        })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) return err(new Error("Erro ao deletar mensagem."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao deletar mensagem."));
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Cria uma instância do MessagesRepository com cliente Supabase
 */
export async function createMessagesRepository(): Promise<MessagesRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new MessagesRepository(supabase);
}
