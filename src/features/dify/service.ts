import { Result, ok, err } from 'neverthrow';

import {
  DifyClient as DifyClientClass,
  createDifyChatClient,
  createDifyWorkflowClient,
  createDifyClient as createDifyClientFromLib,
  collectStreamAnswer,
  collectWorkflowStreamResult,
} from '@/lib/dify';
import type {
  DifyClient,
  DifyStreamEvent,
  DifyConversation,
  DifyMessage,
  DifyDataset,
  DifyDocument,
  DifyAppInfo,
  DifyAppParameter,
} from '@/lib/dify';

import {
  enviarMensagemSchema,
  executarWorkflowSchema,
  completionSchema,
  listarConversasSchema,
  obterHistoricoSchema,
  enviarFeedbackSchema,
  criarDatasetSchema,
  criarDocumentoSchema,
} from './domain';
import type {
  EnviarMensagemInput,
  ExecutarWorkflowInput,
  CompletionInput,
  ListarConversasInput,
  ObterHistoricoInput,
  EnviarFeedbackInput,
  CriarDatasetInput,
  CriarDocumentoInput,
  DifyConversaResumo,
  DifyMensagem,
  DifyExecucaoWorkflow,
  DifyCompletionResult,
  DifyDatasetResumo,
  DifyDocumentoResumo,
} from './domain';
import type { DifyRepository } from './repository';

// ---------------------------------------------------------------------------
// DifyService
// ---------------------------------------------------------------------------

export class DifyService {
  constructor(
    private chatClient: DifyClient,
    private workflowClient: DifyClient,
    private defaultClient: DifyClient,
    private repository: DifyRepository,
    private userId: string
  ) {}

  // -------------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------------

