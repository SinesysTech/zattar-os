import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  criarSalaChatSchema,
  criarMensagemChatSchema,
  ListarSalasParams,
  ListarMensagensParams,
  TipoSalaChat,
} from './domain';
import { ChatRepository } from './repository';
import { PaginatedResponse } from ' @/core/types';

export class ChatService {
  constructor(private repository: ChatRepository) {}

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
    input: z.infer<typeof criarSalaChatSchema>,
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

  async buscarSala(id: number): Promise<Result<SalaChat | null, Error>> {
    if (id <= 0) return err(new Error('ID inválido.'));
    return this.repository.findSalaById(id);
  }

  async buscarSalaGeral(): Promise<Result<SalaChat | null, Error>> {
    return this.repository.findSalaGeral();
  }

  async listarSalasDoUsuario(
    usuarioId: number,
    params: ListarSalasParams
  ): Promise<Result<PaginatedResponse<SalaChat>, Error>> {
    return this.repository.findSalasByUsuario(usuarioId, params);
  }

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

  async buscarUltimasMensagens(
    salaId: number,
    limite: number = 50
  ): Promise<Result<MensagemComUsuario[], Error>> {
    return this.repository.findUltimasMensagens(salaId, limite);
  }

  async deletarMensagem(
    id: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    // TODO: Verificar se usuário é dono da mensagem
    return this.repository.softDeleteMensagem(id);
  }
}
