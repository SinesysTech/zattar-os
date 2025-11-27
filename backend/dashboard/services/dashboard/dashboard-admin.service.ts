/**
 * Serviço de Dashboard para Superadmin
 *
 * Agrega métricas globais do escritório para visão gerencial
 */

import { getProximasAudiencias } from '../persistence/dashboard-audiencias.persistence';
import { getExpedientesUrgentes } from '../persistence/dashboard-expedientes.persistence';
import {
  getMetricasEscritorio,
  getCargaUsuarios,
  getStatusCapturas,
  getPerformanceAdvogados,
} from '../persistence/dashboard-metricas.persistence';
import type { DashboardAdminData } from '@/backend/types/dashboard/types';

/**
 * Obtém dados completos da dashboard para admin
 */
export async function getDashboardAdmin(): Promise<DashboardAdminData> {
  // Buscar todos os dados em paralelo
  const [
    metricas,
    cargaUsuarios,
    statusCapturas,
    performanceAdvogados,
    proximasAudiencias,
    expedientesUrgentes,
  ] = await Promise.all([
    getMetricasEscritorio(),
    getCargaUsuarios(),
    getStatusCapturas(),
    getPerformanceAdvogados(),
    getProximasAudiencias(undefined, 5), // Todas as audiências
    getExpedientesUrgentes(undefined, 5), // Todos os expedientes
  ]);

  return {
    role: 'admin',
    metricas,
    cargaUsuarios,
    statusCapturas,
    performanceAdvogados,
    proximasAudiencias,
    expedientesUrgentes,
    ultimaAtualizacao: new Date().toISOString(),
  };
}
