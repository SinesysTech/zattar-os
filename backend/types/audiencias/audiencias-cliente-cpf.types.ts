/**
 * Types para o endpoint de audiências por CPF do cliente
 * Otimizado para consumo pelo Agente IA WhatsApp
 */

// ============================================================================
// Tipos do Banco de Dados
// ============================================================================

/**
 * Registro de audiência retornado do banco
 */
export interface AudienciaClienteCpfRow {
  // Dados da audiência
  audiencia_id: number;
  id_pje: number;
  numero_processo: string;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  data_inicio: string;
  data_fim: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  status: string;
  status_descricao: string | null;
  modalidade: 'virtual' | 'presencial' | 'hibrida' | null;
  url_audiencia_virtual: string | null;
  endereco_presencial: Record<string, unknown> | null;
  presenca_hibrida: 'advogado' | 'cliente' | null;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
  segredo_justica: boolean;
  observacoes: string | null;

  // Dados relacionados
  tipo_audiencia_descricao: string | null;
  orgao_julgador_descricao: string | null;
  sala_audiencia_nome: string | null;
  classe_judicial_descricao: string | null;

  // Dados do cliente
  cliente_id: number;
  cliente_nome: string;
  cpf: string;
  tipo_parte: string;
  polo: string;
}

// ============================================================================
// Tipos da Resposta da API (formatados para IA)
// ============================================================================

/**
 * Dados do cliente na resposta
 */
export interface ClienteRespostaIA {
  nome: string;
  cpf: string; // Formatado: 123.456.789-01
}

/**
 * Resumo estatístico das audiências
 */
export interface ResumoAudienciasIA {
  total_audiencias: number;
  futuras: number;
  realizadas: number;
  canceladas: number;
}

/**
 * Audiência formatada para resposta da IA
 */
export interface AudienciaRespostaIA {
  numero_processo: string;
  tipo: string; // tipo_audiencia_descricao
  data: string; // Formatado: DD/MM/YYYY
  horario: string; // Formatado: HH:mm - HH:mm
  modalidade: 'Virtual' | 'Presencial' | 'Híbrida';
  status: string; // status_descricao traduzido
  local: LocalAudienciaIA;
  partes: {
    polo_ativo: string;
    polo_passivo: string;
  };
  papel_cliente: string; // tipo_parte traduzido
  parte_contraria: string;
  tribunal: string; // TRT traduzido
  vara: string; // orgao_julgador
  sigilo: boolean;
  observacoes: string | null;
}

/**
 * Local da audiência (virtual ou presencial)
 */
export interface LocalAudienciaIA {
  tipo: 'virtual' | 'presencial' | 'hibrido';
  url_virtual: string | null;
  endereco: string | null;
  sala: string | null;
  presenca_hibrida: string | null; // "Advogado comparece presencialmente" ou "Cliente comparece presencialmente"
}

/**
 * Resposta de sucesso do endpoint
 */
export interface AudienciasClienteCpfSuccessResponse {
  success: true;
  data: {
    cliente: ClienteRespostaIA;
    resumo: ResumoAudienciasIA;
    audiencias: AudienciaRespostaIA[];
  };
}

/**
 * Resposta de erro do endpoint
 */
export interface AudienciasClienteCpfErrorResponse {
  success: false;
  error: string;
}

/**
 * Resposta unificada do endpoint (sucesso ou erro)
 */
export type AudienciasClienteCpfResponse =
  | AudienciasClienteCpfSuccessResponse
  | AudienciasClienteCpfErrorResponse;

// ============================================================================
// Tipos Auxiliares
// ============================================================================

/**
 * Mapeamento de TRT para nome completo
 */
export const TRT_NOMES: Record<string, string> = {
  TRT1: 'TRT da 1ª Região (RJ)',
  TRT2: 'TRT da 2ª Região (SP Capital)',
  TRT3: 'TRT da 3ª Região (MG)',
  TRT4: 'TRT da 4ª Região (RS)',
  TRT5: 'TRT da 5ª Região (BA)',
  TRT6: 'TRT da 6ª Região (PE)',
  TRT7: 'TRT da 7ª Região (CE)',
  TRT8: 'TRT da 8ª Região (PA/AP)',
  TRT9: 'TRT da 9ª Região (PR)',
  TRT10: 'TRT da 10ª Região (DF/TO)',
  TRT11: 'TRT da 11ª Região (AM/RR)',
  TRT12: 'TRT da 12ª Região (SC)',
  TRT13: 'TRT da 13ª Região (PB)',
  TRT14: 'TRT da 14ª Região (RO/AC)',
  TRT15: 'TRT da 15ª Região (Campinas)',
  TRT16: 'TRT da 16ª Região (MA)',
  TRT17: 'TRT da 17ª Região (ES)',
  TRT18: 'TRT da 18ª Região (GO)',
  TRT19: 'TRT da 19ª Região (AL)',
  TRT20: 'TRT da 20ª Região (SE)',
  TRT21: 'TRT da 21ª Região (RN)',
  TRT22: 'TRT da 22ª Região (PI)',
  TRT23: 'TRT da 23ª Região (MT)',
  TRT24: 'TRT da 24ª Região (MS)',
};

/**
 * Mapeamento de tipo_parte para texto amigável
 */
export const TIPO_PARTE_NOMES: Record<string, string> = {
  AUTOR: 'Autor',
  REU: 'Réu',
  RECLAMANTE: 'Reclamante',
  RECLAMADO: 'Reclamado',
  EXEQUENTE: 'Exequente',
  EXECUTADO: 'Executado',
  EMBARGANTE: 'Embargante',
  EMBARGADO: 'Embargado',
  APELANTE: 'Apelante',
  APELADO: 'Apelado',
  AGRAVANTE: 'Agravante',
  AGRAVADO: 'Agravado',
  OUTRO: 'Outro',
};

/**
 * Mapeamento de status de audiência para texto amigável
 */
export const STATUS_AUDIENCIA_NOMES: Record<string, string> = {
  M: 'Designada',
  C: 'Cancelada',
  F: 'Realizada',
  A: 'Adiada',
  R: 'Redesignada',
};
