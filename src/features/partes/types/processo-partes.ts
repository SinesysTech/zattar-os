/**
 * Tipos para vínculos processo-partes
 */

import type { TipoParteProcesso, PoloProcessoParte } from '@/types/domain/processo-partes';
import type { Cliente, ParteContraria, Terceiro } from '../domain';

/**
 * Parte com dados completos da entidade vinculada
 * Inclui informações da entidade (cliente, parte contrária ou terceiro) e do vínculo
 */
export interface ParteComDadosCompletos {
  // Dados do vínculo
  id: number;
  processo_id: number;
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  dados_pje_completo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  
  // Dados da entidade (um dos três abaixo será preenchido)
  entidade?: Cliente | ParteContraria | Terceiro;
}

