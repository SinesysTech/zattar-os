import { z } from 'zod';
import { SinesysApiClient } from '../client';
import type { ToolDefinition, ToolResponse } from '../types';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils';

// Cache stats/clear são úteis para troubleshooting de performance e limpeza de dados obsoletos.
// Exemplos de patterns comuns: 'pendentes:*', 'audiencias:*', 'acervo:*'

const adminTools: ToolDefinition[] = [
  {
    name: 'sinesys_obter_estatisticas_cache',
    description: 'Retorna estatísticas do Redis (memória usada, hits, misses, uptime, disponibilidade). Requer autenticação.',
    inputSchema: z.object({}),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.get('/api/cache/stats');
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao obter estatísticas do cache');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_limpar_cache',
    description: 'Limpa cache Redis manualmente. Se `pattern` fornecido (ex: \'pendentes:*\'), remove apenas chaves correspondentes; caso contrário, limpa todo o cache. **Requer permissão de administrador** (ou Service API Key). Operação sensível: requer permissão de administrador. Use com cautela em produção.',
    inputSchema: z.object({
      pattern: z.string().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = args.pattern ? { pattern: toSnakeCase({ pattern: args.pattern }).pattern } : {};
        const response = await client.post('/api/cache/clear', body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao limpar cache');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_verificar_saude_sistema',
    description: 'Verifica status da aplicação (health check endpoint). Retorna timestamp ISO 8601 e status \'ok\'. Não requer autenticação.',
    inputSchema: z.object({}),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.get('/api/health');
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao verificar saúde do sistema');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { adminTools };