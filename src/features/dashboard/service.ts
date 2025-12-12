/**
 * Service Layer do Dashboard
 * Orquestração e agregação de dados
 *
 * Migrado de:
 * - backend/dashboard/services/dashboard/dashboard-usuario.service.ts
 * - backend/dashboard/services/dashboard/dashboard-admin.service.ts
 */

import * as repo from './repository';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
} from './domain';

// ============================================================================
// Dashboard de Usuário
// ============================================================================

/**
 * Obtém dados completos da dashboard para um usuário
 */
export async function obterDashboardUsuario(
  usuarioId: number
): Promise<DashboardUsuarioData> {
  // Buscar dados do usuário
  const usuario = await repo.buscarUsuario(usuarioId);

  // Buscar todos os dados em paralelo
  const [
    processos,
    audiencias,
    expedientes,
    proximasAudiencias,
    expedientesUrgentes,
    produtividade,
  ] = await Promise.all([
    repo.buscarProcessosResumo(usuarioId),
    repo.buscarAudienciasResumo(usuarioId),
    repo.buscarExpedientesResumo(usuarioId),
    repo.buscarProximasAudiencias(usuarioId, 5),
    repo.buscarExpedientesUrgentes(usuarioId, 5),
    repo.buscarProdutividadeUsuario(usuarioId),
  ]);

  return {
    role: 'user',
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
    },
    processos,
    audiencias,
    expedientes,
    produtividade,
    proximasAudiencias,
    expedientesUrgentes,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// ============================================================================
// Dashboard de Admin
// ============================================================================

/**
 * Obtém dados completos da dashboard para admin
 */
export async function obterDashboardAdmin(): Promise<DashboardAdminData> {
  // Buscar todos os dados em paralelo
  const [
    metricas,
    cargaUsuarios,
    statusCapturas,
    performanceAdvogados,
    proximasAudiencias,
    expedientesUrgentes,
  ] = await Promise.all([
    repo.buscarMetricasEscritorio(),
    repo.buscarCargaUsuarios(),
    repo.buscarStatusCapturas(),
    repo.buscarPerformanceAdvogados(),
    repo.buscarProximasAudiencias(undefined, 5), // Todas as audiências
    repo.buscarExpedientesUrgentes(undefined, 5), // Todos os expedientes
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

// ============================================================================
// Métricas Específicas
// ============================================================================

/**
 * Obtém apenas métricas do escritório (para admin)
 */
export async function obterMetricasEscritorio() {
  const [metricas, cargaUsuarios, performanceAdvogados] = await Promise.all([
    repo.buscarMetricasEscritorio(),
    repo.buscarCargaUsuarios(),
    repo.buscarPerformanceAdvogados(),
  ]);

  return {
    metricas,
    cargaUsuarios,
    performanceAdvogados,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

/**
 * Obtém apenas status das capturas (para admin)
 */
export async function obterStatusCapturas() {
  const capturas = await repo.buscarStatusCapturas();

  return {
    capturas,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determina se usuário é admin baseado no perfil
 */
export async function verificarAdmin(usuarioId: number): Promise<boolean> {
  // Esta verificação será feita no nível da action usando supabase.auth
  // Mantido aqui para referência futura se necessário
  return false;
}
