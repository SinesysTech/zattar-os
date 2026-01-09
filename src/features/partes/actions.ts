'use server';

/**
 * Partes Feature Module - Server Actions entrypoint
 *
 * IMPORTANTE (Next.js): arquivos com "use server" só podem exportar funções async.
 * Este arquivo expõe um conjunto de Server Actions estáveis para importação a partir de
 * Client Components e Server Components, sem deep-imports.
 */

import type { ListarClientesParams } from './domain';
import type { PoloProcessoParte } from './types';

type DashboardDateFilterInput =
  | { mode: 'all' }
  | { mode: 'range'; from: string; to: string };

import {
  actionListarClientes as _actionListarClientes,
  actionContarClientesComEstatisticas as _actionContarClientesComEstatisticas,
  actionContarClientesPorEstado as _actionContarClientesPorEstado,
} from './actions/clientes-actions';

import {
  actionContarPartesContrariasComEstatisticas as _actionContarPartesContrariasComEstatisticas,
} from './actions/partes-contrarias-actions';

import {
  actionBuscarPartesPorProcessoEPolo as _actionBuscarPartesPorProcessoEPolo,
} from './actions/processo-partes-actions';

export async function actionListarClientes(params: ListarClientesParams = {}) {
  return _actionListarClientes(params);
}

export async function actionContarClientesComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  return _actionContarClientesComEstatisticas(dateFilter);
}

export async function actionContarClientesPorEstado(limit = 4, dateFilter?: DashboardDateFilterInput) {
  return _actionContarClientesPorEstado(limit, dateFilter);
}

export async function actionContarPartesContrariasComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  return _actionContarPartesContrariasComEstatisticas(dateFilter);
}

export async function actionBuscarPartesPorProcessoEPolo(
  processoId: number,
  polo: PoloProcessoParte
) {
  return _actionBuscarPartesPorProcessoEPolo(processoId, polo);
}
