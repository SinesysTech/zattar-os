import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils.js';

const acervoTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_acervo',
    description: `
Lista processos do acervo com filtros avançados, paginação, ordenação e agrupamento.

**Modos de listagem:**
- **Padrão**: Retorna lista paginada de processos com metadados de paginação.
- **Unificado (unified=true)**: Agrupa processos multi-instância (mesmo numero_processo em graus diferentes) em um único item, mostrando todas as instâncias.
- **Separado (unified=false)**: Retorna cada instância separadamente (modo legado).

**Agrupamento:**
- Quando 'agruparPor' é especificado, retorna dados agrupados por campo (ex: por TRT, grau, responsável).
- 'incluirContagem=true' (padrão): Retorna apenas contagens por grupo.
- 'incluirContagem=false': Retorna processos completos por grupo.

**Filtros disponíveis:**
- **Básicos**: origem (acervo_geral/arquivado), trt, grau, responsavelId (ID ou 'null' para sem responsável), semResponsavel.
- **Busca textual**: busca em numero_processo, nome_parte_autora, nome_parte_re, descricao_orgao_julgador, classe_judicial.
- **Específicos**: numeroProcesso, nomeParteAutora, nomeParteRe, descricaoOrgaoJulgador, classeJudicial, codigoStatusProcesso, segredoJustica, juizoDigital, temAssociacao.
- **Datas**: dataAutuacaoInicio/Fim, dataArquivamentoInicio/Fim, dataProximaAudienciaInicio/Fim, temProximaAudiencia.
- **Ordenação**: ordenarPor (campo), ordem (asc/desc).
- **Paginação**: pagina, limite.

Retorna JSON com 'processos' + 'paginacao' (modo padrão) ou 'agrupamentos' + 'total' (modo agrupado).
    `,
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().optional(),
      unified: z.boolean().optional(),
      origem: z.enum(['acervo_geral', 'arquivado']).optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      responsavelId: z.union([z.number().int().positive(), z.literal('null')]).optional(),
      semResponsavel: z.boolean().optional(),
      busca: z.string().optional(),
      numeroProcesso: z.string().optional(),
      nomeParteAutora: z.string().optional(),
      nomeParteRe: z.string().optional(),
      descricaoOrgaoJulgador: z.string().optional(),
      classeJudicial: z.string().optional(),
      codigoStatusProcesso: z.string().optional(),
      segredoJustica: z.boolean().optional(),
      juizoDigital: z.boolean().optional(),
      temAssociacao: z.boolean().optional(),
      dataAutuacaoInicio: z.string().optional(),
      dataAutuacaoFim: z.string().optional(),
      dataArquivamentoInicio: z.string().optional(),
      dataArquivamentoFim: z.string().optional(),
      dataProximaAudienciaInicio: z.string().optional(),
      dataProximaAudienciaFim: z.string().optional(),
      temProximaAudiencia: z.boolean().optional(),
      ordenarPor: z.enum([
        'data_autuacao',
        'numero_processo',
        'nome_parte_autora',
        'nome_parte_re',
        'data_arquivamento',
        'data_proxima_audiencia',
        'prioridade_processual',
        'created_at',
        'updated_at',
      ]).optional(),
      ordem: z.enum(['asc', 'desc']).optional(),
      agruparPor: z.enum([
        'trt',
        'grau',
        'origem',
        'responsavel_id',
        'classe_judicial',
        'codigo_status_processo',
        'orgao_julgador',
        'mes_autuacao',
        'ano_autuacao',
      ]).optional(),
      incluirContagem: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args as Record<string, unknown>);
        const response = await client.get('/api/acervo', params);
        if (!response.success) {
          return handleToolError(response.error || 'Unknown error');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_acervo',
    description: 'Busca um processo específico do acervo por ID. Retorna dados completos do processo ou erro 404 se não encontrado.',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { id: number };
        const response = await client.get(`/api/acervo/${typedArgs.id}`);
        if (!response.success) {
          return handleToolError(response.error || 'Processo não encontrado');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atribuir_responsavel_acervo',
    description: `
Atribui, transfere ou desatribui um responsável de um processo do acervo.

**Tipos de operação:**
- **Atribuição**: Quando o processo não tem responsável (responsavelId era null) e um ID é atribuído.
- **Transferência**: Quando o processo tem um responsável e é atribuído a outro ID.
- **Desatribuição**: Quando responsavelId é null, remove o responsável atual.

Retorna dados atualizados do processo ou erro 404/400.
    `,
    inputSchema: z.object({
      processoId: z.number().int().positive(),
      responsavelId: z.number().int().positive().nullable(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { processoId: number; responsavelId: number | null };
        const response = await client.patch(
          `/api/acervo/${typedArgs.processoId}/responsavel`,
          { responsavel_id: typedArgs.responsavelId }
        );
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao atribuir responsável');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_processos_do_cliente',
    description: `
Busca todos os processos em que um cliente participa (como autor ou réu).

**Parâmetros:**
- **clienteId** (obrigatório): ID do cliente para buscar os processos.

**Retorno:**
Array de processos com informações de participação:
- numero_processo, trt, grau, tipo_parte (autor/ré), polo (ativo/passivo)
- classe_judicial, codigo_status_processo, data_autuacao
- nome_parte_autora, nome_parte_re

**Uso típico no atendimento:**
1. Primeiro busque o cliente por CPF: sinesys_buscar_cliente_por_cpf
2. Com o ID do cliente, busque seus processos: sinesys_buscar_processos_do_cliente
    `,
    inputSchema: z.object({
      clienteId: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { clienteId: number };
        const response = await client.get(`/api/partes/processo-partes/entidade/cliente/${typedArgs.clienteId}`);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao buscar processos do cliente');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_timeline_processo',
    description: `
Busca a timeline completa de um processo, incluindo movimentações, documentos e links para Google Drive.

**Parâmetros:**
- **processoId** (obrigatório): ID do processo no acervo (não confundir com numero_processo).

**Retorno:**
Objeto com duas seções:
- **acervo**: Dados básicos do processo (PostgreSQL)
- **timeline**: Timeline completa com movimentos e documentos (MongoDB)
  - Movimentos processuais ordenados por data
  - Documentos anexados com links para Google Drive
  - Metadados da última captura

**Uso típico no atendimento:**
Para informar o cliente sobre o andamento do processo, mostrando as últimas movimentações.
    `,
    inputSchema: z.object({
      processoId: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { processoId: number };
        const response = await client.get(`/api/acervo/${typedArgs.processoId}/timeline`);
        if (!response.success) {
          return handleToolError(response.error || 'Timeline não encontrada');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { acervoTools };
