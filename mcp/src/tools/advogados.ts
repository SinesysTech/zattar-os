import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils.js';

const advogadosTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_advogados',
    description: 'Lista advogados do escritório com filtros opcionais (busca em nome completo, CPF ou OAB). Campos obrigatórios: nenhum (todos opcionais).',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().max(1000).optional(),
      busca: z.string().optional(),
      oab: z.string().optional(),
      uf_oab: z.string().optional(),
      com_credenciais: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as Record<string, unknown>);
        const response = await client.get('/api/advogados', params);
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro desconhecido ao listar advogados');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_advogado',
    description: 'Cadastra novo advogado no sistema. Campos obrigatórios: nome_completo, cpf, oab, uf_oab.',
    inputSchema: z.object({
      nome_completo: z.string(),
      cpf: z.string(),
      oab: z.string(),
      uf_oab: z.string(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as Record<string, unknown>);
        const response = await client.post('/api/advogados', body);
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro ao criar advogado');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_listar_credenciais_advogado',
    description: 'Lista credenciais de acesso ao PJE de um advogado (filtro por ativas/inativas). Credenciais são armazenadas criptografadas no banco de dados. Campo obrigatório: advogado_id.',
    inputSchema: z.object({
      advogado_id: z.number().int().positive(),
      active: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { advogado_id: number; active?: boolean };
        const { advogado_id, ...params } = typedArgs;
        const queryParams = toSnakeCase(params as Record<string, unknown>);
        const response = await client.get(`/api/advogados/${advogado_id}/credenciais`, queryParams);
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro desconhecido ao listar credenciais');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_credencial_advogado',
    description: 'Cadastra nova credencial de acesso ao tribunal para o advogado (senha é criptografada no backend). Exemplos de tribunais válidos: TRT1-TRT24, TST, etc. Campos obrigatórios: advogado_id, tribunal, grau, senha.',
    inputSchema: z.object({
      advogado_id: z.number().int().positive(),
      tribunal: z.string(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']),
      senha: z.string(),
      active: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { advogado_id: number; tribunal: string; grau: string; senha: string; active?: boolean };
        const { advogado_id, ...body } = typedArgs;
        const snakeBody = toSnakeCase(body as Record<string, unknown>);
        const response = await client.post(`/api/advogados/${advogado_id}/credenciais`, snakeBody);
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro ao criar credencial');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_credencial_advogado',
    description: 'Atualiza credencial existente (atualização parcial, apenas campos fornecidos são alterados). Credenciais são armazenadas criptografadas no banco de dados. Campos obrigatórios: advogado_id, credencial_id.',
    inputSchema: z.object({
      advogado_id: z.number().int().positive(),
      credencial_id: z.number().int().positive(),
      tribunal: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      senha: z.string().optional(),
      active: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { advogado_id: number; credencial_id: number; tribunal?: string; grau?: string; senha?: string; active?: boolean };
        const { advogado_id, credencial_id, ...body } = typedArgs;
        const snakeBody = toSnakeCase(body as Record<string, unknown>);
        const response = await client.patch(`/api/advogados/${advogado_id}/credenciais/${credencial_id}`, snakeBody);
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro ao atualizar credencial');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_ativar_credencial_advogado',
    description: 'Ativa credencial desativada (atalho para atualizar active=true). Credenciais são armazenadas criptografadas no banco de dados. Campos obrigatórios: advogado_id, credencial_id.',
    inputSchema: z.object({
      advogado_id: z.number().int().positive(),
      credencial_id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { advogado_id: number; credencial_id: number };
        const response = await client.patch(`/api/advogados/${typedArgs.advogado_id}/credenciais/${typedArgs.credencial_id}`, { active: true });
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro ao ativar credencial');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_desativar_credencial_advogado',
    description: 'Desativa credencial ativa (atalho para atualizar active=false, não deleta do banco). Credenciais são armazenadas criptografadas no banco de dados. Campos obrigatórios: advogado_id, credencial_id.',
    inputSchema: z.object({
      advogado_id: z.number().int().positive(),
      credencial_id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { advogado_id: number; credencial_id: number };
        const response = await client.patch(`/api/advogados/${typedArgs.advogado_id}/credenciais/${typedArgs.credencial_id}`, { active: false });
        if (response.success) {
          return formatToolResponse(response.data ?? null);
        }
        return handleToolError(response.error || 'Erro ao desativar credencial');
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { advogadosTools };