/**
 * CHAT FEATURE - Rooms Repository
 *
 * Repositório para operações de persistência de salas de chat.
 * Responsabilidades:
 * - CRUD de salas (create, read, update, delete)
 * - Buscar sala geral
 * - Listar salas do usuário com paginação
 * - Arquivar/desarquivar salas
 * - Buscar salas privadas entre usuários
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import { fromCamelToSnake } from "@/lib/utils";
import type {
  SalaChat,
  ListarSalasParams,
  PaginatedResponse,
  ChatItem,
  UsuarioChat,
  SalaChatRow,
  UsuarioChatRow,
} from "../domain";
import { converterParaSalaChat } from "./shared/converters";

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

/**
 * Repository para operações de persistência de salas
 */
export class RoomsRepository {
  constructor(private supabase: SupabaseClient) {}

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
   * Filtra apenas salas onde o usuário é membro ativo (soft delete por usuário)
   */
  async findSalasByUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<ChatItem>, Error>> {
    try {
      // Primeiro, buscar IDs de salas onde o usuário é membro ativo
      const { data: membrosData, error: membrosError } = await this.supabase
        .from("membros_sala_chat")
        .select("sala_id")
        .eq("usuario_id", usuarioId)
        .eq("is_active", true);

      if (membrosError) {
        console.error("Erro ao buscar membros:", membrosError);
        return err(new Error("Erro ao buscar conversas."));
      }

      const salasAtivasIds = membrosData?.map((m) => m.sala_id) || [];

      // Se não há salas ativas, retornar lista vazia
      if (salasAtivasIds.length === 0) {
        return ok({
          data: [],
          pagination: {
            currentPage: 1,
            pageSize: params.limite || 50,
            totalCount: 0,
            totalPages: 1,
          },
        });
      }

      // Query para buscar detalhes das salas ativas
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
            avatar_url, online_status, last_seen
          ),
          participante:usuarios!salas_chat_participante_id_fkey(
            id, nome_completo, nome_exibicao, email_corporativo,
            avatar_url, online_status, last_seen
          )
        `,
          { count: "exact" }
        )
        // Filtrar apenas salas onde o usuário é membro ativo
        .in("id", salasAtivasIds);

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
              onlineStatus:
                (displayUser.online_status as "online" | "away" | "offline") ||
                "offline",
              lastSeen: displayUser.last_seen ?? undefined,
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
   * Deleta uma sala (hard delete - use apenas para admin ou cleanup)
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
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Cria uma instância do RoomsRepository com cliente Supabase
 */
export async function createRoomsRepository(): Promise<RoomsRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new RoomsRepository(supabase);
}
