/**
 * CHAT FEATURE - Service
 *
 * Camada de lógica de negócio do módulo de chat.
 * Contém validações, regras de negócio e orquestração de operações.
 */

import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  CriarSalaChatInput,
  ListarSalasParams,
  PaginatedResponse,
} from './domain';
import { criarSalaChatSchema, criarMensagemChatSchema, TipoSalaChat } from './domain';
import { ChatRepository, createChatRepository } from './repository';

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Service para operações de negócio do chat
 */
export class ChatService {
  constructor(private repository: ChatRepository) {}

  // ===========================================================================
  // SALAS
  // ===========================================================================

  /**
   * Cria uma nova sala de chat.
   *
   * INVARIANTE: Salas do tipo TipoSalaChat.Geral não podem ser criadas através
   * desta função. A Sala Geral deve ser criada apenas via seed/migração e deve
   * ter o nome canônico 'Sala Geral'. Existe apenas uma Sala Geral por sistema.
   *
   * Para salas privadas, verifica se já existe uma conversa 1-para-1 entre os
   * dois usuários antes de criar uma nova, evitando duplicidade.
   */
  async criarSala(
    input: CriarSalaChatInput,
    usuarioId: number
  ): Promise<Result<SalaChat, z.ZodError | Error>> {
    const validation = criarSalaChatSchema.safeParse(input);
    if (!validation.success) return err(validation.error);

    // Validação: não permitir criar sala geral
    // A Sala Geral já existe e é criada apenas via seed/migração
    if (validation.data.tipo === TipoSalaChat.Geral) {
      return err(new Error('Sala Geral não pode ser criada. Use buscarSalaGeral().'));
    }

    // Para conversas privadas, verificar se já existe sala entre os dois usuários
    if (validation.data.tipo === TipoSalaChat.Privado && validation.data.participanteId) {
      const salaExistenteResult = await this.repository.findPrivateSalaBetweenUsers(
        usuarioId,
        validation.data.participanteId
      );

      if (salaExistenteResult.isErr()) {
        return err(salaExistenteResult.error);
      }

      if (salaExistenteResult.value) {
        // Sala privada já existe, retornar a existente ao invés de criar nova
        return ok(salaExistenteResult.value);
      }
    }

    return this.repository.saveSala({
      ...validation.data,
      criadoPor: usuarioId,
    });
  }

  /**
   * Busca uma sala por ID
   */
  async buscarSala(id: number): Promise<Result<SalaChat | null, Error>> {
    if (id <= 0) return err(new Error('ID inválido.'));
    return this.repository.findSalaById(id);
  }

  /**
   * Busca a Sala Geral do sistema
   */
  async buscarSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    return this.repository.findSalaGeral();
  }

  /**
   * Lista salas do usuário com paginação
   */
  async listarSalasDoUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<SalaChat>, Error>> {
    return this.repository.findSalasByUsuario(usuarioId, params);
  }

  /**
   * Atualiza o nome de uma sala (apenas grupos)
   */
  async atualizarNomeSala(
    id: number,
    nome: string,
    usuarioId: number
  ): Promise<Result<SalaChat, Error>> {
    const salaResult = await this.repository.findSalaById(id);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    const sala = salaResult.value;

    // Apenas grupos podem ter nome editado
    if (sala.tipo !== TipoSalaChat.Grupo) {
      return err(new Error('Apenas grupos podem ter o nome editado.'));
    }

    // Apenas criador pode editar
    if (sala.criadoPor !== usuarioId) {
      return err(new Error('Apenas o criador pode editar o nome do grupo.'));
    }

    return this.repository.updateSala(id, { nome });
  }

  /**
   * Deleta uma sala
   */
  async deletarSala(id: number, usuarioId: number): Promise<Result<void, Error>> {
    const salaResult = await this.repository.findSalaById(id);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    const sala = salaResult.value;

    // Não permitir deletar sala geral
    if (sala.tipo === TipoSalaChat.Geral) {
      return err(new Error('Sala Geral não pode ser deletada.'));
    }

    // Apenas criador pode deletar
    if (sala.criadoPor !== usuarioId) {
      return err(new Error('Apenas o criador pode deletar a sala.'));
    }

    return this.repository.deleteSala(id);
  }

  // ===========================================================================
  // MENSAGENS
  // ===========================================================================

  /**
   * Envia uma mensagem para uma sala
   */
  async enviarMensagem(
    input: z.infer<typeof criarMensagemChatSchema>,
    usuarioId: number
  ): Promise<Result<MensagemChat, z.ZodError | Error>> {
    const validation = criarMensagemChatSchema.safeParse(input);
    if (!validation.success) return err(validation.error);

    // Verificar se sala existe
    const salaResult = await this.repository.findSalaById(validation.data.salaId);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    // Salvar mensagem (Supabase Realtime dispara evento automaticamente)
    return this.repository.saveMensagem({
      ...validation.data,
      usuarioId,
    });
  }

  /**
   * Busca histórico de mensagens de uma sala
   */
  async buscarHistoricoMensagens(
    salaId: number,
    limite: number = 50,
    antesDe?: string
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    return this.repository.findMensagensBySala({
      salaId,
      limite,
      antesDe,
    });
  }

  /**
   * Busca últimas mensagens de uma sala
   */
  async buscarUltimasMensagens(
    salaId: number,
    limite: number = 50
  ): Promise<Result<MensagemComUsuario[], Error>> {
    return this.repository.findUltimasMensagens(salaId, limite);
  }

  /**
   * Deleta uma mensagem (soft delete)
   */
  async deletarMensagem(id: number, _usuarioId: number): Promise<Result<void, Error>> {
    // TODO: Verificar se usuário é dono da mensagem
    void _usuarioId; // Reserved for future authorization check
    return this.repository.softDeleteMensagem(id);
  }
}

// =============================================================================
// FACTORY FUNCTION & STANDALONE FUNCTIONS
// =============================================================================

/**
 * Cria uma instância do ChatService com repository configurado
 * Use esta função em Server Components/Actions onde você pode usar await
 */
export async function createChatService(): Promise<ChatService> {
  const repository = await createChatRepository();
  return new ChatService(repository);
}
