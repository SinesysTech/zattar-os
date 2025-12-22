/**
 * Tipos para Conciliação Bancária
 * Re-exporta tipos do domain/conciliacao.ts para compatibilidade de imports
 */

export type {
  TipoTransacao,
  StatusConciliacao,
  Conciliacao,
  TransacaoImportada,
  ConciliacaoBancaria,
  TransacaoComConciliacao,
  SugestaoConciliacao,
  LancamentoFinanceiroResumo,
  ImportarExtratoDTO,
  ImportarExtratoResponse,
  ConciliarManualDTO,
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  ConciliacaoFilters,
  BuscarLancamentosCandidatosParams,
} from '../domain/conciliacao';

export {
  STATUS_CONCILIACAO_LABELS,
  TIPO_TRANSACAO_LABELS,
  SCORE_MINIMO_AUTO_CONCILIACAO,
  SCORE_MINIMO_SUGESTAO,
} from '../domain/conciliacao';
