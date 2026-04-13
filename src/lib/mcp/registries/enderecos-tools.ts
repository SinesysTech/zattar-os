/**
 * Registro de Ferramentas MCP - Endereços
 *
 * Tools disponíveis:
 * - criar_endereco: Cria um novo endereço vinculado a uma entidade
 * - atualizar_endereco: Atualiza os dados de um endereço existente
 * - buscar_endereco: Busca um endereço pelo ID
 * - buscar_enderecos_entidade: Busca todos os endereços de uma entidade
 * - listar_enderecos: Lista endereços com paginação e busca textual
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Endereços
 */
export async function registerEnderecosTools(): Promise<void> {
  const {
    criarEndereco,
    atualizarEndereco,
    buscarEnderecoPorId,
    buscarEnderecosPorEntidade,
    listarEnderecos,
  } = await import('@/app/(authenticated)/enderecos/service');

  /**
   * Cria um novo endereço vinculado a uma entidade (cliente, parte contrária ou terceiro)
   */
  registerMcpTool({
    name: 'criar_endereco',
    description: 'Cria um novo endereço e o vincula a uma entidade do sistema (cliente, parte contrária ou terceiro)',
    feature: 'enderecos',
    requiresAuth: true,
    schema: z.object({
      cep: z.string().describe('CEP do endereço (apenas números, ex: 01310100)'),
      logradouro: z.string().describe('Nome da rua, avenida ou logradouro'),
      numero: z.string().optional().describe('Número do imóvel'),
      complemento: z.string().optional().describe('Complemento do endereço (apto, sala, bloco, etc.)'),
      bairro: z.string().describe('Bairro do endereço'),
      municipio: z.string().describe('Município/cidade do endereço'),
      estado: z.string().describe('UF do estado (ex: SP, RJ, MG)'),
      entidade_tipo: z
        .enum(['cliente', 'parte_contraria', 'terceiro'])
        .describe('Tipo da entidade a qual o endereço pertence'),
      entidade_id: z.number().describe('ID da entidade a qual o endereço pertence'),
    }),
    handler: async (args) => {
      try {
        const result = await criarEndereco({
          cep: args.cep,
          logradouro: args.logradouro,
          numero: args.numero,
          complemento: args.complemento,
          bairro: args.bairro,
          municipio: args.municipio,
          estado: args.estado,
          entidade_tipo: args.entidade_tipo,
          entidade_id: args.entidade_id,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao criar endereço');
        }

        return jsonResult({
          message: 'Endereço criado com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao criar endereço');
      }
    },
  });

  /**
   * Atualiza os dados de um endereço existente
   */
  registerMcpTool({
    name: 'atualizar_endereco',
    description: 'Atualiza os dados de um endereço existente no sistema',
    feature: 'enderecos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do endereço a ser atualizado'),
      cep: z.string().optional().describe('Novo CEP do endereço'),
      logradouro: z.string().optional().describe('Novo logradouro'),
      numero: z.string().optional().describe('Novo número'),
      complemento: z.string().optional().describe('Novo complemento'),
      bairro: z.string().optional().describe('Novo bairro'),
      municipio: z.string().optional().describe('Novo município/cidade'),
      estado: z.string().optional().describe('Nova UF do estado'),
    }),
    handler: async (args) => {
      try {
        const result = await atualizarEndereco({
          id: args.id,
          cep: args.cep,
          logradouro: args.logradouro,
          numero: args.numero,
          complemento: args.complemento,
          bairro: args.bairro,
          municipio: args.municipio,
          estado: args.estado,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao atualizar endereço');
        }

        return jsonResult({
          message: 'Endereço atualizado com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao atualizar endereço');
      }
    },
  });

  /**
   * Busca um endereço específico pelo ID
   */
  registerMcpTool({
    name: 'buscar_endereco',
    description: 'Busca os dados de um endereço específico pelo ID',
    feature: 'enderecos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do endereço a ser buscado'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarEnderecoPorId(args.id);

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao buscar endereço');
        }

        return jsonResult({
          message: 'Endereço encontrado',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao buscar endereço');
      }
    },
  });

  /**
   * Busca todos os endereços de uma entidade específica
   */
  registerMcpTool({
    name: 'buscar_enderecos_entidade',
    description: 'Busca todos os endereços cadastrados para uma entidade específica (cliente, parte contrária ou terceiro)',
    feature: 'enderecos',
    requiresAuth: true,
    schema: z.object({
      entidade_tipo: z
        .enum(['cliente', 'parte_contraria', 'terceiro'])
        .describe('Tipo da entidade'),
      entidade_id: z.number().describe('ID da entidade'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarEnderecosPorEntidade({
          entidade_tipo: args.entidade_tipo,
          entidade_id: args.entidade_id,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao buscar endereços da entidade');
        }

        return jsonResult({
          message: `${(result.data as unknown[])?.length ?? 0} endereço(s) encontrado(s)`,
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao buscar endereços da entidade');
      }
    },
  });

  /**
   * Lista endereços com paginação e busca textual
   */
  registerMcpTool({
    name: 'listar_enderecos',
    description: 'Lista endereços cadastrados no sistema com suporte a paginação e busca textual',
    feature: 'enderecos',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().optional().default(1).describe('Número da página (padrão: 1)'),
      limite: z.number().optional().default(20).describe('Quantidade de registros por página (padrão: 20)'),
      busca: z.string().optional().describe('Busca textual por logradouro, bairro ou cidade'),
    }),
    handler: async (args) => {
      try {
        const result = await listarEnderecos({
          pagina: args.pagina,
          limite: args.limite,
          busca: args.busca,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao listar endereços');
        }

        return jsonResult({
          message: 'Endereços listados com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao listar endereços');
      }
    },
  });
}
