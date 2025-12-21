
'use server'

import { revalidatePath } from 'next/cache';
import * as service from '../service';
import { criarAcordoComParcelasSchema, type StatusAcordo, type TipoObrigacao, type DirecaoPagamento } from '../domain';
import { AtualizarAcordoParams, ListarAcordosParams } from '../types';
import { sincronizarAcordoCompleto, verificarConsistencia } from '@/features/financeiro/services/obrigacoes-integracao';

export async function actionListarAcordos(params: ListarAcordosParams) {
  try {
    const data = await service.listarAcordos(params);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarAcordo(id: number) {
  try {
    const data = await service.buscarAcordo(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarAcordoComParcelas(formData: FormData | object) {
  try {
    const params = (formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData) as Record<string, FormDataEntryValue | number | string>;
    
    // Type coercion for numbers if coming from FormData
    if (formData instanceof FormData) {
        // Simple helper to parse numbers
        const keysToNumber = ['processoId', 'valorTotal', 'numeroParcelas', 'percentualEscritorio', 'honorariosSucumbenciaisTotal', 'intervaloEntreParcelas'];
        keysToNumber.forEach(k => {
            if (params[k]) params[k] = Number(params[k]);
        });
    }

    const validacao = criarAcordoComParcelasSchema.safeParse(params);
    if (!validacao.success) {
      return { success: false, error: validacao.error.errors[0].message };
    }

    const data = await service.criarAcordoComParcelas(validacao.data);
    revalidatePath('/financeiro/obrigacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarAcordo(id: number, dados: AtualizarAcordoParams) {
  try {
    const data = await service.atualizarAcordo(id, dados);
    revalidatePath('/financeiro/obrigacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


export async function actionDeletarAcordo(id: number) {
  try {
    await service.deletarAcordo(id);
    revalidatePath('/financeiro/obrigacoes');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarObrigacoesPorPeriodo(
  params: {
    dataInicio: string;
    dataFim: string;
    incluirSemData?: boolean;
    status?: StatusAcordo;
    tipo?: TipoObrigacao;
    direcao?: DirecaoPagamento;
    busca?: string;
  }
) {
  try {
    // Reutiliza o serviço de listar acordos mas com limite alto para calendário
    const result = await service.listarAcordos({
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      status: params.status,
      tipo: params.tipo,
      direcao: params.direcao,
      busca: params.busca,
      limite: 1000, 
    });
    
    return { success: true, data: result.acordos };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar obrigações',
    };
  }
}

export async function actionSincronizarAcordo(id: number, forcar: boolean = false) {
  try {
    const data = await sincronizarAcordoCompleto(id, forcar);
    revalidatePath(`/acordos-condenacoes/${id}`);
    revalidatePath('/financeiro/obrigacoes');
    return { success: data.sucesso, data, error: data.sucesso ? undefined : (data.erros?.join(', ') || 'Erro na sincronização') };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionVerificarConsistencia(id: number) {
  try {
    const data = await verificarConsistencia(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


