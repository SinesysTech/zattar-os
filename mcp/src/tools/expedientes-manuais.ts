import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils';

const expedientesManuaisTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_expedientes_manuais',
    description: 'Lista expedientes manuais com filtros opcionais e paginação. Filtros incluem busca, processo_id, trt, grau (primeiro_grau ou segundo_grau), tipo_expediente_id, responsavel_id (número ou "null"), prazo_vencido, baixado, criado_por, datas de prazo legal, ordenar_por e ordem (asc ou desc). Limite máximo de 100 por página.',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().max(100).optional(),
      busca: z.string().optional(),
      processo_id: z.number().int().positive().optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      tipo_expediente_id: z.number().int().positive().optional(),
      responsavelId: z.union([z.number().int().positive(), z.literal('null')]).optional(),
      prazo_vencido: z.boolean().optional(),
      baixado: z.boolean().optional(),
      criado_por: z.number().int().positive().optional(),
      data_prazo_legal_inicio: z.string().optional(),
      data_prazo_legal_fim: z.string().optional(),
      ordenar_por: z.string().optional(),
      ordem: z.enum(['asc', 'desc']).optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args);
        const response = await client.get('/api/expedientes-manuais', params);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao listar expedientes manuais');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_expediente_manual',
    description: 'Cria um novo expediente manual. Campos obrigatórios: processo_id (número) e descricao (string não vazia). Campos opcionais: tipo_expediente_id, data_prazo_legal (string ISO), responsavel_id e observacoes.',
    inputSchema: z.object({
      processo_id: z.number().int().positive(),
      descricao: z.string().min(1),
      tipo_expediente_id: z.number().int().positive().optional(),
      data_prazo_legal: z.string().optional(),
      responsavelId: z.number().int().positive().optional(),
      observacoes: z.string().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args);
        const response = await client.post('/api/expedientes-manuais', body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao criar expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_expediente_manual',
    description: 'Busca um expediente manual específico pelo ID. Retorna os dados completos do expediente ou erro se não encontrado.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.get(`/api/expedientes-manuais/${args.id}`);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Expediente manual não encontrado');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_expediente_manual',
    description: 'Atualiza um expediente manual existente. ID é obrigatório. Dados é um objeto com campos parciais a atualizar (todos opcionais): descricao, tipo_expediente_id, data_prazo_legal, responsavel_id, observacoes.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      dados: z.object({
        descricao: z.string().optional(),
        tipo_expediente_id: z.number().int().positive().optional(),
        data_prazo_legal: z.string().optional(),
        responsavelId: z.number().int().positive().optional(),
        observacoes: z.string().optional(),
      }),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const { id, dados } = args;
        const body = toSnakeCase(dados);
        const response = await client.patch(`/api/expedientes-manuais/${id}`, body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atualizar expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_deletar_expediente_manual',
    description: 'Deleta um expediente manual permanentemente pelo ID.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.delete(`/api/expedientes-manuais/${args.id}`);
        if (response.success) {
          return formatToolResponse({ message: 'Expediente manual deletado com sucesso' });
        } else {
          return handleToolError(response.error || 'Erro ao deletar expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atribuir_responsavel_expediente_manual',
    description: 'Atribui ou remove o responsável de um expediente manual. ID é obrigatório. responsavelId pode ser um número (para atribuir) ou null (para remover).',
    inputSchema: z.object({
      id: z.number().int().positive(),
      responsavelId: z.union([z.number().int().positive(), z.null()]),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.patch(`/api/expedientes-manuais/${args.id}/responsavel`, { responsavel_id: args.responsavelId });
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atribuir responsável ao expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_baixar_expediente_manual',
    description: 'Marca um expediente manual como concluído (baixado). ID é obrigatório. Pelo menos um dos campos protocolo_id ou justificativa_baixa deve ser fornecido.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      protocolo_id: z.string().optional(),
      justificativa_baixa: z.string().optional(),
    }).refine((data) => data.protocolo_id || data.justificativa_baixa, {
      message: "Pelo menos um dos campos 'protocolo_id' ou 'justificativa_baixa' deve ser fornecido.",
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const { id, protocolo_id, justificativa_baixa } = args;
        const body = toSnakeCase({ protocoloId: protocolo_id, justificativaBaixa: justificativa_baixa });
        const response = await client.post(`/api/expedientes-manuais/${id}/baixa`, body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao baixar expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_reverter_baixa_expediente_manual',
    description: 'Reverte a baixa de um expediente manual, removendo a marcação de concluído.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.post(`/api/expedientes-manuais/${args.id}/reverter-baixa`, {});
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao reverter baixa do expediente manual');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { expedientesManuaisTools };