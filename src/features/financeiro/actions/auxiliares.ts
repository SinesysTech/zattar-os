'use server';

/**
 * Server Actions auxiliares do Financeiro
 * (contas bancárias, centros de custo, etc.)
 */

import { FluxoCaixaRepository } from '../repository/fluxo-caixa';

export async function actionListarContasBancariasAtivas() {
  try {
    const contas = await FluxoCaixaRepository.listarContasBancarias();
    return { success: true, data: contas };
  } catch (error) {
    console.error('Erro ao listar contas bancárias:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
  }
}

export async function actionListarCentrosCustoAtivos() {
  try {
    const centros = await FluxoCaixaRepository.listarCentrosCusto();
    return { success: true, data: centros };
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
  }
}


