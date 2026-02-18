/**
 * CHAT FEATURE - Members Repository
 *
 * Repositório para operações de persistência de membros de salas e participantes de chamadas.
 * Responsabilidades:
 * - Gerenciamento de membros de salas
 * - Gerenciamento de participantes de chamadas
 * - Soft delete e restauração por usuário
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "neverthrow";
import type { ChamadaParticipante, ChamadaParticipanteRow } from "../domain";
import { converterParaChamadaParticipante } from "./shared/converters";

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

/**
 * Repository para operações de persistência de membros e participantes
 */
export class MembersRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===========================================================================
  // MEMBROS DE SALA (Soft Delete por Usuário)
  // ===========================================================================

  /**
   * Adiciona um membro a uma sala.
   * Usa insert ao invés de upsert para evitar conflitos com RLS UPDATE policy.
   * Se o membro já existe, trata como sucesso (idempotente).
   * Se já existe mas está inativo, reativa via update separado.
   */
  async addMembro(salaId: number, usuarioId: number): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .insert({
          sala_id: salaId,
          usuario_id: usuarioId,
          is_active: true,
        });

      if (error) {
        // Unique constraint violation = membro já existe
        if (error.code === "23505") {
          // Reativar se estava inativo
          await this.supabase
            .from("membros_sala_chat")
            .update({ is_active: true, deleted_at: null })
            .eq("sala_id", salaId)
            .eq("usuario_id", usuarioId);
          return ok(undefined);
        }
        console.error("[Chat] Erro addMembro:", { salaId, usuarioId, code: error.code, message: error.message });
        return err(new Error(`Erro ao adicionar membro à sala: ${error.message}`));
      }
      return ok(undefined);
    } catch (e) {
      console.error("[Chat] Erro inesperado addMembro:", e);
      return err(new Error("Erro inesperado ao adicionar membro."));
    }
  }

  /**
   * Soft delete de uma conversa para um usuário específico
   * A conversa continua existindo para outros membros
   */
  async softDeleteSalaParaUsuario(
    salaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId);

      if (error) {
        console.error("Erro softDeleteSalaParaUsuario:", error);
        return err(new Error("Erro ao remover conversa."));
      }
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao remover conversa."));
    }
  }

  /**
   * Restaura uma conversa para um usuário (desfaz soft delete)
   */
  async restaurarSalaParaUsuario(
    salaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("membros_sala_chat")
        .update({
          is_active: true,
          deleted_at: null,
        })
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao restaurar conversa."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao restaurar conversa."));
    }
  }

  /**
   * Verifica se o usuário é membro ativo de uma sala
   */
  async isMembroAtivo(
    salaId: number,
    usuarioId: number
  ): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("membros_sala_chat")
        .select("is_active")
        .eq("sala_id", salaId)
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      if (error) return err(new Error("Erro ao verificar membro."));
      return ok(data?.is_active ?? false);
    } catch {
      return err(new Error("Erro inesperado ao verificar membro."));
    }
  }

  // ===========================================================================
  // PARTICIPANTES DA CHAMADA
  // ===========================================================================

  /**
   * Adiciona participante
   */
  async addParticipante(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .insert({
          chamada_id: chamadaId,
          usuario_id: usuarioId,
          aceitou: null, // Pendente
        });

      if (error) {
        // Ignora erro se já existe (unique constraint)
        if (error.code === "23505") return ok(undefined);
        return err(new Error("Erro ao adicionar participante."));
      }
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao adicionar participante."));
    }
  }

  /**
   * Responde convite de chamada (aceitar/recusar)
   */
  async responderChamada(
    chamadaId: number,
    usuarioId: number,
    aceitou: boolean
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          aceitou,
          respondeu_em: new Date().toISOString(),
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao responder chamada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao responder chamada."));
    }
  }

  /**
   * Registra entrada na chamada
   */
  async registrarEntrada(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          entrou_em: new Date().toISOString(),
          aceitou: true, // Confirma aceitação se entrar
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao registrar entrada."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao registrar entrada."));
    }
  }

  /**
   * Registra saída da chamada
   */
  async registrarSaida(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    try {
      // Primeiro busca data de entrada para calcular duração
      const { data, error: fetchError } = await this.supabase
        .from("chamadas_participantes")
        .select("entrou_em")
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId)
        .single();

      if (fetchError)
        return err(new Error("Erro ao buscar dados do participante."));

      const saiuEm = new Date();
      let duracao = 0;

      if (data?.entrou_em) {
        const entrouEm = new Date(data.entrou_em);
        duracao = Math.floor((saiuEm.getTime() - entrouEm.getTime()) / 1000);
      }

      const { error } = await this.supabase
        .from("chamadas_participantes")
        .update({
          saiu_em: saiuEm.toISOString(),
          duracao_segundos: duracao,
        })
        .eq("chamada_id", chamadaId)
        .eq("usuario_id", usuarioId);

      if (error) return err(new Error("Erro ao registrar saída."));
      return ok(undefined);
    } catch {
      return err(new Error("Erro inesperado ao registrar saída."));
    }
  }

  /**
   * Busca participantes de uma chamada
   */
  async findParticipantesByChamada(
    chamadaId: number
  ): Promise<Result<ChamadaParticipante[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from("chamadas_participantes")
        .select("*")
        .eq("chamada_id", chamadaId);

      if (error) return err(new Error("Erro ao buscar participantes."));

      return ok(
        (data as ChamadaParticipanteRow[]).map(converterParaChamadaParticipante)
      );
    } catch {
      return err(new Error("Erro inesperado ao buscar participantes."));
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Cria uma instância do MembersRepository com cliente Supabase
 */
export async function createMembersRepository(): Promise<MembersRepository> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return new MembersRepository(supabase);
}
