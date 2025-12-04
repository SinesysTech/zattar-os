/**
 * Funções utilitárias para processamento de comunicações CNJ
 */

import type {
  ComunicacaoDestinatario,
  GrauTribunal,
  PartesExtraidas,
} from '../../types/types';

/**
 * Infere o grau do tribunal a partir do nome do órgão julgador
 *
 * Regras:
 * - Primeiro grau: contém "vara", "comarca", "fórum"
 * - Segundo grau: contém "turma", "gabinete", "segundo grau", "sejusc segundo"
 * - Tribunal superior: sigla TST ou contém "ministro"
 *
 * @param nomeOrgao - Nome do órgão julgador
 * @param siglaTribunal - Sigla do tribunal (ex: TRT1, TST)
 * @returns Grau inferido
 */
export function inferirGrau(
  nomeOrgao: string,
  siglaTribunal: string
): GrauTribunal {
  const orgaoLower = (nomeOrgao || '').toLowerCase();
  const siglaUpper = (siglaTribunal || '').toUpperCase();

  // Tribunal Superior (TST ou contém "ministro")
  if (siglaUpper === 'TST' || orgaoLower.includes('ministro')) {
    return 'tribunal_superior';
  }

  // Segundo grau (turma, gabinete, etc.)
  if (
    orgaoLower.includes('turma') ||
    orgaoLower.includes('gabinete') ||
    orgaoLower.includes('segundo grau') ||
    orgaoLower.includes('sejusc segundo') ||
    orgaoLower.includes('seção') ||
    orgaoLower.includes('sdc') ||
    orgaoLower.includes('sdi')
  ) {
    return 'segundo_grau';
  }

  // Primeiro grau (vara, comarca, fórum, etc.) - default
  // Também inclui: junta, juízo, cartório
  return 'primeiro_grau';
}

/**
 * Extrai partes (polo ativo e passivo) dos destinatários da comunicação
 *
 * @param destinatarios - Array de destinatários da comunicação
 * @returns Objeto com arrays de nomes dos polos ativo e passivo
 */
export function extrairPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): PartesExtraidas {
  if (!destinatarios || !Array.isArray(destinatarios)) {
    return { poloAtivo: [], poloPassivo: [] };
  }

  const poloAtivo: string[] = [];
  const poloPassivo: string[] = [];

  for (const dest of destinatarios) {
    if (!dest.nome) continue;

    if (dest.polo === 'A') {
      poloAtivo.push(dest.nome);
    } else if (dest.polo === 'P') {
      poloPassivo.push(dest.nome);
    }
  }

  return { poloAtivo, poloPassivo };
}

/**
 * Obtém o primeiro nome do polo ativo (autor)
 *
 * @param destinatarios - Array de destinatários
 * @returns Nome do primeiro autor ou 'Não especificado'
 */
export function obterNomeParteAutora(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloAtivo } = extrairPartes(destinatarios);
  return poloAtivo[0] || 'Não especificado';
}

/**
 * Obtém o primeiro nome do polo passivo (réu)
 *
 * @param destinatarios - Array de destinatários
 * @returns Nome do primeiro réu ou 'Não especificado'
 */
export function obterNomeParteRe(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloPassivo } = extrairPartes(destinatarios);
  return poloPassivo[0] || 'Não especificado';
}

/**
 * Conta quantidade de partes em cada polo
 *
 * @param destinatarios - Array de destinatários
 * @returns Objeto com contagens
 */
export function contarPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): { qtdePoloAtivo: number; qtdePoloPassivo: number } {
  const { poloAtivo, poloPassivo } = extrairPartes(destinatarios);
  return {
    qtdePoloAtivo: poloAtivo.length || 1, // Mínimo 1 para evitar 0
    qtdePoloPassivo: poloPassivo.length || 1,
  };
}

/**
 * Normaliza número do processo removendo máscara
 * Remove pontos, traços e outros caracteres
 *
 * @param numeroProcesso - Número do processo (com ou sem máscara)
 * @returns Número do processo sem máscara
 */
export function normalizarNumeroProcesso(numeroProcesso: string): string {
  if (!numeroProcesso) return '';
  return numeroProcesso.replace(/[^0-9]/g, '');
}

/**
 * Verifica se dois números de processo são iguais (ignorando máscara)
 *
 * @param numero1 - Primeiro número
 * @param numero2 - Segundo número
 * @returns true se forem iguais
 */
export function mesmProcesso(numero1: string, numero2: string): boolean {
  return normalizarNumeroProcesso(numero1) === normalizarNumeroProcesso(numero2);
}

/**
 * Extrai TRT do número do processo no formato CNJ
 * Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
 * TRT está na posição 14-15 (índices 17-19 com máscara)
 *
 * @param numeroProcessoMascara - Número no formato CNJ
 * @returns Sigla do TRT (ex: TRT1, TRT2) ou null se não encontrar
 */
export function extrairTRTDoNumeroProcesso(
  numeroProcessoMascara: string | null | undefined
): string | null {
  if (!numeroProcessoMascara) return null;

  // Formato: 0001234-56.2023.5.01.0001
  // Posição do TRT: após o "5." (justiça do trabalho)
  const match = numeroProcessoMascara.match(/\d{7}-\d{2}\.\d{4}\.5\.(\d{2})\.\d{4}/);
  if (match && match[1]) {
    const trtNumero = parseInt(match[1], 10);
    return `TRT${trtNumero}`;
  }

  return null;
}

/**
 * Formata data para exibição (dd/mm/yyyy)
 *
 * @param data - Data no formato yyyy-mm-dd ou ISO
 * @returns Data formatada
 */
export function formatarData(data: string | Date): string {
  if (!data) return '';

  const d = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(d.getTime())) return '';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/**
 * Calcula data limite para match (3 dias antes)
 *
 * @param dataDisponibilizacao - Data de disponibilização da comunicação
 * @returns Data limite (3 dias antes)
 */
export function calcularDataLimiteMatch(dataDisponibilizacao: string): string {
  const data = new Date(dataDisponibilizacao);
  data.setDate(data.getDate() - 3);
  return data.toISOString().split('T')[0];
}
