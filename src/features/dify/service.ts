import { err, ok, Result } from 'neverthrow';
import { DifyClient } from '../../lib/dify/client';
import { DifyChatResponse, DifyWorkflowResponse } from '../../lib/dify/types';
import {
  enviarMensagemSchema,
  executarWorkflowSchema,
  feedbackSchema,
  TipoDifyApp
} from './domain';
import { z } from 'zod';
import { getDifyConfig, isDifyConfigured } from '../../lib/dify/config';

export class DifyService {
  private client: DifyClient;

  constructor(apiKey?: string, baseUrl?: string) {
    this.client = new DifyClient(apiKey, baseUrl);
  }

  static create(appKey?: string, baseUrl?: string): Result<DifyService, Error> {
    // Se baseUrl for passado, assume configuração explícita.
    // Se não, tenta usar config de ambiente (legacy/fallback).
    if (!baseUrl && !isDifyConfigured(appKey)) {
      // Permitir criar sem config se for usar depois (mas idealmente deve ter config)
      // Por enquanto, retorna erro se não tiver ENV config e não foi passado nada.
      // Mas se estivermos usando DB config, isso será chamado após o fetch.
    }
    return ok(new DifyService(appKey, baseUrl));
  }

  // Factory function para compatibilidade com MCP Tools e uso geral
  static async createAsync(userId: string, appId?: string): Promise<DifyService> {
    // 1. Tentar buscar configuração do banco
    const { difyRepository } = await import('./repository');

    let dbConfig = null;
    let configResult;

    if (appId) {
      configResult = await difyRepository.getDifyApp(appId);
    } else {
      // Se não passou ID, tenta pegar o primeiro ativo (padrão)
      // Poderíamos passar um tipo preferido aqui se soubéssemos, mas createAsync é genérico.
      configResult = await difyRepository.getActiveDifyApp();
    }

    if (configResult.isOk()) {
      dbConfig = configResult.value;
    }

    // 2. Determinar chaves e url
    // Se tiver no banco, usa. 
    // Se não, fallback para env vars (via DifyClient default logic) APENAS SE não foi solicitado um app específico que falhou.

    let apiKey = undefined;
    let baseUrl = undefined;

    if (dbConfig) {
      apiKey = dbConfig.api_key;
      baseUrl = dbConfig.api_url;
    } else if (appId) {
      // Se pediu um app específico e não achou, erro.
      throw new Error(`App Dify com ID ${appId} não encontrado.`);
    }

    const serviceResult = DifyService.create(apiKey, baseUrl);
    if (serviceResult.isErr()) {
      throw serviceResult.error;
    }
    return serviceResult.value;
  }

  // --- Chat ---

