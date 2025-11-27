import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils';
import { SinesysApiClient } from '../client';

// Schemas de input
const listarAudienciasSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(1000).optional(),
  trt: z.string().optional(),
  grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
  responsavel_id: z.union([z.number(), z.literal('null')]).optional(),
  sem_responsavel: z.boolean().optional(),
  busca: z.string().optional(),
  numero_processo: z.string().optional(),
  polo_ativo_nome: z.string().optional(),
  polo_passivo_nome: z.string().optional(),
  status: z.enum(['M', 'R', 'C']).optional(),
  modalidade: z.enum(['virtual', 'presencial', 'hibrida']).optional(),
  tipo_descricao: z.string().optional(),
  tipo_codigo: z.string().optional(),
  tipo_is_virtual: z.boolean().optional(),
  data_inicio_inicio: z.string().optional(),
  data_inicio_fim: z.string().optional(),
  data_fim_inicio: z.string().optional(),
  data_fim_fim: z.string().optional(),
  ordenar_por: z.enum(['data_inicio', 'data_fim', 'hora_inicio', 'hora_fim', 'numero_processo', 'polo_ativo_nome', 'polo_passivo_nome', 'status', 'modalidade', 'tipo_descricao', 'created_at', 'updated_at']).optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
});

const criarAudienciaSchema = z.object({
  processo_id: z.number(),
  advogado_id: z.number(),
  data_inicio: z.string(),
  data_fim: z.string(),
  tipo_audiencia_id: z.number().optional(),
  sala_audiencia_id: z.number().optional(),
  url_audiencia_virtual: z.string().optional(),
  endereco_presencial: z.string().optional(),
  observacoes: z.string().optional(),
  responsavel_id: z.number().optional(),
});

const atribuirResponsavelSchema = z.object({
  id: z.number().positive(),
  responsavelId: z.union([z.number().positive(), z.null()]),
});

const atualizarModalidadeSchema = z.object({
  id: z.number(),
  modalidade: z.enum(['virtual', 'presencial', 'hibrida']),
});

const atualizarObservacoesSchema = z.object({
  id: z.number(),
  observacoes: z.union([z.string(), z.null()]),
});

// Tipos inferidos dos schemas
type ListarAudienciasInput = z.infer<typeof listarAudienciasSchema>;
type CriarAudienciaInput = z.infer<typeof criarAudienciaSchema>;
type AtribuirResponsavelInput = z.infer<typeof atribuirResponsavelSchema>;
type AtualizarModalidadeInput = z.infer<typeof atualizarModalidadeSchema>;
type AtualizarObservacoesInput = z.infer<typeof atualizarObservacoesSchema>;

const audienciasTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_audiencias',
    description: 'Lista audiências com filtros avançados, paginação e ordenação. Filtros incluem TRT, grau, responsável (usar número para específico ou "null" para sem responsável), busca textual em múltiplos campos, filtros por status (M=Marcada, R=Realizada, C=Cancelada), modalidade (virtual, presencial, híbrida), tipo de audiência, e ranges de datas (formato ISO YYYY-MM-DD). Ordenação por campos como data_inicio, data_fim, numero_processo, etc., com direção asc ou desc. Paginação padrão: página 1, limite 50; limite máximo 1000 (recomendado para visualizações de calendário). Todos os filtros são opcionais.',
    inputSchema: listarAudienciasSchema,
    handler: async (args: z.infer<typeof listarAudienciasSchema>, client: SinesysApiClient): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args);
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
    description: 'Cria uma nova audiência manual no sistema. Campos obrigatórios: processo_id (número do processo no acervo), advogado_id (ID do advogado responsável pela captura), data_inicio e data_fim (strings ISO 8601). Campos opcionais: tipo_audiencia_id, sala_audiencia_id, url_audiencia_virtual, endereco_presencial, observacoes, responsavel_id. Audiências manuais terão id_pje=0 para diferenciá-las das capturadas do PJE.',
    inputSchema: criarAudienciaSchema,
    handler: async (args: z.infer<typeof criarAudienciaSchema>, client: SinesysApiClient): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args);
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
    inputSchema: atribuirResponsavelSchema,
    handler: async (args: AtribuirResponsavelInput, client: SinesysApiClient): Promise<ToolResponse> => {
      try {
        const response = await client.patch(`/api/audiencias/${args.id}/responsavel`, { responsavel_id: args.responsavelId });
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
    inputSchema: atualizarModalidadeSchema,
    handler: async (args: AtualizarModalidadeInput, client: SinesysApiClient): Promise<ToolResponse> => {
      try {
        const response = await client.patch(`/api/audiencias/${args.id}/modalidade`, { modalidade: args.modalidade });
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
    inputSchema: atualizarObservacoesSchema,
    handler: async (args: AtualizarObservacoesInput, client: SinesysApiClient): Promise<ToolResponse> => {
      try {
        const response = await client.patch(`/api/audiencias/${args.id}/observacoes`, { observacoes: args.observacoes });
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