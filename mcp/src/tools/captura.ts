import { z } from 'zod';
import { SinesysApiClient } from '../client/index.js';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError, pollCapturaStatus } from './utils.js';

// Schemas de validação
const acervoGeralSchema = z.object({
  advogado_id: z.number().int().positive(),
  credencial_ids: z.array(z.number().int().positive()).min(1),
});

const audienciasSchema = z.object({
  advogado_id: z.number().int().positive(),
  credencial_ids: z.array(z.number().int().positive()).min(1),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.enum(['M', 'C', 'F']).optional(),
});

const pendentesSchema = z.object({
  advogado_id: z.number().int().positive(),
  credencial_ids: z.array(z.number().int().positive()).min(1),
  filtro_prazo: z.enum(['sem_prazo', 'no_prazo']).optional(),
  filtros_prazo: z.array(z.enum(['sem_prazo', 'no_prazo'])).optional(),
});

const trtCodigoEnum = z.enum(['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24']);

const timelineSchema = z.object({
  trt_codigo: trtCodigoEnum,
  grau: z.enum(['primeiro_grau', 'segundo_grau']),
  processo_id: z.string(),
  numero_processo: z.string(),
  advogado_id: z.number().int().positive(),
  baixar_documentos: z.boolean().optional(),
  filtro_documentos: z.object({
    apenas_assinados: z.boolean().optional(),
    apenas_nao_sigilosos: z.boolean().optional(),
    tipos: z.array(z.string()).optional(),
    data_inicial: z.string().optional(),
    data_final: z.string().optional(),
  }).optional(),
});

const partesSchema = z.object({
  advogado_id: z.number().int().positive(),
  credencial_ids: z.array(z.number().int().positive()).min(1),
  processo_ids: z.array(z.number().int().positive()).optional(),
  trts: z.array(trtCodigoEnum).optional(),
  graus: z.array(z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior'])).optional(),
  numero_processo: z.string().optional(),
  numeros_processo: z.array(z.string()).optional(),
}).refine((data) => data.processo_ids?.length || data.trts?.length || data.graus?.length || data.numero_processo || data.numeros_processo?.length, {
  message: 'Requer ao menos 1 filtro: processo_ids, trts, graus, numero_processo, numeros_processo',
});

const statusCapturaSchema = z.object({
  capture_id: z.number().int().positive(),
});

const historicoCapturasSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(100).optional(),
  tipo_captura: z.enum(['acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes', 'timeline']).optional(),
  advogado_id: z.number().int().positive().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
});

const aguardarCapturaSchema = z.object({
  capture_id: z.number().int().positive(),
  interval_ms: z.number().int().positive().optional().describe('Intervalo entre consultas em milissegundos (padrão: 5000)'),
  timeout_ms: z.number().int().positive().optional().describe('Timeout máximo em milissegundos (padrão: 300000 = 5min)'),
});

// Schema inline para captura de partes (usado diretamente na definição da tool)
const capturaPartesInlineSchema = z.object({
  advogado_id: z.number().int().positive(),
  credencial_ids: z.array(z.number().int().positive()).min(1),
  processo_ids: z.array(z.number().int().positive()).optional(),
  trts: z.array(z.enum(['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'])).optional(),
  graus: z.array(z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior'])).optional(),
  numero_processo: z.string().optional(),
  numeros_processo: z.array(z.string()).optional(),
}).refine((data) => data.processo_ids?.length || data.trts?.length || data.graus?.length || data.numero_processo || data.numeros_processo?.length, {
  message: 'Requer ao menos 1 filtro: processo_ids, trts, graus, numero_processo, numeros_processo',
});

// Schema inline para consulta de status
const statusCapturaInlineSchema = z.object({
  capture_id: z.number().int().positive(),
});

// Schema inline para histórico de capturas
const historicoCapturasInlineSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().max(100).optional(),
  tipo_captura: z.enum(['acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes', 'timeline']).optional(),
  advogado_id: z.number().int().positive().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
});

// Schema inline para aguardar captura
const aguardarCapturaInlineSchema = z.object({
  capture_id: z.number().int().positive(),
  interval_ms: z.number().int().positive().optional().describe('Intervalo entre consultas em milissegundos (padrão: 5000)'),
  timeout_ms: z.number().int().positive().optional().describe('Timeout máximo em milissegundos (padrão: 300000 = 5min)'),
});

// Tipos inferidos dos schemas
type AcervoGeralInput = z.infer<typeof acervoGeralSchema>;
type AudienciasInput = z.infer<typeof audienciasSchema>;
type PendentesInput = z.infer<typeof pendentesSchema>;
type TimelineInput = z.infer<typeof timelineSchema>;
type PartesInput = z.infer<typeof partesSchema>;
type StatusCapturaInput = z.infer<typeof statusCapturaSchema>;
type HistoricoCapturasInput = z.infer<typeof historicoCapturasSchema>;
type AguardarCapturaInput = z.infer<typeof aguardarCapturaSchema>;

// Tipos para os schemas inline
type CapturaPartesInlineInput = z.infer<typeof capturaPartesInlineSchema>;
type StatusCapturaInlineInput = z.infer<typeof statusCapturaInlineSchema>;
type HistoricoCapturasInlineInput = z.infer<typeof historicoCapturasInlineSchema>;
type AguardarCapturaInlineInput = z.infer<typeof aguardarCapturaInlineSchema>;

