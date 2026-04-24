/**
 * Tipos primitivos de partes contratuais.
 *
 * Ancorados em `shared/` porque são consumidos tanto pelo módulo admin
 * (contratos/domain.ts) quanto pelo fluxo público de assinatura (wizard de
 * pacote) — manter a fonte primária aqui evita cross-group imports.
 */

export type PapelContratual = 'autora' | 're'

export type TipoEntidadeContrato =
  | 'cliente'
  | 'parte_contraria'
  | 'parte_contraria_transitoria'

export function isTipoParteContraria(
  tipo: TipoEntidadeContrato,
): tipo is 'parte_contraria' | 'parte_contraria_transitoria' {
  return tipo === 'parte_contraria' || tipo === 'parte_contraria_transitoria'
}
