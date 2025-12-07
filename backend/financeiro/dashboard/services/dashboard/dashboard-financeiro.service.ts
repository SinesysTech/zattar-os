import {
  getMetricasFinanceiras,
  getFluxoCaixaProjetado,
  getAlertasFinanceiros,
} from '../persistence/dashboard-financeiro.persistence';

export const getDashboardFinanceiro = async (usuarioId: number) => {
  // Futuro: aplicar filtro por permissões do usuário/responsável
  const metricas = await getMetricasFinanceiras();
  const alertas = await getAlertasFinanceiros();
  const fluxoProjetado = await getFluxoCaixaProjetado(6);

  return {
    usuarioId,
    metricas,
    alertas,
    fluxoProjetado,
  };
};

export const getFluxoCaixaProjetadoDashboard = async (meses: number) => {
  return getFluxoCaixaProjetado(meses);
};
