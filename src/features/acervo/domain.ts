/**
 * Domain Layer for Acervo Feature
 * Business logic and domain rules
 */

import { StatusProcesso } from '@/features/processos/domain';
import type { Acervo } from './types';

/**
 * Maps PJE status code to StatusProcesso enum
 */
export function mapearStatusProcesso(codigo: string | null | undefined): StatusProcesso {
  if (!codigo) return StatusProcesso.OUTRO;
  const codigoUpper = codigo.toUpperCase();

  if (codigoUpper.includes('ATIVO') || codigoUpper === 'A') return StatusProcesso.ATIVO;
  if (codigoUpper.includes('SUSPENSO') || codigoUpper === 'S') return StatusProcesso.SUSPENSO;
  if (codigoUpper.includes('ARQUIVADO') || codigoUpper === 'ARQ') return StatusProcesso.ARQUIVADO;
  if (codigoUpper.includes('EXTINTO') || codigoUpper === 'E') return StatusProcesso.EXTINTO;
  if (codigoUpper.includes('BAIXADO') || codigoUpper === 'B') return StatusProcesso.BAIXADO;
  if (codigoUpper.includes('PENDENTE') || codigoUpper === 'P') return StatusProcesso.PENDENTE;
  if (codigoUpper.includes('RECURSO') || codigoUpper === 'R') return StatusProcesso.EM_RECURSO;

  return StatusProcesso.OUTRO;
}

/**
 * Converts database record to Acervo domain object
 */
export function converterParaAcervo(data: Record<string, unknown>): Acervo {
  const codigoStatus = data.codigo_status_processo as string | null;
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    origem: data.origem as 'acervo_geral' | 'arquivado',
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
    numero_processo: data.numero_processo as string,
    numero: data.numero as number,
    descricao_orgao_julgador: data.descricao_orgao_julgador as string,
    classe_judicial: data.classe_judicial as string,
    segredo_justica: data.segredo_justica as boolean,
    status: mapearStatusProcesso(codigoStatus),
    codigo_status_processo: codigoStatus ?? undefined,
    prioridade_processual: data.prioridade_processual as number,
    nome_parte_autora: data.nome_parte_autora as string,
    qtde_parte_autora: data.qtde_parte_autora as number,
    nome_parte_re: data.nome_parte_re as string,
    qtde_parte_re: data.qtde_parte_re as number,
    data_autuacao: data.data_autuacao as string,
    juizo_digital: data.juizo_digital as boolean,
    data_arquivamento: (data.data_arquivamento as string | null) ?? null,
    data_proxima_audiencia: (data.data_proxima_audiencia as string | null) ?? null,
    tem_associacao: data.tem_associacao as boolean,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * TRT name mappings
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
 * Tipo de parte name mappings
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
 * Classe judicial name mappings
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
