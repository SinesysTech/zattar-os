/**
 * Tipos TypeScript do Supabase - Comunica CNJ e Expedientes
 * Atualizado: 2025-12-05
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums do banco de dados
export type GrauTribunal = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

export type CodigoTribunal =
  | 'TRT1' | 'TRT2' | 'TRT3' | 'TRT4' | 'TRT5' | 'TRT6'
  | 'TRT7' | 'TRT8' | 'TRT9' | 'TRT10' | 'TRT11' | 'TRT12'
  | 'TRT13' | 'TRT14' | 'TRT15' | 'TRT16' | 'TRT17' | 'TRT18'
  | 'TRT19' | 'TRT20' | 'TRT21' | 'TRT22' | 'TRT23' | 'TRT24';

export type TipoPessoa = 'fisica' | 'juridica';
export type PoloProcessual = 'autor' | 'reu' | 'terceiro';
export type StatusCaptura = 'pending' | 'in_progress' | 'completed' | 'failed';

export type TipoCaptura =
  | 'acervo_geral'
  | 'arquivados'
  | 'audiencias'
  | 'pendentes'
  | 'partes'
  | 'timeline'
  | 'comunica_cnj';

// Novos enums para Comunica CNJ
export type MeioComunicacao = 'E' | 'D';
export type OrigemExpediente = 'captura' | 'manual' | 'comunica_cnj';

// Tabela: comunica_cnj
export interface ComunicaCNJ {
  id: number;
  hash: string;
  id_cnj: number;
  numero_processo: string;
  numero_processo_mascara: string | null;
  sigla_tribunal: string;
  nome_orgao: string | null;
  orgao_id: number | null;
  codigo_classe: string | null;
  nome_classe: string | null;
  tipo_comunicacao: string | null;
  tipo_documento: string | null;
  meio: MeioComunicacao;
  meio_completo: string | null;
  data_disponibilizacao: string;
  texto: string | null;
  link: string | null;
  destinatarios: Json | null;
  destinatarios_advogados: Json | null;
  numero_comunicacao: number | null;
  status: string | null;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  metadados: Json | null;
  expediente_id: number | null;
  advogado_id: number | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Tabela: expedientes (anteriormente pendentes_manifestacao)
export interface Expediente {
  id: number;
  advogado_id: number | null;
  processo_id: number | null;
  id_pje: number;
  numero: number;
  numero_processo: string;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  nome_parte_autora: string;
  nome_parte_re: string;
  qtde_parte_autora: number;
  qtde_parte_re: number;
  classe_judicial: string;
  codigo_status_processo: string;
  descricao_orgao_julgador: string;
  sigla_orgao_julgador: string | null;
  data_autuacao: string;
  data_arquivamento: string | null;
  data_ciencia_parte: string | null;
  data_criacao_expediente: string | null;
  data_prazo_legal_parte: string | null;
  prazo_vencido: boolean;
  prioridade_processual: number;
  segredo_justica: boolean;
  juizo_digital: boolean;
  tipo_expediente_id: number | null;
  responsavel_id: number | null;
  observacoes: string | null;
  baixado_em: string | null;
  protocolo_id: string | null;
  justificativa_baixa: string | null;
  id_documento: number | null;
  descricao_arquivos: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_bucket: string | null;
  arquivo_key: string | null;
  origem: OrigemExpediente;
  dados_anteriores: Json | null;
  created_at: string;
  updated_at: string;
}
