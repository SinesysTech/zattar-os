'use server';

import { authenticateRequest } from '@/lib/auth/session';
import { obterEstatisticasProcessos, type ProcessoStats } from '../service-estatisticas';

export async function actionObterEstatisticasProcessos(): Promise<{
  success: boolean;
  data?: ProcessoStats;
  error?: string;
}> {
  try {
    await authenticateRequest();
    const stats = await obterEstatisticasProcessos();
    return { success: true, data: stats };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { success: false, error: 'Erro ao carregar estatísticas' };
  }
}
