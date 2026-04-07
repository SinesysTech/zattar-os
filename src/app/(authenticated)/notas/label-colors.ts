/**
 * NOTAS — Label Colors
 * ============================================================================
 * Single source of truth para a paleta de cores de labels do módulo notas.
 *
 * Labels é entidade SEPARADA de Tags (que vivem em lib/domain/tags). O picker
 * deste módulo aceita apenas as 17 cores derivadas dos tokens --palette-N
 * definidos em globals.css.
 *
 * Mantém compat com dados legacy gravados no banco como `bg-red-500` etc.
 * via mapping abaixo. Migre dados ao acessar via normalizeLabelColor().
 *
 * Este arquivo está na lista de exclusões da regra ESLint de tokens —
 * é o ÚNICO lugar do codebase onde os strings legacy `bg-{cor}-500`
 * podem aparecer.
 * ============================================================================
 */

/** Paleta canônica de cores selecionáveis para labels (17 stops da paleta). */
export const AVAILABLE_LABEL_COLORS = Array.from(
  { length: 17 },
  (_, i) => `bg-palette-${i + 1}`,
)

/**
 * Mapping legacy → tokens. Cobre dados gravados antes da migração para palette.
 * Após sweep de migração no banco, este map pode ser removido.
 */
const LEGACY_LABEL_COLOR_MAP: Record<string, string> = {
  "bg-red-500": "bg-palette-1",
  "bg-orange-500": "bg-palette-2",
  "bg-amber-500": "bg-palette-3",
  "bg-yellow-500": "bg-palette-4",
  "bg-lime-500": "bg-palette-5",
  "bg-green-500": "bg-palette-6",
  "bg-emerald-500": "bg-palette-7",
  "bg-teal-500": "bg-palette-8",
  "bg-cyan-500": "bg-palette-9",
  "bg-sky-500": "bg-palette-10",
  "bg-blue-500": "bg-palette-11",
  "bg-indigo-500": "bg-palette-12",
  "bg-violet-500": "bg-palette-13",
  "bg-purple-500": "bg-palette-14",
  "bg-fuchsia-500": "bg-palette-15",
  "bg-pink-500": "bg-palette-16",
  "bg-rose-500": "bg-palette-17",
}

/**
 * Normaliza uma cor de label salva no banco para a forma canônica.
 * - Se for string legacy (bg-red-500), retorna o equivalente palette
 * - Se já for token (bg-palette-N), retorna como está
 * - Caso contrário, fallback para palette-1
 */
export function normalizeLabelColor(color: string | null | undefined): string {
  if (!color) return "bg-palette-1"
  return LEGACY_LABEL_COLOR_MAP[color] ?? color
}
