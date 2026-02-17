import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

const SYSTEM_USER_ID = process.env.SYSTEM_AGENT_USER_ID || '1';

/**
 * Registra todas as ferramentas MCP do Dify.
 * Inclui: chat, workflows, completion, knowledge base, e app info.
 */
export async function registerDifyTools(): Promise<void> {
  const { isDifyConfigured } = await import('@/lib/dify');

  if (!isDifyConfigured()) {
    console.warn('[MCP] Dify não configurado — tools não serão registradas');
    return;
  }

  // -------------------------------------------------------------------------
  // Chat Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_chat_enviar_mensagem',
    description:
      'Envia uma mensagem para o assistente de chat Dify e recebe a resposta. ' +
      'Pode continuar uma conversa existente passando o conversation_id.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      mensagem: z.string().min(1).describe('Mensagem para enviar ao assistente'),
      conversation_id: z.string().optional().describe('ID da conversa para continuar (vazio = nova conversa)'),
      inputs: z.record(z.string(), z.unknown()).optional().describe('Variáveis de entrada do app'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.enviarMensagemCompleta({
          query: args.mensagem,
          conversationId: args.conversation_id,
          inputs: args.inputs,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          resposta: result.value.answer,
          conversation_id: result.value.conversationId,
          message_id: result.value.messageId,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar mensagem Dify');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_listar_conversas',
    description: 'Lista as conversas do usuário no Dify, ordenadas por data de atualização.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().int().min(1).max(100).default(20).describe('Máximo de conversas a retornar'),
      ordenar_por: z
        .enum(['created_at', '-created_at', 'updated_at', '-updated_at'])
        .default('-updated_at')
        .describe('Campo de ordenação'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarConversas({
          limite: args.limite || 20,
          ordenarPor: args.ordenar_por,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          conversas: result.value.conversas,
          tem_mais: result.value.temMais,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar conversas');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_obter_historico',
    description: 'Obtém o histórico de mensagens de uma conversa Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      conversation_id: z.string().min(1).describe('ID da conversa'),
      limite: z.number().int().min(1).max(100).default(20).describe('Máximo de mensagens a retornar'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterHistorico({
          conversationId: args.conversation_id,
          limite: args.limite || 20,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          mensagens: result.value.mensagens,
          tem_mais: result.value.temMais,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter histórico');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_enviar_feedback',
    description: 'Envia feedback (like/dislike) para uma mensagem do assistente Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      message_id: z.string().min(1).describe('ID da mensagem'),
      rating: z.enum(['like', 'dislike']).describe('Avaliação: like ou dislike'),
      conteudo: z.string().optional().describe('Comentário opcional sobre a resposta'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.enviarFeedback({
          message_id: args.message_id,
          rating: args.rating,
          content: args.conteudo,
        }, SYSTEM_USER_ID);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar feedback');
      }
    },
  });

  registerMcpTool({
    name: 'dify_chat_sugestoes',
    description: 'Obtém perguntas sugeridas após uma mensagem do assistente Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      message_id: z.string().min(1).describe('ID da mensagem para obter sugestões'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterSugestoes(args.message_id);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sugestoes: result.value });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter sugestões');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Workflow Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_workflow_executar',
    description:
      'Executa um workflow Dify com os parâmetros fornecidos. ' +
      'Retorna o resultado completo incluindo outputs, tokens usados e tempo de execução.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      inputs: z.record(z.string(), z.unknown()).describe('Variáveis de entrada do workflow'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.executarWorkflowCompleto({
          inputs: args.inputs,
        });

        if (result.isErr()) return errorResult(result.error.message);

        const exec = result.value;
        return jsonResult({
          workflow_run_id: exec.workflowRunId,
          status: exec.status,
          outputs: exec.outputs,
          total_tokens: exec.totalTokens,
          tempo_execucao: exec.tempoDecorrido,
          total_passos: exec.totalPassos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao executar workflow');
      }
    },
  });

  registerMcpTool({
    name: 'dify_workflow_parar',
    description: 'Para a execução de uma tarefa Dify em andamento.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      task_id: z.string().min(1).describe('ID da tarefa a ser parada'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.pararTarefa(args.task_id);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({ sucesso: true });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao parar tarefa');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Completion Tool
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_completion_gerar',
    description:
      'Gera uma completion de texto usando o Dify. ' +
      'Diferente do chat, não mantém contexto de conversa.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      inputs: z.record(z.string(), z.unknown()).describe('Variáveis de entrada para a completion'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.completar({ inputs: args.inputs });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          resposta: result.value.answer,
          message_id: result.value.messageId,
          uso: result.value.usage,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao gerar completion');
      }
    },
  });

  // -------------------------------------------------------------------------
  // App Info Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_app_info',
    description: 'Obtém informações do aplicativo Dify configurado (nome, descrição, tags).',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterInfoApp();

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter info do app');
      }
    },
  });

  registerMcpTool({
    name: 'dify_app_parametros',
    description:
      'Obtém os parâmetros do aplicativo Dify (formulários, mensagem de abertura, configurações).',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.obterParametrosApp();

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter parâmetros');
      }
    },
  });

  // -------------------------------------------------------------------------
  // Knowledge Base Tools
  // -------------------------------------------------------------------------

  registerMcpTool({
    name: 'dify_knowledge_listar_datasets',
    description: 'Lista os datasets (knowledge bases) disponíveis no Dify.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().int().min(1).default(1).describe('Número da página'),
      limite: z.number().int().min(1).max(100).default(20).describe('Itens por página'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.listarDatasets(args.pagina, args.limite);

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult({
          datasets: result.value.datasets,
          tem_mais: result.value.temMais,
          total: result.value.total,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar datasets');
      }
    },
  });

  registerMcpTool({
    name: 'dify_knowledge_criar_documento',
    description:
      'Cria um novo documento em um dataset (knowledge base) do Dify. ' +
      'O texto será indexado automaticamente para busca semântica.',
    feature: 'dify',
    requiresAuth: true,
    schema: z.object({
      dataset_id: z.string().min(1).describe('ID do dataset onde criar o documento'),
      nome: z.string().min(1).describe('Nome do documento'),
      texto: z.string().min(1).describe('Conteúdo do documento a ser indexado'),
    }),
    handler: async (args) => {
      try {
        const { createDifyServiceForUser } = await import('@/features/dify/factory');
        const service = await createDifyServiceForUser(SYSTEM_USER_ID);
        const result = await service.criarDocumento({
          datasetId: args.dataset_id,
          nome: args.nome,
          texto: args.texto,
        });

        if (result.isErr()) return errorResult(result.error.message);

        return jsonResult(result.value);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar documento');
      }
    },
  });

  console.log('[MCP] 13 ferramentas Dify registradas com sucesso');
}
