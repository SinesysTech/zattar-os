/**
 * Tipos para o Portal do Cliente (meu-processo)
 * Formato específico para dados exibidos no portal público
 */

/**
 * Dados do local da audiência para exibição
 */
export interface LocalAudienciaSinesys {
  url_virtual?: string | null;
  endereco?: string | null;
  sala?: string | null;
}

/**
 * Partes do processo para exibição
 */
export interface PartesAudienciaSinesys {
  polo_ativo?: string | null;
  polo_passivo?: string | null;
}

/**
 * Tipo de audiência para o Portal do Cliente
 * Formato simplificado para exibição pública
 */
export interface AudienciaSinesys {
  id: number;
  numero_processo: string;
  vara?: string | null;
  tipo?: string | null;
  data: string;
  horario?: string | null;
  modalidade?: string | null;
  status: string;
  observacoes?: string | null;
  local?: LocalAudienciaSinesys | null;
  partes?: PartesAudienciaSinesys | null;
}
