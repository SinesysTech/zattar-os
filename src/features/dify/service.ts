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

  constructor(apiKey?: string) {
    this.client = new DifyClient(apiKey);
  }

  static create(appKey?: string): Result<DifyService, Error> {
    if (!isDifyConfigured(appKey)) {
      return err(new Error('Dify não está configurado. Verifique as variáveis de ambiente.'));
    }
    return ok(new DifyService(appKey));
  }

  // Factory function para compatibilidade com MCP Tools
  static async createAsync(userId: string): Promise<DifyService> {
    const serviceResult = DifyService.create();
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
