/**
 * DASHBOARD FEATURE - Repositories Index
 *
 * Barrel exports para todos os repositories do módulo de dashboard.
 */

// Processos Metrics
export {
  buscarProcessosResumo,
  buscarTotalProcessos,
} from './processos-metrics';

// Audiências Metrics
export {
  buscarAudienciasResumo,
  buscarProximasAudiencias,
  buscarAudienciasMes,
} from './audiencias-metrics';

// Expedientes Metrics
export {
  buscarExpedientesResumo,
  buscarExpedientesUrgentes,
  buscarTotalExpedientesPendentes,
} from './expedientes-metrics';

// Produtividade Metrics
export { buscarProdutividadeUsuario } from './produtividade-metrics';

// Admin Metrics
export {
  buscarMetricasEscritorio,
  buscarCargaUsuarios,
  buscarStatusCapturas,
  buscarPerformanceAdvogados,
  buscarUsuario,
} from './admin-metrics';

// Financeiro Metrics
export { buscarDadosFinanceirosConsolidados } from './financeiro-metrics';

// Shared Formatters
export { formatarMoeda } from './shared/formatters';

// Lembretes
export {
  buscarLembretes,
  buscarLembretePorId,
  criarLembrete,
  atualizarLembrete,
  marcarLembreteConcluido,
  deletarLembrete,
  contarLembretesPendentes,
  buscarLembretesVencidos,
} from './lembretes-repository';
