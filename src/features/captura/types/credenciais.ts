import type { CodigoTRT, GrauTRT } from '@/features/captura';
import type { OabEntry } from '@/features/advogados/domain';

/**
 * Tipo usado na UI de "Captura > Credenciais" (payload da rota `/api/captura/credenciais`).
 *
 * Observacao: este tipo inclui campos derivados do join com advogados (nome/cpf/oabs).
 */
export interface Credencial {
  id: number;
  advogado_id: number;
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oabs: OabEntry[];
  tribunal: CodigoTRT | string;
  grau: GrauTRT | string;
  usuario?: string | null; // Login PJE (se diferente do CPF do advogado)
  active: boolean;
  created_at: string;
  updated_at: string | null;
}
