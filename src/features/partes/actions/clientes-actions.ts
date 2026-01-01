'use server';

/**
 * Server Actions para Clientes
 *
 * Utiliza wrapper safe-action para:
 * - Autenticacao automatica
 * - Validacao com Zod
 * - Tipagem forte
 * - Error handling consistente
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  authenticatedAction,
  authenticatedFormAction,
} from '@/lib/safe-action';
import {
  createClienteSchema,
  updateClienteSchema,
  type CreateClienteInput,
  type UpdateClienteInput,
  type ListarClientesParams,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const listarClientesSchema = z.object({
  pagina: z.number().min(1).optional().default(1),
  limite: z.number().min(1).max(100).optional().default(20),
  busca: z.string().optional(),
  tipo_pessoa: z.enum(['pf', 'pj']).optional(),
  ativo: z.boolean().optional(),
  ordenarPor: z.string().optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
});

const idSchema = z.object({
  id: z.number().min(1, 'ID invalido'),
});

const clienteSugestoesSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
});

// =============================================================================
// ACTIONS DE LEITURA (safe-action)
// =============================================================================

/**
 * Lista clientes com paginacao e filtros
 */
export const actionListarClientesSafe = authenticatedAction(
  listarClientesSchema,
  async (params) => {
    const result = await service.listarClientes(params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca um cliente pelo ID
 */
export const actionBuscarClienteSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.buscarCliente(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    if (!result.data) {
      throw new Error('Cliente nao encontrado');
    }
    return result.data;
  }
);

/**
 * Lista clientes para sugestoes (autocomplete)
 */
export const actionListarClientesSugestoesSafe = authenticatedAction(
  clienteSugestoesSchema,
  async (params) => {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const result = await service.listarClientes({ pagina: 1, limite: limit });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.tipo_pessoa === 'pf' ? c.cpf : undefined,
      cnpj: c.tipo_pessoa === 'pj' ? c.cnpj : undefined,
    }));
    return { options };
  }
);

// =============================================================================
// ACTIONS DE ESCRITA (safe-action)
// =============================================================================

/**
 * Cria um novo cliente (para uso com useActionState)
 */
export const actionCriarClienteSafe = authenticatedFormAction(
  createClienteSchema,
  async (data) => {
    const result = await service.criarCliente(data as CreateClienteInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/partes/clientes');
    revalidatePath('/partes');
    return result.data;
  }
);

/**
 * Atualiza um cliente existente
 */
export const actionAtualizarClienteSafe = authenticatedAction(
  z.object({
    id: z.number().min(1),
    data: updateClienteSchema,
  }),
  async ({ id, data }) => {
    const result = await service.atualizarCliente(id, data as UpdateClienteInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/partes/clientes');
    revalidatePath(`/partes/clientes/${id}`);
    revalidatePath('/partes');
    return result.data;
  }
);

/**
 * Desativa um cliente (soft delete)
 */
export const actionDesativarClienteSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.desativarCliente(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/partes/clientes');
    revalidatePath(`/partes/clientes/${id}`);
    revalidatePath('/partes');
    return null;
  }
);

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// Serao removidos apos atualizacao de todos os consumidores
// =============================================================================

export async function actionListarClientes(params: ListarClientesParams = {}) {
  try {
    const result = await service.listarClientes(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarCliente(id: number) {
  try {
    const result = await service.buscarCliente(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarCliente(id: number, input: Parameters<typeof service.atualizarCliente>[1]) {
  try {
    const result = await service.atualizarCliente(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/partes');
    revalidatePath(`/partes/clientes/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarClientesSugestoes(params?: { limit?: number; search?: string }) {
  try {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const result = await service.listarClientes({
      pagina: 1,
      limite: limit,
      busca: params?.search,
    });
    if (!result.success) return { success: false, error: result.error.message };

    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.tipo_pessoa === 'pf' ? c.cpf : undefined,
      cnpj: c.tipo_pessoa === 'pj' ? c.cnpj : undefined,
    }));

    return { success: true, data: { options } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca clientes para uso em combobox/autocomplete
 * Otimizado para performance com limite fixo de resultados
 */
export async function actionBuscarClientesParaCombobox(query: string = '') {
  try {
    const result = await service.listarClientes({
      busca: query,
      limite: 50, // Limite fixo para performance
      pagina: 1,
      ativo: true, // Apenas clientes ativos
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    // Retornar apenas id e nome para reduzir payload
    const options = result.data.data.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
    }));

    return { success: true, data: options };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca cliente por CPF com endereco e processos relacionados
 */
export async function actionBuscarClientePorCPF(cpf: string) {
  try {
    const result = await service.buscarClientePorCPF(cpf);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca cliente por CNPJ com endereco e processos relacionados
 */
export async function actionContarClientes() {
  try {
    const result = await service.contarClientes();
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Conta clientes e calcula variação percentual em relação ao mês anterior
 */
export async function actionContarClientesComEstatisticas() {
  try {
    // Total atual
    const resultAtual = await service.contarClientes();
    if (!resultAtual.success) {
      return { success: false, error: resultAtual.error.message };
    }

    // Data do final do mês anterior
    const agora = new Date();
    const primeiroDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual);
    ultimoDiaMesAnterior.setDate(0); // Vai para o último dia do mês anterior
    ultimoDiaMesAnterior.setHours(23, 59, 59, 999);

    // Total do mês anterior
    const resultMesAnterior = await service.contarClientesAteData(ultimoDiaMesAnterior);
    if (!resultMesAnterior.success) {
      // Se falhar, retorna apenas o total atual sem estatística
      return {
        success: true,
        data: {
          total: resultAtual.data,
          variacaoPercentual: null,
        },
      };
    }

    const totalAtual = resultAtual.data;
    const totalMesAnterior = resultMesAnterior.data;

    // Calcular variação percentual
    let variacaoPercentual: number | null = null;
    if (totalMesAnterior > 0) {
      variacaoPercentual = ((totalAtual - totalMesAnterior) / totalMesAnterior) * 100;
    } else if (totalAtual > 0) {
      // Se não havia clientes no mês anterior e agora há, é 100% de crescimento
      variacaoPercentual = 100;
    }

    return {
      success: true,
      data: {
        total: totalAtual,
        variacaoPercentual,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Conta clientes agrupados por estado
 */
export async function actionContarClientesPorEstado(limite: number = 4) {
  try {
    const result = await service.contarClientesPorEstado(limite);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarClientePorCNPJ(cnpj: string) {
  try {
    const result = await service.buscarClientePorCNPJ(cnpj);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
