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
  ChatItem,
  CriarSalaChatInput,
  ListarSalasParams,
  PaginatedResponse,
  MessageStatus,
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
        // Sala privada já existe - restaurar para o usuário se estava inativa
        await this.repository.restaurarSalaParaUsuario(salaExistenteResult.value.id, usuarioId);
        return ok(salaExistenteResult.value);
      }
    }

    // Criar a sala
    const salaResult = await this.repository.saveSala({
      ...validation.data,
      criadoPor: usuarioId,
    });

    if (salaResult.isErr()) return salaResult;

    const sala = salaResult.value;

    // Adicionar membros automaticamente
    // Criador é sempre membro
    await this.repository.addMembro(sala.id, usuarioId);

    // Para salas privadas, adicionar o participante também
    if (validation.data.tipo === TipoSalaChat.Privado && validation.data.participanteId) {
      await this.repository.addMembro(sala.id, validation.data.participanteId);
    }

    return ok(sala);
  }

  /**
   * Cria um novo grupo de chat com múltiplos membros.
   */
  async criarGrupo(
    nome: string,
    membrosIds: number[],
    criadorId: number
  ): Promise<Result<SalaChat, Error>> {
    if (!nome || nome.trim().length === 0) {
      return err(new Error('Nome do grupo é obrigatório.'));
    }

    if (!membrosIds || membrosIds.length === 0) {
      return err(new Error('Adicione pelo menos um membro ao grupo.'));
    }

    // Criar a sala do tipo Grupo
    const salaResult = await this.repository.saveSala({
      nome: nome.trim(),
      tipo: TipoSalaChat.Grupo,
      criadoPor: criadorId,
    });

    if (salaResult.isErr()) return salaResult;

    const sala = salaResult.value;

    // Adicionar o criador como membro
    await this.repository.addMembro(sala.id, criadorId);

    // Adicionar todos os membros selecionados
    for (const membroId of membrosIds) {
      if (membroId !== criadorId) {
        await this.repository.addMembro(sala.id, membroId);
      }
    }

    return ok(sala);
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
  ): Promise<Result<PaginatedResponse<ChatItem>, Error>> {
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
   * Arquiva uma sala
   */
  async arquivarSala(id: number, usuarioId: number): Promise<Result<void, Error>> {
    const salaResult = await this.repository.findSalaById(id);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    // TODO: Adicionar lógica mais refinada de permissão?
    // Por enquanto, apenas criador ou participante podem arquivar (mas is_archive é flag da sala ou relação user_sala?)
    // Se is_archive for na tabela salas_chat, afeta ambos. Se for tabela user_rooms, é individual.
    // O schema atual sugere ser na tabela salas_chat (simplificado).
    // Vou assumir que quem criou pode arquivar (como deletar).
    // Ou se for privado, qualquer um dos dois.
    // Dado o schema simplificado:
    const sala = salaResult.value;
    if (sala.criadoPor !== usuarioId && sala.participanteId !== usuarioId) {
       return err(new Error('Permissão negada para arquivar sala.'));
    }

    return this.repository.archiveSala(id);
  }

  /**
   * Desarquiva uma sala
   */
  async desarquivarSala(id: number, usuarioId: number): Promise<Result<void, Error>> {
    const salaResult = await this.repository.findSalaById(id);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    const sala = salaResult.value;
    if (sala.criadoPor !== usuarioId && sala.participanteId !== usuarioId) {
       return err(new Error('Permissão negada para desarquivar sala.'));
    }

    return this.repository.unarchiveSala(id);
  }

  /**
   * Lista salas arquivadas
   */
  async listarSalasArquivadas(
    usuarioId: number,
    _params: ListarSalasParams
  ): Promise<Result<SalaChat[], Error>> {
    return this.repository.findArchivedSalas(usuarioId);
  }

  /**
   * Remove uma conversa da lista do usuário (soft delete)
   * A conversa continua existindo para outros participantes
   */
  async removerConversa(salaId: number, usuarioId: number): Promise<Result<void, Error>> {
    const salaResult = await this.repository.findSalaById(salaId);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Conversa não encontrada.'));

    const sala = salaResult.value;

    // Não permitir remover Sala Geral (é obrigatória para todos)
    if (sala.tipo === TipoSalaChat.Geral) {
      return err(new Error('A Sala Geral não pode ser removida.'));
    }

    // Soft delete: marca como inativo apenas para este usuário
    return this.repository.softDeleteSalaParaUsuario(salaId, usuarioId);
  }

  /**
   * Restaura uma conversa removida para o usuário
   */
  async restaurarConversa(salaId: number, usuarioId: number): Promise<Result<void, Error>> {
    return this.repository.restaurarSalaParaUsuario(salaId, usuarioId);
  }

  /**
   * Deleta uma sala permanentemente (hard delete - apenas admin)
   * @deprecated Use removerConversa para soft delete por usuário
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

    // Apenas criador pode fazer hard delete
    if (sala.criadoPor !== usuarioId) {
      return err(new Error('Apenas o criador pode deletar permanentemente a sala.'));
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
      status: 'sent', // Default status
    });
  }

  /**
   * Envia uma mensagem com mídia (wrapper para validação extra se necessário)
   */
  async enviarMensagemComMidia(
    input: z.infer<typeof criarMensagemChatSchema>,
    usuarioId: number
  ): Promise<Result<MensagemChat, z.ZodError | Error>> {
    // Validações específicas de mídia poderiam estar aqui
    return this.enviarMensagem(input, usuarioId);
  }

  /**
   * Busca histórico de mensagens de uma sala
   */
  async buscarHistoricoMensagens(
    salaId: number,
    usuarioId: number,
    limite: number = 50,
    antesDe?: string
  ): Promise<Result<PaginatedResponse<MensagemComUsuario>, Error>> {
    return this.repository.findMensagensBySala({
      salaId,
      limite,
      antesDe,
    }, usuarioId);
  }

  /**
   * Busca últimas mensagens de uma sala
   */
  async buscarUltimasMensagens(
    salaId: number,
    usuarioId: number,
    limite: number = 50
  ): Promise<Result<MensagemComUsuario[], Error>> {
    return this.repository.findUltimasMensagens(salaId, limite, usuarioId);
  }

  /**
   * Atualiza o status de uma mensagem
   */
  async atualizarStatusMensagem(
    id: number,
    status: MessageStatus
  ): Promise<Result<void, Error>> {
    return this.repository.updateMessageStatus(id, status);
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