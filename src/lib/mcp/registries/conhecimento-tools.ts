import { z } from 'zod';
import { registerMcpTool } from '../server';
import { errorResult } from '../types';
import { createServiceClient } from '@/lib/supabase/service-client';
import { gerarEmbedding } from '@/lib/ai/embedding';

/**
 * Registra ferramentas MCP do módulo Conhecimento (loja vetorial).
 * Expõe duas tools genéricas para agentes CopilotKit consumirem:
 *  - listar_bases_conhecimento: descoberta de coleções disponíveis
 *  - buscar_conhecimento: busca semântica nas bases
 */
export async function registerConhecimentoTools(): Promise<void> {
  registerMcpTool({
    name: 'listar_bases_conhecimento',
    description:
      'Lista todas as bases de conhecimento do escritório (jurisprudências, doutrina, modelos de petição). ' +
      'Use quando o usuário pedir contexto jurídico, jurisprudência, modelo de peça ou doutrina, ' +
      'para descobrir quais bases existem antes de buscar.',
    feature: 'conhecimento',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from('knowledge_bases')
          .select('id, nome, slug, descricao, total_documentos, total_chunks')
          .order('nome');
        if (error) throw error;
        return {
          content: [
            {
              type: 'text',
              text: `${(data ?? []).length} bases de conhecimento disponíveis.`,
            },
          ],
          structuredContent: { bases: data ?? [] },
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : 'Erro ao listar bases');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_conhecimento',
    description:
      'Busca semântica nas bases de conhecimento do escritório. Retorna chunks relevantes ' +
      'com fonte (base e documento). Use quando precisar de jurisprudência, doutrina, modelo ' +
      'de petição ou referência jurídica para fundamentar uma resposta.',
    feature: 'conhecimento',
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe('Pergunta ou trecho a buscar semanticamente'),
      base_ids: z.array(z.number().int().positive()).optional()
        .describe('IDs das bases para filtrar; vazio = busca em todas'),
      limit: z.number().int().min(1).max(20).default(8)
        .describe('Quantidade máxima de chunks a retornar'),
      threshold: z.number().min(0).max(1).default(0.0)
        .describe('Similaridade mínima do componente vetorial (0-1); com RRF o padrão é 0.0'),
    }),
    handler: async (args) => {
      try {
        const { query, base_ids, limit, threshold } = args as {
          query: string;
          base_ids?: number[];
          limit: number;
          threshold: number;
        };
        const embedding = await gerarEmbedding(query);
        const supabase = createServiceClient();
        const { data, error } = await supabase.rpc('match_knowledge_hybrid', {
          query_text: query,
          query_embedding: embedding as unknown as string,
          filter_base_ids: base_ids ?? null,
          match_count: limit,
          match_threshold: threshold,
        });
        if (error) throw error;
        const resultados = data ?? [];
        return {
          content: [
            {
              type: 'text',
              text: `${resultados.length} resultados encontrados.`,
            },
          ],
          structuredContent: { resultados },
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : 'Erro na busca');
      }
    },
  });
}
