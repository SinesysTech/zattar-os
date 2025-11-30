/**
 * Types para o endpoint de processos por CPF do cliente
 * Otimizado para consumo pelo Agente IA WhatsApp
 */

// ============================================================================
// Tipos do Banco de Dados (VIEW materializada)
// ============================================================================

/**
 * Registro da VIEW processos_cliente_por_cpf
 */
export interface ProcessoClienteCpfRow {
  cpf: string;
  cliente_nome: string;
  cliente_id: number;
  tipo_parte: string;
  polo: string;
  parte_principal: boolean;
  processo_id: number;
  id_pje: string;           // ID do processo no PJE (necessário para captura de timeline)
  advogado_id: number;      // ID do advogado que capturou o processo
  numero_processo: string;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  classe_judicial: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  descricao_orgao_julgador: string;
  codigo_status_processo: string;
  origem: 'acervo_geral' | 'arquivado';
  data_autuacao: string;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  segredo_justica: boolean;
  timeline_mongodb_id: string | null;
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
 * Resumo estatístico dos processos
 */
export interface ResumoProcessosIA {
  total_processos: number;
  com_audiencia_proxima: number;
}

/**
 * Dados de uma instância (primeiro ou segundo grau)
 */
export interface InstanciaProcessoIA {
  vara: string;
  data_inicio: string; // Formatado: DD/MM/YYYY
  proxima_audiencia: string | null; // Formatado: DD/MM/YYYY às HH:mm
}

/**
 * Item da timeline formatado para IA
 */
export interface TimelineItemIA {
  data: string; // Formatado: DD/MM/YYYY
  evento: string;
  descricao: string;
  tem_documento: boolean;
}

/**
 * Última movimentação do processo
 */
export interface UltimaMovimentacaoIA {
  data: string;
  evento: string;
}

/**
 * Status da timeline do processo
 */
export type TimelineStatus = 'disponivel' | 'sincronizando' | 'indisponivel';

/**
 * Processo formatado para resposta da IA
 */
export interface ProcessoRespostaIA {
  numero: string;
  tipo: string; // classe_judicial traduzida
  papel_cliente: string; // tipo_parte traduzido
  parte_contraria: string;
  tribunal: string; // TRT traduzido para nome completo
  sigilo: boolean;
  instancias: {
    primeiro_grau: InstanciaProcessoIA | null;
    segundo_grau: InstanciaProcessoIA | null;
  };
  timeline: TimelineItemIA[];
  timeline_status: TimelineStatus; // Status da sincronização da timeline
  timeline_mensagem?: string;      // Mensagem para o agente quando timeline não disponível
  ultima_movimentacao: UltimaMovimentacaoIA | null;
}

/**
 * Resposta de sucesso do endpoint
 */
export interface ProcessosClienteCpfSuccessResponse {
  success: true;
  data: {
    cliente: ClienteRespostaIA;
    resumo: ResumoProcessosIA;
    processos: ProcessoRespostaIA[];
  };
}

/**
 * Resposta de erro do endpoint
 */
export interface ProcessosClienteCpfErrorResponse {
  success: false;
  error: string;
}

/**
 * Resposta unificada do endpoint (sucesso ou erro)
 */
export type ProcessosClienteCpfResponse =
  | ProcessosClienteCpfSuccessResponse
  | ProcessosClienteCpfErrorResponse;

/**
 * Alias para ClienteRespostaIA (para compatibilidade)
 */
export type ClienteIA = ClienteRespostaIA;

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
  PERITO: 'Perito',
  MINISTERIO_PUBLICO: 'Ministério Público',
  ASSISTENTE: 'Assistente',
  TESTEMUNHA: 'Testemunha',
  CUSTOS_LEGIS: 'Custos Legis',
  AMICUS_CURIAE: 'Amicus Curiae',
  OUTRO: 'Outro',
};

/**
 * Mapeamento de classe_judicial para texto amigável
 */
export const CLASSE_JUDICIAL_NOMES: Record<string, string> = {
  ATOrd: 'Ação Trabalhista Ordinária',
  ATSum: 'Ação Trabalhista Sumaríssima',
  AIRO: 'Ação de Inquérito para Apuração de Falta Grave',
  ACP: 'Ação Civil Pública',
  ACPCiv: 'Ação Civil Pública Cível',
  MS: 'Mandado de Segurança',
  MSCol: 'Mandado de Segurança Coletivo',
  RO: 'Recurso Ordinário',
  ROT: 'Recurso Ordinário Trabalhista',
  AIRR: 'Agravo de Instrumento em Recurso de Revista',
  RR: 'Recurso de Revista',
  Ag: 'Agravo',
  AP: 'Agravo de Petição',
  ED: 'Embargos de Declaração',
  ExFis: 'Execução Fiscal',
  ExTrab: 'Execução Trabalhista',
  CumSen: 'Cumprimento de Sentença',
};
