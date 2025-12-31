'use server';

import {
  buscarEstatisticasAtividades,
  buscarProcessosAtribuidos,
  buscarAudienciasAtribuidas,
  buscarPendentesAtribuidos,
  buscarContratosAtribuidos,
} from '../repository-atividades';
import { requireAuth } from './utils';

export async function actionBuscarEstatisticasAtividades(usuarioId: number) {
  try {
    await requireAuth(['usuarios:visualizar']);

    const estatisticas = await buscarEstatisticasAtividades(usuarioId);

    return {
      success: true,
      data: estatisticas,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de atividades:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
      data: { processos: 0, audiencias: 0, pendentes: 0, contratos: 0 },
    };
  }
}

export async function actionBuscarProcessosAtribuidos(usuarioId: number, limite?: number) {
  try {
    // Validar permissão de visualizar processos
    await requireAuth(['acervo:visualizar']);

    const processos = await buscarProcessosAtribuidos(usuarioId, limite);

    return {
      success: true,
      data: processos,
    };
  } catch (error) {
    console.error('Erro ao buscar processos atribuídos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar processos',
      data: [],
    };
  }
}

export async function actionBuscarAudienciasAtribuidas(usuarioId: number, limite?: number) {
  try {
    // Validar permissão de visualizar audiências
    await requireAuth(['audiencias:visualizar']);

    const audiencias = await buscarAudienciasAtribuidas(usuarioId, limite);

    return {
      success: true,
      data: audiencias,
    };
  } catch (error) {
    console.error('Erro ao buscar audiências atribuídas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar audiências',
      data: [],
    };
  }
}

export async function actionBuscarPendentesAtribuidos(usuarioId: number, limite?: number) {
  try {
    // Validar permissão de visualizar expedientes
    await requireAuth(['expedientes:visualizar']);

    const pendentes = await buscarPendentesAtribuidos(usuarioId, limite);

    return {
      success: true,
      data: pendentes,
    };
  } catch (error) {
    console.error('Erro ao buscar pendentes atribuídos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar pendentes',
      data: [],
    };
  }
}

export async function actionBuscarContratosAtribuidos(usuarioId: number, limite?: number) {
  try {
    // Validar permissão de visualizar contratos
    await requireAuth(['contratos:visualizar']);

    const contratos = await buscarContratosAtribuidos(usuarioId, limite);

    return {
      success: true,
      data: contratos,
    };
  } catch (error) {
    console.error('Erro ao buscar contratos atribuídos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar contratos',
      data: [],
    };
  }
}
