import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils.js';

const pendentesManifestacaoTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_pendentes_manifestacao',
    description: 'Lista processos pendentes de manifestação com filtros avançados, paginação, ordenação e agrupamento. Filtros incluem básicos (TRT, grau, responsável), busca textual em múltiplos campos, filtros específicos (prazo_vencido, datas de ciência/expediente/autuação/arquivamento), e agrupamento por campos como TRT, grau, responsável, etc. Quando agrupar_por é fornecido, retorna estrutura com agrupamentos (array de grupos com quantidade e opcionalmente pendentes completos se incluir_contagem=false). incluir_contagem=true retorna apenas contagens por grupo (padrão), false retorna pendentes completos. Limite máximo 100.',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().max(100).optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      responsavelId: z.union([z.number(), z.literal('null')]).optional(),
      semResponsavel: z.boolean().optional(),
      busca: z.string().optional(),
      numero_processo: z.string().optional(),
      nome_parte_autora: z.string().optional(),
      nome_parte_re: z.string().optional(),
      descricao_orgao_julgador: z.string().optional(),
      sigla_orgao_julgador: z.string().optional(),
      classe_judicial: z.string().optional(),
      codigo_status_processo: z.string().optional(),
      segredo_justica: z.boolean().optional(),
      juizo_digital: z.boolean().optional(),
      processo_id: z.number().int().optional(),
      prazo_vencido: z.boolean().optional(),
      tipo_expediente_id: z.union([z.number(), z.literal('null')]).optional(),
      sem_tipo: z.boolean().optional(),
      baixado: z.boolean().optional(),
      data_prazo_legal_inicio: z.string().optional(),
      data_prazo_legal_fim: z.string().optional(),
      data_ciencia_inicio: z.string().optional(),
      data_ciencia_fim: z.string().optional(),
      data_criacao_expediente_inicio: z.string().optional(),
      data_criacao_expediente_fim: z.string().optional(),
      data_autuacao_inicio: z.string().optional(),
      data_autuacao_fim: z.string().optional(),
      data_arquivamento_inicio: z.string().optional(),
      data_arquivamento_fim: z.string().optional(),
      ordenar_por: z.enum(['data_prazo_legal_parte', 'data_autuacao', 'numero_processo', 'nome_parte_autora', 'nome_parte_re', 'data_arquivamento', 'data_ciencia_parte', 'data_criacao_expediente', 'prioridade_processual', 'created_at', 'updated_at']).optional(),
      ordem: z.enum(['asc', 'desc']).optional(),
      agrupar_por: z.enum(['trt', 'grau', 'responsavel_id', 'classe_judicial', 'codigo_status_processo', 'orgao_julgador', 'mes_autuacao', 'ano_autuacao', 'prazo_vencido', 'mes_prazo_legal']).optional(),
      incluir_contagem: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as Record<string, unknown>);
        const response = await client.get('/api/pendentes-manifestacao', params);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao listar pendentes de manifestação');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atribuir_responsavel_pendente',
    description: 'Atribui, transfere ou desatribui um responsável de um processo pendente de manifestação. Todas as alterações são automaticamente registradas em logs_alteracao. Use responsavelId como número positivo para atribuição/transferência, ou null para desatribuição.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      responsavelId: z.number().int().positive().nullable(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; responsavelId: number | null };
        const response = await client.patch(`/api/pendentes-manifestacao/${typedArgs.id}/responsavel`, { responsavel_id: typedArgs.responsavelId });
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atribuir responsável ao pendente');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_baixar_pendente',
    description: 'Marca um expediente pendente de manifestação como baixado (respondido). É obrigatório fornecer protocolo_id OU justificativa. Todas as alterações são automaticamente registradas em logs_alteracao.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      protocolo_id: z.string().optional(),
      justificativa: z.string().optional(),
    }).refine((data) => data.protocolo_id || data.justificativa, {
      message: 'É necessário informar o protocolo_id OU a justificativa',
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; protocolo_id?: string; justificativa?: string };
        const body = toSnakeCase({ protocoloId: typedArgs.protocolo_id, justificativa: typedArgs.justificativa });
        const response = await client.patch(`/api/pendentes-manifestacao/${typedArgs.id}/baixa`, body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao baixar pendente');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_reverter_baixa_pendente',
    description: 'Reverte a baixa de um expediente pendente de manifestação, marcando-o como pendente novamente. Limpa os campos baixado_em, protocolo_id e justificativa_baixa. Todas as alterações são automaticamente registradas em logs_alteracao.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number };
        const response = await client.patch(`/api/pendentes-manifestacao/${typedArgs.id}/reverter-baixa`, {});
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao reverter baixa do pendente');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { pendentesManifestacaoTools };
