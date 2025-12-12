/**
 * Tipos e constantes compartilhadas para vínculo processo-partes.
 *
 * Este arquivo existe como compatibilidade para imports legados em `@/types/domain/*`.
 * As features novas devem preferir importar tipos diretamente da feature (quando existir).
 */

/**
 * Polo do vínculo no processo (normalizado no sistema).
 */
export type PoloProcessoParte = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Tipos de parte aceitos no sistema.
 *
 * Observação: o PJE pode retornar muitos valores; quando não reconhecido,
 * a captura normaliza para `OUTRO`.
 */
export const TIPOS_PARTE_PROCESSO_VALIDOS = {
  AUTOR: true,
  REU: true,
  RECLAMANTE: true,
  RECLAMADO: true,
  TERCEIRO: true,
  PERITO: true,
  MINISTERIO_PUBLICO: true,
  ASSISTENTE: true,
  TESTEMUNHA: true,
  CUSTOS_LEGIS: true,
  AMICUS_CURIAE: true,
  OUTRO: true,
} as const;

export type TipoParteProcesso = keyof typeof TIPOS_PARTE_PROCESSO_VALIDOS;


