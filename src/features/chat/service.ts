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
  Chamada,
  ChamadaComParticipantes,
  TipoChamada,
  ListarChamadasParams,
} from './domain';
import { 
  criarSalaChatSchema, 
  criarMensagemChatSchema, 
  criarChamadaSchema,
  responderChamadaSchema,
  TipoSalaChat,
  StatusChamada 
} from './domain';
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
  // CHAMADAS (Calls)
  // ===========================================================================

  /**
   * Inicia uma nova chamada em uma sala
   */
  async iniciarChamada(
    salaId: number,
    tipo: TipoChamada,
    usuarioId: number,
    meetingId: string
  ): Promise<Result<Chamada, z.ZodError | Error>> {
    // Validação do schema
    const validation = criarChamadaSchema.safeParse({ salaId, tipo, meetingId });
    if (!validation.success) return err(validation.error);

    // Verificar se sala existe
    const salaResult = await this.repository.findSalaById(salaId);
    if (salaResult.isErr()) return err(salaResult.error);
    if (!salaResult.value) return err(new Error('Sala não encontrada.'));

    // Verificar se usuário é membro da sala
    const isMembroResult = await this.repository.isMembroAtivo(salaId, usuarioId);
    if (isMembroResult.isErr()) return err(isMembroResult.error);
    if (!isMembroResult.value) return err(new Error('Usuário não é membro desta sala.'));

    // Persistir chamada
    const chamadaResult = await this.repository.saveChamada({
      salaId,
      tipo,
      meetingId,
      iniciadoPor: usuarioId,
      status: StatusChamada.Iniciada
    });

    if (chamadaResult.isErr()) return chamadaResult;
    const chamada = chamadaResult.value;

    // Adicionar iniciador como participante
    await this.repository.addParticipante(chamada.id, usuarioId);
    
    // Auto-confirmar entrada do iniciador
    await this.repository.registrarEntrada(chamada.id, usuarioId);

    // Adicionar outros membros da sala como participantes (pendentes)
    // Isso é importante para que eles apareçam na lista de convidados e possam responder
    // OBS: Em grupos grandes isso pode ser custoso. Para MVP, assumimos salas < 50 pessoas.
    // TODO: Otimizar para grandes grupos (convite sob demanda?)
    // Por enquanto vamos adicionar apenas em salas privadas ou grupos pequenos?
    // A lógica de "quem participa" está implícita: quem recebe a notificação pode entrar.
    // O repository.addParticipante é chamado quando o usuário RESPOSTA ou ENTRA.
    // Não vamos pré-popular todos os membros para evitar spam em grupos grandes.
    // A notificação broadcast chegará para todos na sala.

    return ok(chamada);
  }

  /**
   * Responde a um convite de chamada (Aceitar/Recusar)
   */
  async responderChamada(
    chamadaId: number,
    usuarioId: number,
    aceitou: boolean
  ): Promise<Result<void, z.ZodError | Error>> {
    const validation = responderChamadaSchema.safeParse({ chamadaId, aceitou });
    if (!validation.success) return err(validation.error);

    // Verificar chamada
    const chamadaResult = await this.repository.findChamadaById(chamadaId);
    if (chamadaResult.isErr()) return err(chamadaResult.error);
    if (!chamadaResult.value) return err(new Error('Chamada não encontrada.'));

    const chamada = chamadaResult.value;

    // Verificar se chamada ainda é válida
    if (chamada.status === StatusChamada.Finalizada || chamada.status === StatusChamada.Cancelada) {
      return err(new Error('Esta chamada já foi encerrada.'));
    }

    // Garantir que o participante existe na tabela
    await this.repository.addParticipante(chamadaId, usuarioId);

    // Registrar resposta
    const responderResult = await this.repository.responderChamada(chamadaId, usuarioId, aceitou);
    if (responderResult.isErr()) return err(responderResult.error);

    // Se recusou, atualiza status da chamada e retorna
    if (!aceitou) {
      const updateResult = await this.repository.updateChamadaStatus(chamadaId, StatusChamada.Recusada);
      if (updateResult.isErr()) return err(updateResult.error);
      return ok(undefined);
    }

    return ok(undefined);
  }

  /**
   * Registra entrada de usuário na chamada
   */
  async entrarNaChamada(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    const chamadaResult = await this.repository.findChamadaById(chamadaId);
    if (chamadaResult.isErr()) return err(chamadaResult.error);
    if (!chamadaResult.value) return err(new Error('Chamada não encontrada.'));

    const chamada = chamadaResult.value;

    if (chamada.status === StatusChamada.Finalizada || chamada.status === StatusChamada.Cancelada) {
      return err(new Error('Não é possível entrar em uma chamada encerrada.'));
    }

    // Garantir que existe registro de participante
    await this.repository.addParticipante(chamadaId, usuarioId);

    // Registrar entrada
    const entradaResult = await this.repository.registrarEntrada(chamadaId, usuarioId);
    if (entradaResult.isErr()) return entradaResult;

    // Se status for "iniciada", muda para "em_andamento" ao ter participantes ativos
    if (chamada.status === StatusChamada.Iniciada) {
      const updateResult = await this.repository.updateChamadaStatus(chamadaId, StatusChamada.EmAndamento);
      if (updateResult.isErr()) return err(updateResult.error);
    }

    return ok(undefined);
  }

  /**
   * Registra saída e verifica finalização
   */
  async sairDaChamada(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    const saidaResult = await this.repository.registrarSaida(chamadaId, usuarioId);
    if (saidaResult.isErr()) return saidaResult;

    // Verificar se ainda há participantes ativos
    const participantesResult = await this.repository.findParticipantesByChamada(chamadaId);
    if (participantesResult.isOk()) {
      const ativos = participantesResult.value.filter(p => p.entrouEm && !p.saiuEm);
      
      // Se não houver mais ninguém, finaliza a chamada automaticamente
      if (ativos.length === 0) {
        // Calcular duração total (aprox)
        const chamadaResult = await this.repository.findChamadaById(chamadaId);
        let duracao = 0;
        if (chamadaResult.isOk() && chamadaResult.value?.iniciadaEm) {
          const inicio = new Date(chamadaResult.value.iniciadaEm).getTime();
          const fim = new Date().getTime();
          duracao = Math.floor((fim - inicio) / 1000);
        }

        const finalizaResult = await this.repository.finalizarChamada(chamadaId, duracao);
        if (finalizaResult.isErr()) return err(finalizaResult.error);
      }
    }

    return ok(undefined);
  }

  /**
   * Finaliza uma chamada manualmente (pelo iniciador)
   */
  async finalizarChamada(
    chamadaId: number,
    usuarioId: number
  ): Promise<Result<void, Error>> {
    const chamadaResult = await this.repository.findChamadaById(chamadaId);
    if (chamadaResult.isErr()) return err(chamadaResult.error);
    if (!chamadaResult.value) return err(new Error('Chamada não encontrada.'));

    const chamada = chamadaResult.value;

    // Apenas iniciador pode finalizar forçadamente (ou admin, mas sem lógica de admin aqui por enqto)
    if (chamada.iniciadoPor !== usuarioId) {
      return err(new Error('Apenas o iniciador pode encerrar a chamada para todos.'));
    }

    // Calcular duração
    const inicio = new Date(chamada.iniciadaEm).getTime();
    const fim = new Date().getTime();
    const duracao = Math.floor((fim - inicio) / 1000);

    return this.repository.finalizarChamada(chamadaId, duracao);
  }

  /**
   * Salva a transcrição de uma chamada
   */
  async salvarTranscricao(chamadaId: number, transcricao: string): Promise<Result<void, Error>> {
    if (!transcricao.trim()) {
      return err(new Error("Transcrição vazia."));
    }
    return this.repository.updateTranscricao(chamadaId, transcricao);
  }

  /**
   * Gera resumo da chamada usando IA
   */
  async gerarResumo(chamadaId: number): Promise<Result<string, Error>> {
    // 1. Get call details
    const chamadaResult = await this.repository.findChamadaById(chamadaId);
    if (chamadaResult.isErr()) return err(chamadaResult.error);
    const chamada = chamadaResult.value;

    if (!chamada) return err(new Error("Chamada não encontrada."));
    if (!chamada.transcricao) return err(new Error("Chamada sem transcrição para resumir."));

    try {
      // Dynamic import to avoid circular deps or server-only issues if any
      const { gerarResumoTranscricao } = await import("@/lib/ai/summarization");
      
      const resumo = await gerarResumoTranscricao(chamada.transcricao, {
        tipo: chamada.tipo,
        duracao: chamada.duracaoSegundos
      });

      // 3. Save summary
      const saveResult = await this.repository.updateResumo(chamadaId, resumo);
      if (saveResult.isErr()) return err(saveResult.error);

      return ok(resumo);
    } catch (e) {
      console.error("Erro ao gerar resumo:", e);
      return err(new Error("Falha ao gerar resumo com IA."));
    }
  }

  /**
   * Busca histórico de chamadas de uma sala
   */
  async buscarHistoricoChamadas(
    salaId: number,
    limite?: number
  ): Promise<Result<ChamadaComParticipantes[], Error>> {
    return this.repository.findChamadasBySala(salaId, limite);
  }

  /**
   * Busca histórico global de chamadas com filtros
   */
  async buscarHistoricoGlobal(
    params: ListarChamadasParams
  ): Promise<Result<PaginatedResponse<ChamadaComParticipantes>, Error>> {
    // Validações básicas se necessário
    if (params.limite && params.limite > 100) params.limite = 100;
    
    return this.repository.findChamadasComFiltros(params);
  }

  /**
   * Busca uma chamada específica por ID
   */
  async buscarChamadaPorId(
    id: number
  ): Promise<Result<ChamadaComParticipantes | null, Error>> {
    return this.repository.findChamadaById(id);
  }

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