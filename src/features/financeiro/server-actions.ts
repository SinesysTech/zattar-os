'use server';

import {
  actionAtualizarConta as _actionAtualizarConta,
  actionObterDashboardFinanceiro as _actionObterDashboardFinanceiro,
  actionObterFluxoCaixaPorPeriodo as _actionObterFluxoCaixaPorPeriodo,
  actionObterTopCategorias as _actionObterTopCategorias,
  actionSincronizarAcordo as _actionSincronizarAcordo,
  actionVerificarConsistencia as _actionVerificarConsistencia,
} from './actions';

export async function actionAtualizarConta(...args: Parameters<typeof _actionAtualizarConta>) {
  return _actionAtualizarConta(...args);
}

export async function actionObterDashboardFinanceiro(...args: Parameters<typeof _actionObterDashboardFinanceiro>) {
  return _actionObterDashboardFinanceiro(...args);
}

export async function actionObterFluxoCaixaPorPeriodo(...args: Parameters<typeof _actionObterFluxoCaixaPorPeriodo>) {
  return _actionObterFluxoCaixaPorPeriodo(...args);
}

export async function actionObterTopCategorias(...args: Parameters<typeof _actionObterTopCategorias>) {
  return _actionObterTopCategorias(...args);
}

export async function actionSincronizarAcordo(...args: Parameters<typeof _actionSincronizarAcordo>) {
  return _actionSincronizarAcordo(...args);
}

export async function actionVerificarConsistencia(...args: Parameters<typeof _actionVerificarConsistencia>) {
  return _actionVerificarConsistencia(...args);
}
