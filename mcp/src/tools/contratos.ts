import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils.js';

// Enums for Zod schemas
const areaDireitoEnum = z.enum(['trabalhista', 'civil', 'previdenciario', 'criminal', 'empresarial', 'administrativo']);
const tipoContratoEnum = z.enum(['ajuizamento', 'defesa', 'ato_processual', 'assessoria', 'consultoria', 'extrajudicial', 'parecer']);
const tipoCobrancaEnum = z.enum(['pro_exito', 'pro_labore']);
const statusContratoEnum = z.enum(['em_contratacao', 'contratado', 'distribuido', 'desistencia']);
const poloProcessualEnum = z.enum(['autor', 're']);
const parteTipoEnum = z.enum(['cliente', 'parte_contraria']);

const parteContratoSchema = z.object({
  tipo: parteTipoEnum,
  id: z.number().int().positive(),
  nome: z.string().min(1),
});

// Tool definitions
export const contratosTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_contratos',
    description: `Lista contratos do sistema com paginação e filtros opcionais. Filtros incluem busca textual em observações, área de direito (${areaDireitoEnum.options.join(', ')}), tipo de contrato (${tipoContratoEnum.options.join(', ')}), tipo de cobrança (${tipoCobrancaEnum.options.join(', ')}), status (${statusContratoEnum.options.join(', ')}), IDs de cliente, parte contrária e responsável. Retorna array de contratos com informações de paginação.`,
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().optional(),
      busca: z.string().optional(),
      areaDireito: areaDireitoEnum.optional(),
      tipoContrato: tipoContratoEnum.optional(),
      tipoCobranca: tipoCobrancaEnum.optional(),
      status: statusContratoEnum.optional(),
      clienteId: z.number().int().positive().optional(),
      parteContrariaId: z.number().int().positive().optional(),
      responsavelId: z.number().int().positive().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as Record<string, unknown>);
        const response = await client.get('/api/contratos', params);
        if (!response.success) {
          return handleToolError(response.error || 'Erro desconhecido ao listar contratos');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_contrato',
    description: 'Busca um contrato específico pelo ID. Retorna todos os dados do contrato, incluindo partes JSONB, datas e responsável.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number };
        const response = await client.get(`/api/contratos/${typedArgs.id}`);
        if (!response.success) {
          return handleToolError(response.error || 'Contrato não encontrado');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_contrato',
    description: `Cria um novo contrato no sistema. Campos obrigatórios: areaDireito (${areaDireitoEnum.options.join(', ')}), tipoContrato (${tipoContratoEnum.options.join(', ')}), tipoCobranca (${tipoCobrancaEnum.options.join(', ')}), clienteId (número positivo), poloCliente (${poloProcessualEnum.options.join(', ')}). Partes (parteAutora e parteRe) são arrays de objetos com tipo (${parteTipoEnum.options.join(', ')}), id e nome. Datas devem estar no formato ISO string. Retorna o contrato criado.`,
    inputSchema: z.object({
      areaDireito: areaDireitoEnum,
      tipoContrato: tipoContratoEnum,
      tipoCobranca: tipoCobrancaEnum,
      clienteId: z.number().int().positive(),
      poloCliente: poloProcessualEnum,
      parteContrariaId: z.number().int().positive().optional(),
      parteAutora: z.array(parteContratoSchema).optional(),
      parteRe: z.array(parteContratoSchema).optional(),
      qtdeParteAutora: z.number().int().positive().optional(),
      qtdeParteRe: z.number().int().positive().optional(),
      status: statusContratoEnum.optional(),
      dataContratacao: z.string().optional(),
      dataAssinatura: z.string().optional(),
      dataDistribuicao: z.string().optional(),
      dataDesistencia: z.string().optional(),
      responsavelId: z.number().int().positive().optional(),
      createdBy: z.number().int().positive().optional(),
      observacoes: z.string().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args as Record<string, unknown>);
        const response = await client.post('/api/contratos', body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao criar contrato');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_contrato',
    description: `Atualiza um contrato existente parcialmente. Forneça o ID do contrato e os campos a atualizar em 'dados'. Campos incluem área de direito, tipo de contrato, status, responsável, observações, etc. Todos os campos são opcionais para atualização parcial. Retorna o contrato atualizado.`,
    inputSchema: z.object({
      id: z.number().int().positive(),
      dados: z.object({
        areaDireito: areaDireitoEnum.optional(),
        tipoContrato: tipoContratoEnum.optional(),
        tipoCobranca: tipoCobrancaEnum.optional(),
        clienteId: z.number().int().positive().optional(),
        poloCliente: poloProcessualEnum.optional(),
        parteContrariaId: z.number().int().positive().nullable().optional(),
        parteAutora: z.array(parteContratoSchema).optional(),
        parteRe: z.array(parteContratoSchema).optional(),
        qtdeParteAutora: z.number().int().positive().optional(),
        qtdeParteRe: z.number().int().positive().optional(),
        status: statusContratoEnum.optional(),
        dataContratacao: z.string().optional(),
        dataAssinatura: z.string().optional(),
        dataDistribuicao: z.string().optional(),
        dataDesistencia: z.string().optional(),
        responsavelId: z.number().int().positive().nullable().optional(),
        createdBy: z.number().int().positive().optional(),
        observacoes: z.string().optional(),
      }).partial(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number; dados: Record<string, unknown> };
        const body = toSnakeCase(typedArgs.dados);
        const response = await client.patch(`/api/contratos/${typedArgs.id}`, body);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao atualizar contrato');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];