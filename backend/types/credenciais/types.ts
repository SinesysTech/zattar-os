/**
 * Tipos para gerenciamento de credenciais
 */

import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';

/**
 * Dados de uma credencial (sem senha para segurança)
 */
export interface Credencial {
  id: number;
  advogado_id: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados de uma credencial com informações do advogado (para listagem)
 */
export interface CredencialComAdvogado extends Credencial {
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oab: string;
  advogado_uf_oab: string;
}

/**
 * Dados para criar uma nova credencial
 */
export interface CriarCredencialParams {
  advogado_id: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  senha: string;
  active?: boolean; // Default: true
}

/**
 * Dados para atualizar uma credencial
 */
export interface AtualizarCredencialParams {
  tribunal?: CodigoTRT;
  grau?: GrauTRT;
  senha?: string;
  active?: boolean;
}

/**
 * Parâmetros para listar credenciais
 */
export interface ListarCredenciaisParams {
  advogado_id: number;
  active?: boolean; // Filtrar por status ativo/inativo
}

