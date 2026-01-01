'use server';

/**
 * Server Actions para Partes Contrarias
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
  createParteContrariaSchema,
  updateParteContrariaSchema,
  type CreateParteContrariaInput,
  type UpdateParteContrariaInput,
  type ListarPartesContrariasParams,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const listarPartesContrariasSchema = z.object({
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

// =============================================================================
// ACTIONS DE LEITURA (safe-action)
// =============================================================================

/**
 * Lista partes contrarias com paginacao e filtros
 */
export const actionListarPartesContrariasSafe = authenticatedAction(
  listarPartesContrariasSchema,
  async (params) => {
    const result = await service.listarPartesContrarias(params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca uma parte contraria pelo ID
 */
export const actionBuscarParteContrariaSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.buscarParteContraria(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    if (!result.data) {
      throw new Error('Parte contraria nao encontrada');
    }
    return result.data;
  }
);

// =============================================================================
// ACTIONS DE ESCRITA (safe-action)
// =============================================================================

/**
 * Cria uma nova parte contraria (para uso com useActionState)
 */
export const actionCriarParteContrariaSafe = authenticatedFormAction(
  createParteContrariaSchema,
  async (data) => {
    const result = await service.criarParteContraria(data as CreateParteContrariaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/partes/partes-contrarias');
    revalidatePath('/partes');
    return result.data;
  }
);

/**
 * Atualiza uma parte contraria existente
 */
export const actionAtualizarParteContrariaSafe = authenticatedAction(
  z.object({
    id: z.number().min(1),
    data: updateParteContrariaSchema,
  }),
  async ({ id, data }) => {
    const result = await service.atualizarParteContraria(id, data as UpdateParteContrariaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/partes/partes-contrarias');
    revalidatePath(`/partes/partes-contrarias/${id}`);
    revalidatePath('/partes');
    return result.data;
  }
);

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// Serao removidos apos atualizacao de todos os consumidores
// =============================================================================

export async function actionListarPartesContrarias(params: ListarPartesContrariasParams = {}) {
  try {
    const result = await service.listarPartesContrarias(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarParteContraria(id: number) {
  try {
    const result = await service.buscarParteContraria(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Parte contraria nao encontrada' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarParteContraria(id: number, input: Parameters<typeof service.atualizarParteContraria>[1]) {
  try {
    const result = await service.atualizarParteContraria(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/partes');
    revalidatePath(`/partes/partes-contrarias/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca partes contrarias para uso em combobox/autocomplete
 * Otimizado para performance com limite fixo de resultados
 */
/**
 * Conta partes contrárias e calcula variação percentual em relação ao mês anterior
 */
export async function actionContarPartesContrariasComEstatisticas() {
  try {
    // Total atual
    const resultAtual = await service.contarPartesContrarias();
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
    const resultMesAnterior = await service.contarPartesContrariasAteData(ultimoDiaMesAnterior);
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
      // Se não havia partes contrárias no mês anterior e agora há, é 100% de crescimento
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

export async function actionBuscarPartesContrariasParaCombobox(query: string = '') {
  try {
    const result = await service.listarPartesContrarias({
      busca: query,
      limite: 50, // Limite fixo para performance
      pagina: 1,
      // Nota: tabela usa 'ativo' (boolean), não 'situacao'
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    // Retornar apenas id e nome para reduzir payload
    const options = result.data.data.map(parte => ({
      id: parte.id,
      nome: parte.nome,
    }));

    return { success: true, data: options };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