const capturaTools: ToolDefinition[] = [
  {
    name: 'sinesys_iniciar_captura_acervo_geral',
    description: 'Inicia captura de processos do acervo geral (todos os processos ativos). Após iniciar, use sinesys_consultar_status_captura com o capture_id retornado para acompanhar progresso. Exemplo: {"advogado_id": 1, "credencial_ids": [5, 6]}',
    inputSchema: acervoGeralSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as AcervoGeralInput);
        const response = await client.post('/api/captura/trt/acervo-geral', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao iniciar captura de acervo geral');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_iniciar_captura_audiencias',
    description: 'Inicia captura de audiências marcadas no período especificado (padrão: hoje até +365 dias). Status: M=Designada (padrão), C=Cancelada, F=Realizada. Após iniciar, use sinesys_consultar_status_captura com o capture_id retornado para acompanhar progresso. Exemplo: {"advogado_id": 1, "credencial_ids": [5, 6], "data_inicio": "2024-01-01", "data_fim": "2024-12-31", "status": "M"}',
    inputSchema: audienciasSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as AudienciasInput);
        const response = await client.post('/api/captura/trt/audiencias', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao iniciar captura de audiências');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_iniciar_captura_pendentes',
    description: 'Inicia captura de processos pendentes de manifestação, com filtros de prazo (padrão: sem_prazo). Após iniciar, use sinesys_consultar_status_captura com o capture_id retornado para acompanhar progresso. Exemplo: {"advogado_id": 1, "credencial_ids": [5, 6], "filtros_prazo": ["sem_prazo", "no_prazo"]}',
    inputSchema: pendentesSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as PendentesInput);
        const response = await client.post('/api/captura/trt/pendentes-manifestacao', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao iniciar captura de pendentes');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_iniciar_captura_timeline',
    description: 'Captura timeline completa de um processo específico (movimentos + documentos). Baixar documentos padrão true. Após iniciar, use sinesys_consultar_status_captura com o capture_id retornado para acompanhar progresso. Exemplo: {"trt_codigo": "TRT3", "grau": "primeiro_grau", "processo_id": "2887163", "numero_processo": "0010702-80.2025.5.03.0111", "advogado_id": 1}',
    inputSchema: timelineSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as TimelineInput);
        const response = await client.post('/api/captura/trt/timeline', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao iniciar captura de timeline');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_iniciar_captura_partes',
    description: 'Captura partes (pessoas envolvidas) de processos, identificando clientes/partes contrárias/terceiros. Requer ao menos 1 filtro (processo_ids, trts, graus, numero_processo, numeros_processo). Após iniciar, use sinesys_consultar_status_captura com o capture_id retornado para acompanhar progresso. Exemplo: {"advogado_id": 1, "credencial_ids": [5, 6], "processo_ids": [100, 101]}',
    inputSchema: capturaPartesInlineSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as CapturaPartesInlineInput);
        const response = await client.post('/api/captura/trt/partes', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao iniciar captura de partes');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_consultar_status_captura',
    description: 'Consulta status de uma captura assíncrona (pending/in_progress/completed/failed) com resultado detalhado. Exemplo: {"capture_id": 123}',
    inputSchema: statusCapturaInlineSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as StatusCapturaInlineInput;
        const response = await client.get(`/api/captura/historico/${typedArgs.capture_id}`);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao consultar status da captura');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_listar_historico_capturas',
    description: 'Lista histórico de capturas realizadas com filtros avançados. Limite máximo 100. Exemplo: {"pagina": 1, "limite": 50, "tipo_captura": "audiencias", "status": "completed"}',
    inputSchema: historicoCapturasInlineSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as HistoricoCapturasInlineInput);
        const response = await client.get('/api/captura/historico', params);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao listar histórico de capturas');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_aguardar_captura_concluir',
    description: 'Aguarda uma captura assíncrona ser concluída (completed/failed) com polling automático. Útil quando você precisa do resultado final sem monitorar manualmente. Retorna os dados completos da captura ao concluir ou erro se timeout. Intervalo padrão: 5s, timeout padrão: 5min. Exemplo: {"capture_id": 123, "interval_ms": 3000, "timeout_ms": 120000}',
    inputSchema: aguardarCapturaInlineSchema,
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as AguardarCapturaInlineInput;
        const result = await pollCapturaStatus(client, typedArgs.capture_id, {
          intervalMs: typedArgs.interval_ms,
          timeoutMs: typedArgs.timeout_ms,
        });

        if (result.success) {
          return formatToolResponse({
            status: result.status,
            data: result.data,
            polling_info: {
              total_polls: result.totalPolls,
              elapsed_ms: result.elapsedMs,
            },
          });
        } else {
          // Retornar erro com informações de polling
          const errorInfo = {
            status: result.status,
            error: result.error,
            timed_out: result.timedOut || false,
            polling_info: {
              total_polls: result.totalPolls,
              elapsed_ms: result.elapsedMs,
            },
          };
          return handleToolError(JSON.stringify(errorInfo, null, 2));
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { capturaTools };