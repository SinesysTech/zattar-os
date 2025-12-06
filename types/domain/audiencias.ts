import type { GrauProcesso } from './common';

/**
 * Status de uma audiência.
 * - `M`: Marcada/Designada
 * - `F`: Finalizada/Realizada
 * - `C`: Cancelada
 */
export type StatusAudiencia = 'M' | 'F' | 'C';

/**
 * Modalidade em que a audiência será realizada.
 */
export type ModalidadeAudiencia = 'virtual' | 'presencial' | 'hibrida';

/**
 * Define qual parte comparecerá presencialmente em uma audiência híbrida.
 */
export type PresencaHibrida = 'advogado' | 'cliente';

/**
 * Representa uma audiência judicial, contendo todas as informações
 * relevantes como data, hora, local, partes envolvidas e status.
 */
export interface Audiencia {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number;
  orgao_julgador_id: number | null;
  orgao_julgador_descricao: string | null;
  trt: string;
  grau: GrauProcesso;
  numero_processo: string;
  classe_judicial: string | null;
  classe_judicial_id: number | null;
  data_inicio: string; // ISO timestamp
  data_fim: string; // ISO timestamp
  hora_inicio: string | null;
  hora_fim: string | null;
  modalidade: ModalidadeAudiencia | null;
  presenca_hibrida: PresencaHibrida | null;
  sala_audiencia_nome: string | null;
  sala_audiencia_id: number | null;
  status: string;
  status_descricao: string | null;
  tipo_audiencia_id: number | null;
  tipo_descricao: string | null;
  tipo_codigo: string | null;
  tipo_is_virtual: boolean;
  designada: boolean;
  em_andamento: boolean;
  documento_ativo: boolean;
  nome_parte_autora: string | null;
  nome_parte_re: string | null;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
  url_audiencia_virtual: string | null;
  url_ata_audiencia: string | null;
  ata_audiencia_id: number | null;
  endereco_presencial: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  } | null;
  responsavel_id: number | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
