/**
 * Registro de Ferramentas MCP - Partes
 *
 * Tools disponíveis:
 * - listar_clientes: Lista clientes com filtros
 * - buscar_cliente_por_cpf: Busca cliente por CPF
 * - buscar_cliente_por_cnpj: Busca cliente por CNPJ
 * - atualizar_cliente: Atualiza dados do cliente (parcial)
 * - listar_partes_contrarias: Lista partes contrárias
 * - buscar_parte_contraria_por_cpf: Busca parte contrária por CPF
 * - buscar_parte_contraria_por_cnpj: Busca parte contrária por CNPJ
 * - buscar_partes_contrarias_por_nome: Busca por razão social/nome (typeahead)
 * - atualizar_parte_contraria: Atualiza dados da parte contrária (parcial)
 * - listar_terceiros: Lista terceiros
 * - listar_representantes: Lista representantes (advogados)
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { jsonResult, errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Partes
 */
export async function registerPartesTools(): Promise<void> {
  const {
    actionListarClientes,
    actionBuscarClientePorCPF,
    actionBuscarClientePorCNPJ,
    actionAtualizarCliente,
    actionListarPartesContrarias,
    actionListarTerceiros,
    actionListarRepresentantes,
  } = await import('@/app/(authenticated)/partes/server');

  const {
    findParteContrariaByCPF,
    findParteContrariaByCNPJ,
    searchPartesContrariaComEndereco,
    atualizarParteContraria: serviceAtualizarParteContraria,
  } = await import('@/app/(authenticated)/partes/server');

  const { normalizarDocumento } = await import('@/app/(authenticated)/partes');

  /**
   * Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)
   */
  registerMcpTool({
    name: 'listar_clientes',
    description: 'Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de clientes'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou CPF/CNPJ'),
      tipo_pessoa: z.enum(['pf', 'pj']).optional().describe('Tipo de pessoa (pf=física, pj=jurídica)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarClientes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar clientes');
      }
    },
  });

  /**
   * Busca cliente por CPF com endereço e processos relacionados
   */
  registerMcpTool({
    name: 'buscar_cliente_por_cpf',
    description: 'Busca cliente por CPF com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cpf } = args as { cpf: string };
        const result = await actionBuscarClientePorCPF(cpf);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CPF');
      }
    },
  });

  /**
   * Busca cliente por CNPJ com endereço e processos relacionados
   */
  registerMcpTool({
    name: 'buscar_cliente_por_cnpj',
    description: 'Busca cliente por CNPJ com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cnpj } = args as { cnpj: string };
        const result = await actionBuscarClientePorCNPJ(cnpj);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CNPJ');
      }
    },
  });

  /**
   * Lista partes contrárias cadastradas no sistema
   */
  registerMcpTool({
    name: 'listar_partes_contrarias',
    description: 'Lista partes contrárias cadastradas no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarPartesContrarias({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar partes contrárias');
      }
    },
  });

  /**
   * Lista terceiros cadastrados no sistema
   */
  registerMcpTool({
    name: 'listar_terceiros',
    description: 'Lista terceiros cadastrados no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarTerceiros({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar terceiros');
      }
    },
  });

  /**
   * Lista representantes (advogados, procuradores) do sistema
   */
  registerMcpTool({
    name: 'listar_representantes',
    description: 'Lista representantes (advogados, procuradores) do sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou OAB'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarRepresentantes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar representantes');
      }
    },
  });

  // ===========================================================================
  // BUSCAS DE PARTE CONTRÁRIA (para fluxo "buscar antes de criar")
  // ===========================================================================

  /**
   * Busca parte contrária pelo CPF (PF)
   */
  registerMcpTool({
    name: 'buscar_parte_contraria_por_cpf',
    description:
      'Busca parte contrária pessoa física pelo CPF. Use ANTES de tentar cadastrar uma nova parte contrária para evitar duplicatas.',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF da parte contrária (apenas números ou formatado)'),
    }),
    handler: async (args) => {
      try {
        const cpfNorm = normalizarDocumento(args.cpf);
        const result = await findParteContrariaByCPF(cpfNorm);
        if (!result.success) return errorResult(result.error.message);
        if (!result.data) {
          return jsonResult({
            encontrado: false,
            mensagem: 'Nenhuma parte contrária encontrada com este CPF — pode ser cadastrada como nova.',
          });
        }
        return jsonResult({ encontrado: true, parte_contraria: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar parte contrária');
      }
    },
  });

  /**
   * Busca parte contrária pelo CNPJ (PJ)
   */
  registerMcpTool({
    name: 'buscar_parte_contraria_por_cnpj',
    description:
      'Busca parte contrária pessoa jurídica pelo CNPJ. Use ANTES de tentar cadastrar uma nova parte contrária para evitar duplicatas (especialmente apps como Uber, iFood, 99).',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ da parte contrária (apenas números ou formatado)'),
    }),
    handler: async (args) => {
      try {
        const cnpjNorm = normalizarDocumento(args.cnpj);
        const result = await findParteContrariaByCNPJ(cnpjNorm);
        if (!result.success) return errorResult(result.error.message);
        if (!result.data) {
          return jsonResult({
            encontrado: false,
            mensagem: 'Nenhuma parte contrária encontrada com este CNPJ — pode ser cadastrada como nova.',
          });
        }
        return jsonResult({ encontrado: true, parte_contraria: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar parte contrária');
      }
    },
  });

  /**
   * Busca partes contrárias por nome/razão social (typeahead com endereço)
   */
  registerMcpTool({
    name: 'buscar_partes_contrarias_por_nome',
    description:
      'Busca partes contrárias por nome ou razão social (busca textual, retorna até 10 resultados com endereço). Use quando não houver CPF/CNPJ e você precisar verificar se a parte já está cadastrada.',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      busca: z.string().min(2).describe('Termo de busca (nome ou razão social)'),
    }),
    handler: async (args) => {
      try {
        const result = await searchPartesContrariaComEndereco(args.busca.trim(), 10);
        if (!result.success) return errorResult(result.error.message);
        return jsonResult({
          total: result.data.length,
          partes_contrarias: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar partes contrárias');
      }
    },
  });

  // ===========================================================================
  // EDIÇÃO PARCIAL DE CLIENTE / PARTE CONTRÁRIA
  // ===========================================================================

  /**
   * Atualiza dados de um cliente já cadastrado (envie SOMENTE os campos a alterar)
   */
  registerMcpTool({
    name: 'atualizar_cliente',
    description:
      'Atualiza dados de um cliente JÁ CADASTRADO. Envie SOMENTE os campos que deseja alterar (atualização parcial). NUNCA use para criar — use o cadastro unificado para isso.',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do cliente a atualizar'),
      nome: z.string().min(1).max(500).optional(),
      emails: z.array(z.string().email()).nullable().optional(),
      ddd_celular: z.string().max(5).nullable().optional(),
      numero_celular: z.string().max(15).nullable().optional(),
      ddd_residencial: z.string().max(5).nullable().optional(),
      numero_residencial: z.string().max(15).nullable().optional(),
      rg: z.string().max(30).nullable().optional(),
      data_nascimento: z.string().nullable().optional().describe('YYYY-MM-DD'),
      estado_civil: z.string().max(50).nullable().optional(),
      genero: z.string().max(50).nullable().optional(),
      nacionalidade: z.string().max(100).nullable().optional(),
      observacoes: z.string().max(5000).nullable().optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...campos } = args;
        const result = await actionAtualizarCliente(id, campos);
        if (!result.success) return errorResult(result.error ?? 'Erro ao atualizar cliente');
        return jsonResult({
          mensagem: 'Cliente atualizado com sucesso',
          cliente: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar cliente');
      }
    },
  });

  /**
   * Atualiza dados de uma parte contrária já cadastrada (envie SOMENTE os campos a alterar)
   */
  registerMcpTool({
    name: 'atualizar_parte_contraria',
    description:
      'Atualiza dados de uma parte contrária JÁ CADASTRADA. Envie SOMENTE os campos que deseja alterar (atualização parcial). NUNCA use para criar.',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID da parte contrária a atualizar'),
      nome: z.string().min(1).max(500).optional(),
      nome_social_fantasia: z.string().max(500).nullable().optional(),
      emails: z.array(z.string().email()).nullable().optional(),
      ddd_celular: z.string().max(5).nullable().optional(),
      numero_celular: z.string().max(15).nullable().optional(),
      observacoes: z.string().max(5000).nullable().optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...campos } = args;
        const result = await serviceAtualizarParteContraria(id, campos);
        if (!result.success) return errorResult(result.error.message);
        return jsonResult({
          mensagem: 'Parte contrária atualizada com sucesso',
          parte_contraria: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar parte contrária');
      }
    },
  });
}
