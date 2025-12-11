/**
 * Server Actions for Acervo Feature
 * Replaces REST API routes with Next.js Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';
import {
  obterAcervo,
  buscarProcessoPorId,
  atribuirResponsavel as atribuirResponsavelService,
  buscarProcessosClientePorCpf as buscarProcessosClientePorCpfService,
} from './service';
import {
  listarAcervoParamsSchema,
  atribuirResponsavelSchema,
  type ListarAcervoParams,
} from './types';
import type { ActionResponse } from '@/types';

/**
 * Lists acervo with filters, pagination, and sorting
 */
export async function actionListarAcervo(
  params: ListarAcervoParams = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'acervo:visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para visualizar acervo' };
    }

    // Validate params
    const validatedParams = listarAcervoParamsSchema.parse(params);

    // Get acervo
    const result = await obterAcervo(validatedParams);

    return { success: true, data: result };
  } catch (error) {
    console.error('[actionListarAcervo] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar acervo',
    };
  }
}

/**
 * Searches for a process by ID
 */
export async function actionBuscarProcesso(
  id: number
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'acervo:visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para visualizar acervo' };
    }

    const processo = await buscarProcessoPorId(id);

    if (!processo) {
      return { success: false, error: 'Processo não encontrado' };
    }

    return { success: true, data: processo };
  } catch (error) {
    console.error('[actionBuscarProcesso] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar processo',
    };
  }
}

/**
 * Assigns responsible user to processes
 */
export async function actionAtribuirResponsavel(
  processoIds: number[],
  responsavelId: number | null
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'acervo:editar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para editar acervo' };
    }

    // Validate params
    const validatedParams = atribuirResponsavelSchema.parse({
      processoIds,
      responsavelId,
    });

    // Assign responsible
    const result = await atribuirResponsavelService(
      validatedParams.processoIds,
      validatedParams.responsavelId,
      user.id
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Revalidate acervo pages
    revalidatePath('/acervo');
    revalidatePath('/processos');

    return { success: true, data: { message: 'Responsável atribuído com sucesso' } };
  } catch (error) {
    console.error('[actionAtribuirResponsavel] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atribuir responsável',
    };
  }
}

/**
 * Searches for processes by client CPF
 * Used by AI Agent for WhatsApp integration
 */
export async function actionBuscarProcessosClientePorCpf(
  cpf: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'acervo:visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para visualizar acervo' };
    }

    const result = await buscarProcessosClientePorCpfService(cpf);

    return result;
  } catch (error) {
    console.error('[actionBuscarProcessosClientePorCpf] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar processos por CPF',
    };
  }
}

/**
 * Exports acervo to CSV
 */
export async function actionExportarAcervoCSV(
  params: ListarAcervoParams = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'acervo:visualizar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para exportar acervo' };
    }

    // Get all data (no pagination for export)
    const result = await obterAcervo({ ...params, limite: 10000 });

    if (!('processos' in result)) {
      return { success: false, error: 'Formato de resultado inválido para exportação' };
    }

    // Convert to CSV format
    const headers = [
      'Número do Processo',
      'TRT',
      'Grau',
      'Origem',
      'Classe Judicial',
      'Parte Autora',
      'Parte Ré',
      'Órgão Julgador',
      'Data de Autuação',
      'Status',
      'Responsável ID',
    ];

    const rows = result.processos.map(p => [
      p.numero_processo,
      p.trt,
      p.grau,
      p.origem,
      p.classe_judicial,
      p.nome_parte_autora,
      p.nome_parte_re,
      p.descricao_orgao_julgador,
      p.data_autuacao,
      p.status,
      p.responsavel_id?.toString() ?? '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      success: true,
      data: {
        csv,
        filename: `acervo_${new Date().toISOString().split('T')[0]}.csv`,
      },
    };
  } catch (error) {
    console.error('[actionExportarAcervoCSV] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao exportar acervo',
    };
  }
}
