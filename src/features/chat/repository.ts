/**
 * CHAT FEATURE - Repository
 *
 * Camada de acesso a dados do módulo de chat.
 * Usa Supabase como fonte de dados e retorna Result<T, Error> para error handling.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import { fromSnakeToCamel, fromCamelToSnake } from "@/lib/utils";
import type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  ListarSalasParams,
  ListarMensagensParams,
  PaginatedResponse,
  ChatItem,
  UsuarioChat,
  SalaChatRow,
  MensagemChatRow,
  UsuarioChatRow,
} from "./domain";

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

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
        .from("salas_chat")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar sala de chat."));
      }

      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao buscar sala."));
    }
  }

  /**
   * Busca a Sala Geral do sistema
   */
  async findSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("salas_chat")
        .select("*")
        .eq("tipo", "geral")
        .eq("nome", "Sala Geral")
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return err(new Error("Erro ao buscar Sala Geral."));
      }

      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao buscar Sala Geral."));
    }
  }

  /**
   * Lista salas do usuário com paginação e dados expandidos
   */
  async findSalasByUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<ChatItem>, Error>> {
    try {
      // Query simplificada - a política RLS (usando SECURITY DEFINER functions)
      // já faz a verificação de acesso a documentos, evitando recursão circular.
      // Não precisamos fazer subquery adicional para documentos aqui.
      let query = this.supabase
        .from("salas_chat")
        .select(
          `
          *,
          last_message:mensagens_chat(
            conteudo,
            created_at,
            tipo
          ),
          criador:usuarios!salas_chat_criado_por_fkey(
            id, nome_completo, nome_exibicao, email_corporativo,
            avatar_url
          ),
          participante:usuarios!salas_chat_participante_id_fkey(
            id, nome_completo, nome_exibicao, email_corporativo,
            avatar_url
          )
        `,
          { count: "exact" }
        )
        // Filtro simplificado: RLS policy "Users can view accessible chat rooms"
        // já verifica acesso via user_has_document_access() para salas de documento
        .or(
          `tipo.eq.geral,criado_por.eq.${usuarioId},participante_id.eq.${usuarioId},tipo.eq.documento`
        );

      if (params.tipo) query = query.eq("tipo", params.tipo);
      if (params.documentoId)
        query = query.eq("documento_id", params.documentoId);

      // Filtro de arquivadas
      if (params.arquivadas !== undefined) {
        query = query.eq("is_archive", params.arquivadas);
      } else {
        // Por padrão não mostra arquivadas
        query = query.eq("is_archive", false);
      }

      const limite = params.limite || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limite - 1);

      // Ordenação: idealmente pela data da última mensagem, mas isso é complexo em SQL simples.
      // Vou ordenar por updated_at da sala.
      query = query.order("updated_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error(
          "Erro findSalasByUsuario:",
          JSON.stringify(error, null, 2)
        );
        return err(
          new Error(`Erro ao listar salas: ${error.message || "Unknown error"}`)
        );
      }

      // Processar dados para formato ChatItem
      const chatItems: ChatItem[] = data.map((row: SalaChatRow) => {
        const sala = converterParaSalaChat(row);
        const lastMsg = row.last_message?.[0]; // Supabase retorna array para relação 1:N

        // Determinar o "outro" usuário para exibir info
        let displayUser: UsuarioChatRow | null = null;
        if (sala.tipo === "privado") {
          if (row.criado_por === usuarioId) {
            displayUser = row.participante ?? null;
          } else {
            displayUser = row.criador ?? null;
          }
        } else {
          // Para grupos ou geral, pode mostrar criador ou null
          displayUser = row.criador ?? null; // Ex: admin do grupo
        }

        // Mapear usuario do DB para UsuarioChat
        const usuario: UsuarioChat | undefined = displayUser
          ? {
              id: displayUser.id,
              nomeCompleto: displayUser.nome_completo,
              nomeExibicao: displayUser.nome_exibicao,
              emailCorporativo: displayUser.email_corporativo,
              avatar: displayUser.avatar_url,
              email: displayUser.email_corporativo ?? undefined,
            }
          : undefined;

        // Formatar ChatItem
        return {
          ...sala,
          name:
            sala.tipo === "privado" && usuario
              ? usuario.nomeExibicao || usuario.nomeCompleto
              : sala.nome,
          image:
            sala.tipo === "privado" && usuario ? usuario.avatar : undefined, // TODO: imagem do grupo se tiver
          lastMessage: lastMsg?.conteudo || "",
          date: lastMsg?.created_at || sala.updatedAt,
          usuario: usuario,
          isArchive: row.is_archive || false,
        };
      });

      return ok({
        data: chatItems,
        pagination: {
          currentPage: Math.floor(offset / limite) + 1,
          pageSize: limite,
          totalCount: count || 0,
          totalPages: count ? Math.ceil(count / limite) : 1,
        },
      });
    } catch (e) {
      console.error(e);
      return err(new Error("Erro inesperado ao listar salas."));
    }
  }

  /**
   * Cria uma nova sala
   */
  async saveSala(input: Partial<SalaChat>): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from("salas_chat")
        .insert(snakeInput)
        .select()
        .single();

      if (error) return err(new Error("Erro ao criar sala."));
      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao criar sala."));
    }
  }

  /**
   * Atualiza uma sala existente
   */
  async updateSala(
    id: number,
    input: Partial<SalaChat>
  ): Promise<Result<SalaChat, Error>> {
    try {
      const snakeInput = fromCamelToSnake(input);
      const { data, error } = await this.supabase
        .from("salas_chat")
        .update(snakeInput)
        .eq("id", id)
        .select()
        .single();

      if (error) return err(new Error("Erro ao atualizar sala."));
      return ok(converterParaSalaChat(data));
    } catch {
      return err(new Error("Erro inesperado ao atualizar sala."));
    }
  }

  /**
   * Arquiva uma sala
   */
  async archiveSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .update({ is_archive: true })
        .eq("id", id);

      if (error) return err(new Error("Erro ao arquivar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao arquivar sala."));
    }
  }

  /**
   * Desarquiva uma sala
   */
  async unarchiveSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .update({ is_archive: false })
        .eq("id", id);

      if (error) return err(new Error("Erro ao desarquivar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao desarquivar sala."));
    }
  }

  /**
   * Lista salas arquivadas
   */
  async findArchivedSalas(
    usuarioId: number
  ): Promise<Result<SalaChat[], Error>> {
    // Reutiliza findSalasByUsuario com filtro arquivadas=true
    const result = await this.findSalasByUsuario(usuarioId, {
      arquivadas: true,
      limite: 100,
    });
    if (result.isOk()) {
      return ok(result.value.data);
    }
    return err(result.error);
  }

  /**
   * Deleta uma sala
   */
  async deleteSala(id: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("salas_chat")
        .delete()
        .eq("id", id);

      if (error) return err(new Error("Erro ao deletar sala."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao deletar sala."));
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
        .from("salas_chat")
        .select("*")
        .eq("tipo", "privado")
        .or(
          `and(criado_por.eq.${criadorId},participante_id.eq.${participanteId}),` +
            `and(criado_por.eq.${participanteId},participante_id.eq.${criadorId})`
        )
        .maybeSingle();

      if (error) {
        return err(new Error("Erro ao buscar sala privada existente."));
      }

      return ok(data ? converterParaSalaChat(data) : null);
    } catch {
      return err(new Error("Erro inesperado ao buscar sala privada."));
    }
  }

  // ===========================================================================
  // MENSAGENS
  // ===========================================================================

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
        const camelMsg = fromSnakeToCamel(msg) as MensagemComUsuario;
        // Mapear avatar
        if (msg.usuario) {
          camelMsg.usuario.avatar = msg.usuario.avatar_url;
        }
        // Determinar ownMessage
        if (currentUserId) {
          camelMsg.ownMessage = msg.usuario_id === currentUserId;
        }
        return camelMsg;
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
          const camelMsg = fromSnakeToCamel(msg) as MensagemComUsuario;
          if (msg.usuario) {
            camelMsg.usuario.avatar = msg.usuario.avatar_url;
          }
          if (currentUserId) {
            camelMsg.ownMessage = msg.usuario_id === currentUserId;
          }
          return camelMsg;
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
        console.error("Erro saveMensagem:", error);
        return err(new Error("Erro ao salvar mensagem."));
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

      if (error) return err(new Error("Erro ao atualizar status da mensagem."));
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
 * Cria uma instância do ChatRepository com cliente Supabase
 * Use esta função em Server Components/Actions onde você pode usar await
 */
export async function createChatRepository(): Promise<ChatRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new ChatRepository(supabase);
}
