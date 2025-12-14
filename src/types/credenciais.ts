import type { CodigoTRT, GrauTRT } from '@/features/captura';

/**
 * Tipo usado na UI de "Captura > Credenciais" (payload da rota `/api/captura/credenciais`).
 *
 * Observação: este tipo inclui campos derivados do join com advogados (nome/cpf/oab).
 */
export interface Credencial {
  id: number;
  advogado_id: number;
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oab: string;
  advogado_uf_oab: string;
  tribunal: CodigoTRT | string;
  grau: GrauTRT | string;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}