  /**
   * Envia uma mensagem de chat (modo blocking).
   * Retorna a resposta completa do assistente.
   */
  async enviarMensagem(
    input: EnviarMensagemInput
  ): Promise<Result<{ answer: string; conversationId: string; messageId: string }, Error>> {
    const validation = enviarMensagemSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.chatClient.chatMessages({
        query: validation.data.query,
        user: this.userId,
        conversation_id: validation.data.conversationId || '',
        inputs: validation.data.inputs || {},
        files: validation.data.files,
        auto_generate_name: validation.data.autoGenerateName,
      });

      return ok({
        answer: response.answer,
        conversationId: response.conversation_id,
        messageId: response.message_id,
      });
    } catch (error) {
      console.error('[Dify] Erro ao enviar mensagem:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Envia uma mensagem de chat (modo streaming).
   * Retorna um ReadableStream de eventos.
   */
  async enviarMensagemStream(
    input: EnviarMensagemInput
  ): Promise<Result<ReadableStream<DifyStreamEvent>, Error>> {
    const validation = enviarMensagemSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const stream = await this.chatClient.chatMessagesStream({
        query: validation.data.query,
        user: this.userId,
        conversation_id: validation.data.conversationId || '',
        inputs: validation.data.inputs || {},
        files: validation.data.files,
        auto_generate_name: validation.data.autoGenerateName,
      });

      return ok(stream);
    } catch (error) {
      console.error('[Dify] Erro ao iniciar stream de chat:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Envia mensagem via streaming mas coleta e retorna o resultado completo.
   * Ideal para MCP tools que precisam da resposta final.
   */
  async enviarMensagemCompleta(
    input: EnviarMensagemInput
  ): Promise<Result<{ answer: string; conversationId: string; messageId: string }, Error>> {
    const streamResult = await this.enviarMensagemStream(input);
    if (streamResult.isErr()) return err(streamResult.error);

    try {
      const collected = await collectStreamAnswer(streamResult.value);
      return ok({
        answer: collected.answer,
        conversationId: collected.conversationId || '',
        messageId: collected.messageId || '',
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Conversations
  // -------------------------------------------------------------------------

  /**
   * Lista conversas do usuário.
   */
  async listarConversas(
    input: ListarConversasInput
  ): Promise<Result<{ conversas: DifyConversaResumo[]; temMais: boolean }, Error>> {
    const validation = listarConversasSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.chatClient.getConversations({
        user: this.userId,
        limit: validation.data.limite,
        last_id: validation.data.lastId,
        sort_by: validation.data.ordenarPor,
      });

      return ok({
        conversas: response.data.map(converterConversaDify),
        temMais: response.has_more,
      });
    } catch (error) {
      console.error('[Dify] Erro ao listar conversas:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Obtém o histórico de mensagens de uma conversa.
   */
  async obterHistorico(
    input: ObterHistoricoInput
  ): Promise<Result<{ mensagens: DifyMensagem[]; temMais: boolean }, Error>> {
    const validation = obterHistoricoSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.chatClient.getMessages({
        conversation_id: validation.data.conversationId,
        user: this.userId,
        limit: validation.data.limite,
        first_id: validation.data.firstId,
      });

      return ok({
        mensagens: response.data.map(converterMensagemDify),
        temMais: response.has_more,
      });
    } catch (error) {
      console.error('[Dify] Erro ao obter histórico:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Feedback
  // -------------------------------------------------------------------------

  /**
   * Envia feedback (like/dislike) para uma mensagem.
   */
  async enviarFeedback(
    input: EnviarFeedbackInput
  ): Promise<Result<void, Error>> {
    const validation = enviarFeedbackSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      await this.chatClient.sendFeedback(validation.data.messageId, {
        rating: validation.data.rating,
        user: this.userId,
        content: validation.data.conteudo,
      });

      return ok(undefined);
    } catch (error) {
      console.error('[Dify] Erro ao enviar feedback:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Workflow
  // -------------------------------------------------------------------------

  /**
   * Executa um workflow (modo blocking).
   */
  async executarWorkflow(
    input: ExecutarWorkflowInput
  ): Promise<Result<DifyExecucaoWorkflow, Error>> {
    const validation = executarWorkflowSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.workflowClient.workflowRun({
        inputs: validation.data.inputs,
        user: this.userId,
        files: validation.data.files,
      });

      const execucao: DifyExecucaoWorkflow = {
        id: response.data.id,
        workflowRunId: response.workflow_run_id,
        workflowId: response.data.workflow_id,
        taskId: response.task_id,
        status: response.data.status,
        inputs: validation.data.inputs,
        outputs: response.data.outputs,
        erro: response.data.error,
        totalTokens: response.data.total_tokens,
        tempoDecorrido: response.data.elapsed_time,
        totalPassos: response.data.total_steps,
        criadoEm: response.data.created_at,
        finalizadoEm: response.data.finished_at,
      };

      // Persistir execução para auditoria
      await this.repository.salvarExecucao(execucao, Number(this.userId) || 0);

      return ok(execucao);
    } catch (error) {
      console.error('[Dify] Erro ao executar workflow:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Executa um workflow (modo streaming).
   */
  async executarWorkflowStream(
    input: ExecutarWorkflowInput
  ): Promise<Result<ReadableStream<DifyStreamEvent>, Error>> {
    const validation = executarWorkflowSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const stream = await this.workflowClient.workflowRunStream({
        inputs: validation.data.inputs,
        user: this.userId,
        files: validation.data.files,
      });

      return ok(stream);
    } catch (error) {
      console.error('[Dify] Erro ao iniciar stream de workflow:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Executa workflow via streaming mas coleta e retorna o resultado completo.
   * Ideal para MCP tools.
   */
  async executarWorkflowCompleto(
    input: ExecutarWorkflowInput
  ): Promise<Result<DifyExecucaoWorkflow, Error>> {
    const streamResult = await this.executarWorkflowStream(input);
    if (streamResult.isErr()) return err(streamResult.error);

    try {
      const collected = await collectWorkflowStreamResult(streamResult.value);

      const execucao: DifyExecucaoWorkflow = {
        id: collected.workflowRunId || '',
        workflowRunId: collected.workflowRunId || '',
        workflowId: '',
        taskId: '',
        status: collected.status as DifyExecucaoWorkflow['status'],
        inputs: input.inputs,
        outputs: collected.outputs,
        erro: null,
        totalTokens: collected.totalTokens,
        tempoDecorrido: collected.elapsedTime,
        totalPassos: collected.totalSteps,
        criadoEm: Date.now() / 1000,
        finalizadoEm: Date.now() / 1000,
      };

      // Persistir execução
      await this.repository.salvarExecucao(execucao, Number(this.userId) || 0);

      return ok(execucao);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Completion
  // -------------------------------------------------------------------------

  /**
   * Gera uma completion (texto).
   */
  async completar(
    input: CompletionInput
  ): Promise<Result<DifyCompletionResult, Error>> {
    const validation = completionSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.defaultClient.completionMessages({
        inputs: validation.data.inputs,
        user: this.userId,
        files: validation.data.files,
      });

      return ok({
        messageId: response.message_id,
        answer: response.answer,
        usage: {
          promptTokens: response.metadata.usage.prompt_tokens,
          completionTokens: response.metadata.usage.completion_tokens,
          totalTokens: response.metadata.usage.total_tokens,
          totalPrice: response.metadata.usage.total_price,
          currency: response.metadata.usage.currency,
          latency: response.metadata.usage.latency,
        },
      });
    } catch (error) {
      console.error('[Dify] Erro ao gerar completion:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // App Info
  // -------------------------------------------------------------------------

  /**
   * Obtém informações do app Dify.
   */
  async obterInfoApp(): Promise<Result<DifyAppInfo, Error>> {
    try {
      const info = await this.defaultClient.getAppInfo();
      return ok(info);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Obtém parâmetros do app (forms, opening statement, etc.).
   */
  async obterParametrosApp(): Promise<Result<DifyAppParameter, Error>> {
    try {
      const params = await this.defaultClient.getAppParameters();
      return ok(params);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Knowledge Base
  // -------------------------------------------------------------------------

  /**
   * Cria um novo dataset (knowledge base).
   */
  async criarDataset(
    input: CriarDatasetInput
  ): Promise<Result<DifyDatasetResumo, Error>> {
    const validation = criarDatasetSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const dataset = await this.defaultClient.createDataset({
        name: validation.data.nome,
        description: validation.data.descricao,
        indexing_technique: validation.data.indexingTechnique,
        permission: validation.data.permissao,
      });

      return ok(converterDatasetDify(dataset));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Lista datasets.
   */
  async listarDatasets(
    pagina = 1,
    limite = 20
  ): Promise<Result<{ datasets: DifyDatasetResumo[]; temMais: boolean; total: number }, Error>> {
    try {
      const response = await this.defaultClient.listDatasets(pagina, limite);
      return ok({
        datasets: response.data.map(converterDatasetDify),
        temMais: response.has_more,
        total: response.total,
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Cria um documento em um dataset.
   */
  async criarDocumento(
    input: CriarDocumentoInput
  ): Promise<Result<DifyDocumentoResumo, Error>> {
    const validation = criarDocumentoSchema.safeParse(input);
    if (!validation.success) return err(new Error(validation.error.message));

    try {
      const response = await this.defaultClient.createDocumentByText(
        validation.data.datasetId,
        {
          name: validation.data.nome,
          text: validation.data.texto,
          indexing_technique: validation.data.indexingTechnique,
        }
      );

      return ok(converterDocumentoDify(response.document));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Lista documentos de um dataset.
   */
  async listarDocumentos(
    datasetId: string,
    pagina = 1,
    limite = 20
  ): Promise<Result<{ documentos: DifyDocumentoResumo[]; temMais: boolean; total: number }, Error>> {
    try {
      const response = await this.defaultClient.listDocuments(datasetId, pagina, limite);
      return ok({
        documentos: response.data.map(converterDocumentoDify),
        temMais: response.has_more,
        total: response.total,
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // -------------------------------------------------------------------------
  // Task Control
  // -------------------------------------------------------------------------

  /**
   * Para a geração de uma tarefa em andamento.
   */
  async pararTarefa(taskId: string): Promise<Result<void, Error>> {
    try {
      await this.chatClient.stopTask(taskId, this.userId);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Obtém perguntas sugeridas após uma mensagem.
   */
  async obterSugestoes(messageId: string): Promise<Result<string[], Error>> {
    try {
      const response = await this.chatClient.getSuggestedQuestions(messageId, this.userId);
      return ok(response.data);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Upload de arquivo para uso em mensagens.
   */
  async uploadArquivo(file: File): Promise<Result<{ id: string; nome: string; tamanho: number }, Error>> {
    try {
      const response = await this.defaultClient.uploadFile(file, this.userId);
      return ok({
        id: response.id,
        nome: response.name,
        tamanho: response.size,
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

function converterConversaDify(conv: DifyConversation): DifyConversaResumo {
  return {
    id: conv.id,
    nome: conv.name,
    status: conv.status,
    criadoEm: conv.created_at,
    atualizadoEm: conv.updated_at,
  };
}

function converterMensagemDify(msg: DifyMessage): DifyMensagem {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    query: msg.query,
    answer: msg.answer,
    arquivos: msg.message_files.map((f) => ({
      id: f.id,
      tipo: f.type,
      url: f.url,
      pertenceA: f.belongs_to,
    })),
    feedback: msg.feedback,
    fontes: msg.retriever_resources.map((r) => ({
      posicao: r.position,
      datasetId: r.dataset_id,
      datasetNome: r.dataset_name,
      documentoId: r.document_id,
      documentoNome: r.document_name,
      segmentoId: r.segment_id,
      score: r.score,
      conteudo: r.content,
    })),
    criadoEm: msg.created_at,
  };
}

function converterDatasetDify(ds: DifyDataset): DifyDatasetResumo {
  return {
    id: ds.id,
    nome: ds.name,
    descricao: ds.description,
    quantidadeDocumentos: ds.document_count,
    quantidadePalavras: ds.word_count,
    criadoEm: ds.created_at,
    atualizadoEm: ds.updated_at,
  };
}

function converterDocumentoDify(doc: DifyDocument): DifyDocumentoResumo {
  return {
    id: doc.id,
    nome: doc.name,
    statusIndexacao: doc.indexing_status,
    habilitado: doc.enabled,
    tokens: doc.tokens,
    quantidadePalavras: doc.word_count,
    quantidadeHits: doc.hit_count,
    criadoEm: doc.created_at,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createDifyService(
  userId: string,
  options?: { chatApiKey?: string; workflowApiKey?: string; defaultApiKey?: string }
): Promise<DifyService> {
  const { createDifyRepository } = await import('./repository');

  const chatClient = options?.chatApiKey
    ? new DifyClientClass({ apiKey: options.chatApiKey })
    : createDifyChatClient();

  const workflowClient = options?.workflowApiKey
    ? new DifyClientClass({ apiKey: options.workflowApiKey })
    : createDifyWorkflowClient();

  const defaultClient = options?.defaultApiKey
    ? new DifyClientClass({ apiKey: options.defaultApiKey })
    : createDifyChatClient();

  const repository = await createDifyRepository();

  return new DifyService(chatClient, workflowClient, defaultClient, repository, userId);
}
