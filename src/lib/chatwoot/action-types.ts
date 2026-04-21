/**
 * Chatwoot Actions — Tipos de params/results de Server Actions (sem "use server").
 *
 * Separado do `types.ts` (SDK Chatwoot) por convenção: este arquivo hospeda
 * apenas tipos consumidos por actions.ts/widget-config-action.ts.
 */

import type { TipoEntidadeChatwoot } from "./types";
import type { SincronizarChatwootParaAppResult } from "./service";

// =============================================================================
// Sincronização de partes (batch)
// =============================================================================

export interface SincronizarPartesParams {
  tipoEntidade: TipoEntidadeChatwoot;
  limite?: number;
  paginaInicial?: number;
  paginaFinal?: number;
  apenasAtivos?: boolean;
  delayEntreSync?: number;
  pararNoErro?: boolean;
}

export interface SincronizarPartesResult {
  tipo_entidade: TipoEntidadeChatwoot;
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  contatos_criados: number;
  contatos_atualizados: number;
  erros: Array<{ entidade_id: number; nome: string; erro: string }>;
}

// =============================================================================
// Sincronização de clientes (alias retrocompat)
// =============================================================================

export interface SincronizarClientesParams {
  limite?: number;
  paginaInicial?: number;
  paginaFinal?: number;
  apenasAtivos?: boolean;
  delayEntreSync?: number;
  pararNoErro?: boolean;
}

export interface SincronizarClientesResult {
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  clientes_criados: number;
  clientes_atualizados: number;
  erros: Array<{ cliente_id: number; nome: string; erro: string }>;
}

// =============================================================================
// Sincronização completa (two-phase)
// =============================================================================

export interface SincronizarCompletoResult {
  fase1_chatwoot_para_app: SincronizarChatwootParaAppResult | null;
  fase2_app_para_chatwoot: SincronizarPartesResult | null;
  resumo: {
    total_vinculados_por_telefone: number;
    total_criados_no_chatwoot: number;
    total_atualizados: number;
    total_sem_match: number;
    total_erros: number;
  };
}

export interface SincronizarCompletoParams {
  tipoEntidade?: TipoEntidadeChatwoot | "todos";
  apenasAtivos?: boolean;
  delayEntreSync?: number;
}

// =============================================================================
// Widget Config (widget-config-action.ts)
// =============================================================================

export interface WidgetConfig {
  websiteToken: string;
  baseUrl: string;
}
