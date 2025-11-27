import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils.js';

const audienciasTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_audiencias',
    description: 'Lista audiências com filtros avançados, paginação e ordenação. Filtros incluem TRT, grau, responsável (usar número para específico ou "null" para sem responsável), busca textual em múltiplos campos, filtros por status (M=Marcada, R=Realizada, C=Cancelada), modalidade (virtual, presencial, híbrida), tipo de audiência, e ranges de datas (formato ISO YYYY-MM-DD). Ordenação por campos como data_inicio, data_fim, numero_processo, etc., com direção asc ou desc. Paginação padrão: página 1, limite 50; limite máximo 1000 (recomendado para visualizações de calendário). Todos os filtros são opcionais.',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().max(1000).optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      responsavelId: z.union([z.number(), z.literal('null')]).optional(),
      semResponsavel: z.boolean().optional(),
      busca: z.string().optional(),
      numeroProcesso: z.string().optional(),
      poloAtivoNome: z.string().optional(),
      poloPassivoNome: z.string().optional(),
      status: z.enum(['M', 'R', 'C']).optional(),
      modalidade: z.enum(['virtual', 'presencial', 'hibrida']).optional(),
      tipoDescricao: z.string().optional(),
      tipoCodigo: z.string().optional(),
      tipoIsVirtual: z.boolean().optional(),
      dataInicioInicio: z.string().optional(),
      dataInicioFim: z.string().optional(),
      dataFimInicio: z.string().optional(),
      dataFimFim: z.string().optional(),
      ordenarPor: z.enum(['data_inicio', 'data_fim', 'hora_inicio', 'hora_fim', 'numero_processo', 'polo_ativo_nome', 'polo_passivo_nome', 'status', 'modalidade', 'tipo_descricao', 'created_at', 'updated_at']).optional(),
      ordem: z.enum(['asc', 'desc']).optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as Record<string, unknown>);
        const response = await client.get('/api/audiencias', params);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao listar audiências');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_audiencia',
    description: 'Cria uma nova audiência manual no sistema. Campos obrigatórios: processoId (número do processo no acervo), advogadoId (ID do advogado responsável pela captura), dataInicio e dataFim (strings ISO 8601). Campos opcionais: tipoAudienciaId, salaAudienciaId, urlAudienciaVirtual, enderecoPresencial, observacoes, responsavelId. Audiências manuais terão id_pje=0 para diferenciá-las das capturadas do PJE.',
    inputSchema: z.object({
      processoId: z.number(),
      advogadoId: z.number(),
      dataInicio: z.string(),
      dataFim: z.string(),
      tipoAudienciaId: z.number().optional(),
      salaAudienciaId: z.number().optional(),
      urlAudienciaVirtual: z.string().optional(),
      enderecoPresencial: z.string().optional(),
      observacoes: z.string().optional(),
      responsavelId: z.number().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as Record<string, unknown>);
        const response = await client.post('/api/audiencias', body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao criar audiência');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atribuir_responsavel_audiencia',
    description: 'Atribui, transfere ou desatribui um responsável de uma audiência. Campo id é obrigatório (número positivo da audiência). Campo responsavelId pode ser número positivo (atribuição/transferência) ou null (desatribuição). Todas as alterações são automaticamente registradas em logs_alteracao.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      responsavelId: z.union([z.number().int().positive(), z.null()]),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; responsavelId: number | null };
        const response = await client.patch(`/api/audiencias/${typedArgs.id}/responsavel`, { responsavel_id: typedArgs.responsavelId });
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atribuir responsável à audiência');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_modalidade_audiencia',
    description: 'Atualiza a modalidade de uma audiência. Campo id é obrigatório (número da audiência). Campo modalidade é obrigatório (enum: virtual, presencial, hibrida). Nota: Modalidade híbrida só pode ser definida manualmente; virtual e presencial são definidos automaticamente por triggers (ex: presença de URL virtual ou endereço presencial).',
    inputSchema: z.object({
      id: z.number().int().positive(),
      modalidade: z.enum(['virtual', 'presencial', 'hibrida']),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; modalidade: string };
        const response = await client.patch(`/api/audiencias/${typedArgs.id}/modalidade`, { modalidade: typedArgs.modalidade });
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atualizar modalidade da audiência');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_observacoes_audiencia',
    description: 'Atualiza as observações de uma audiência. Campo id é obrigatório (número da audiência). Campo observacoes pode ser string ou null (para remover observações).',
    inputSchema: z.object({
      id: z.number().int().positive(),
      observacoes: z.union([z.string(), z.null()]),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; observacoes: string | null };
        const response = await client.patch(`/api/audiencias/${typedArgs.id}/observacoes`, { observacoes: typedArgs.observacoes });
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atualizar observações da audiência');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { audienciasTools };