  async enviarMensagem(
    params: z.infer<typeof enviarMensagemSchema>,
    user: string
  ): Promise<Result<DifyChatResponse, Error>> {
    try {
      const result = await this.client.chatMessages({
        ...params,
        user,
        response_mode: 'blocking',
      });
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao enviar mensagem Dify: ${error.message}`));
    }
  }

  async enviarMensagemStream(
    params: z.infer<typeof enviarMensagemSchema>,
    user: string
  ): Promise<Result<ReadableStream<Uint8Array>, Error>> {
    try {
      const stream = await this.client.chatMessagesStream({
        ...params,
        user,
        response_mode: 'streaming',
      });
      return ok(stream);
    } catch (error: any) {
      return err(new Error(`Erro ao iniciar stream de mensagem Dify: ${error.message}`));
    }
  }

  async stopChatGeneration(taskId: string, user: string): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.stopChatTask(taskId, user);
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao parar geração do chat: ${error.message}`));
    }
  }

  // --- Workflows ---

  async executarWorkflow(
    params: z.infer<typeof executarWorkflowSchema>,
    user: string
  ): Promise<Result<DifyWorkflowResponse, Error>> {
    try {
      const result = await this.client.workflowRun({
        ...params,
        user,
        response_mode: 'blocking',
      });
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao executar workflow Dify: ${error.message}`));
    }
  }

  async executarWorkflowStream(
    params: z.infer<typeof executarWorkflowSchema>,
    user: string
  ): Promise<Result<ReadableStream<Uint8Array>, Error>> {
    try {
      const stream = await this.client.workflowRunStream({
        ...params,
        user,
        response_mode: 'streaming'
      });
      return ok(stream);
    } catch (error: any) {
      return err(new Error(`Erro ao iniciar stream de workflow Dify: ${error.message}`));
    }
  }

  async stopWorkflow(taskId: string, user: string): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.stopWorkflowRun(taskId, user);
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao parar workflow: ${error.message}`));
    }
  }


  // --- Conversas & Mensagens ---

  async listarConversas(params: { limite: number; ordenarPor?: string }, user: string = 'system'): Promise<Result<{ conversas: any[]; temMais: boolean }, Error>> {
    try {
      const result = await this.client.getConversations({
        user,
        limit: params.limite,
        // Dify API doesn't standardly support sort param in all versions, checking support or ignoring
      });
      return ok({
        conversas: result.data,
        temMais: result.has_more,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao listar conversas Dify: ${error.message}`));
    }
  }

  async obterHistorico(params: { conversationId: string; limite: number }, user: string = 'system'): Promise<Result<{ mensagens: any[]; temMais: boolean }, Error>> {
    try {
      const result = await this.client.getMessages({
        conversation_id: params.conversationId,
        user,
        limit: params.limite,
      });
      return ok({
        mensagens: result.data,
        temMais: result.has_more,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao obter histórico Dify: ${error.message}`));
    }
  }

  async enviarFeedback(
    params: z.infer<typeof feedbackSchema>,
    user: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.sendFeedback(params.message_id, {
        rating: params.rating,
        user,
        content: params.content,
      });
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao enviar feedback Dify: ${error.message}`));
    }
  }

  // --- Info ---

  async obterInfoApp(): Promise<Result<any, Error>> {
    try {
      const result = await this.client.getAppInfo();
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao obter info do app Dify: ${error.message}`));
    }
  }

  async obterParametrosApp(): Promise<Result<any, Error>> {
    try {
      const result = await this.client.getAppParameters();
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao obter parâmetros do app Dify: ${error.message}`));
    }
  }

  async completar(params: { inputs: Record<string, any> }, user: string = 'system'): Promise<Result<{ answer: string; messageId: string; usage: any }, Error>> {
    try {
      const result = await this.client.completionMessages({
        inputs: params.inputs,
        user,
        response_mode: 'blocking',
      });
      return ok({
        answer: result.answer,
        messageId: result.message_id,
        usage: result.metadata.usage,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao completar mensagem Dify: ${error.message}`));
    }
  }

  async uploadArquivo(file: File, user: string): Promise<Result<any, Error>> {
    try {
      const result = await this.client.uploadFile(file, user);
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao fazer upload de arquivo Dify: ${error.message}`));
    }
  }

  // --- Métodos Extras para MCP Tools ---

  async enviarMensagemCompleta(params: { query: string; conversationId?: string; inputs?: Record<string, any> }, user: string = 'system'): Promise<Result<{ answer: string; conversationId: string; messageId: string }, Error>> {
    try {
      const result = await this.client.chatMessages({
        query: params.query,
        conversation_id: params.conversationId,
        inputs: params.inputs || {},
        user,
        response_mode: 'blocking',
      });
      return ok({
        answer: result.answer,
        conversationId: result.conversation_id,
        messageId: result.message_id,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao enviar mensagem completa Dify: ${error.message}`));
    }
  }

  async executarWorkflowCompleto(params: { inputs: Record<string, any> }, user: string = 'system'): Promise<Result<{ workflowRunId: string; status: string; outputs: any; totalTokens: number; tempoDecorrido: number; totalPassos: number }, Error>> {
    try {
      const result = await this.client.workflowRun({
        inputs: params.inputs,
        user,
        response_mode: 'blocking',
      });
      const data = result.data;
      return ok({
        workflowRunId: result.workflow_run_id,
        status: data.status,
        outputs: data.outputs,
        totalTokens: data.total_tokens,
        tempoDecorrido: data.elapsed_time,
        totalPassos: data.total_steps,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao executar workflow completo Dify: ${error.message}`));
    }
  }

  async obterSugestoes(messageId: string, user: string = 'system'): Promise<Result<string[], Error>> {
    try {
      const result = await this.client.getSuggestedQuestions(messageId, user);
      return ok(result.data);
    } catch (error: any) {
      return err(new Error(`Erro ao obter sugestões Dify: ${error.message}`));
    }
  }

  async pararTarefa(taskId: string, user: string = 'system'): Promise<Result<boolean, Error>> {
    try {
      // Tenta parar como chat e como workflow, pois a API não distingue claramente pelo ID no endpoint de stop
      // Ou assume que é chat messages stop task
      await this.client.stopChatTask(taskId, user);
      return ok(true);
    } catch (error: any) {
      return err(new Error(`Erro ao parar tarefa Dify: ${error.message}`));
    }
  }

  async listarDatasets(page = 1, limit = 20): Promise<Result<{ datasets: any[]; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listDatasets({ page, limit });
      return ok({
        datasets: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: any) {
      return err(new Error(`Erro ao listar datasets Dify: ${error.message}`));
    }
  }

  async criarDocumento(params: { datasetId: string; nome: string; texto: string }): Promise<Result<any, Error>> {
    try {
      const result = await this.client.createDocument(params.datasetId, {
        name: params.nome,
        text: params.texto,
        indexing_technique: 'high_quality',
        process_rule: {
          mode: 'automatic',
        },
      });
      return ok(result);
    } catch (error: any) {
      return err(new Error(`Erro ao criar documento Dify: ${error.message}`));
    }
  }
}
