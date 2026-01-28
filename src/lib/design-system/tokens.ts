/**
 * Design System Tokens
 *
 * Este arquivo define os tokens fundamentais do Design System Sinesys.
 * Tokens são valores atômicos que servem como base para todas as decisões visuais.
 *
 * @ai-context Use estes tokens para garantir consistência visual em todo o sistema.
 * Nunca use valores de cor hardcoded - sempre importe deste arquivo ou use variantes semânticas.
 */

// =============================================================================
// PALETA DE CORES BASE
// =============================================================================

/**
 * Cores base do sistema usando Tailwind color palette.
 * Estas cores são usadas internamente pelos mapeamentos semânticos.
 */
export const COLORS = {
  // Tons de azul
  blue: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    200: 'bg-blue-200',
    500: 'bg-blue-500',
    700: 'text-blue-700',
    800: 'text-blue-800',
    900: 'bg-blue-900',
  },
  // Tons de verde/emerald
  emerald: {
    100: 'bg-emerald-100',
    500: 'bg-emerald-500',
    700: 'text-emerald-700',
    800: 'text-emerald-800',
    900: 'bg-emerald-900',
  },
  // Tons de âmbar/warning
  amber: {
    100: 'bg-amber-100',
    500: 'bg-amber-500',
    700: 'text-amber-700',
    800: 'text-amber-800',
    900: 'bg-amber-900',
  },
  // Tons de vermelho/destructive
  red: {
    100: 'bg-red-100',
    500: 'bg-red-500',
    600: 'bg-red-600',
    700: 'text-red-700',
    800: 'text-red-800',
    900: 'bg-red-900',
  },
  // Tons de roxo
  purple: {
    100: 'bg-purple-100',
    500: 'bg-purple-500',
    700: 'text-purple-700',
    800: 'text-purple-800',
    900: 'bg-purple-900',
  },
  // Tons de cinza/slate
  slate: {
    100: 'bg-slate-100',
    500: 'bg-slate-500',
    700: 'text-slate-700',
    800: 'text-slate-800',
    900: 'bg-slate-900',
  },
  // Tons de laranja
  orange: {
    100: 'bg-orange-100',
    500: 'bg-orange-500',
    700: 'text-orange-700',
    800: 'text-orange-800',
    900: 'bg-orange-900',
  },
  // Tons de teal
  teal: {
    100: 'bg-teal-100',
    500: 'bg-teal-500',
    700: 'text-teal-700',
    800: 'text-teal-800',
    900: 'bg-teal-900',
  },
  // Tons de indigo
  indigo: {
    100: 'bg-indigo-100',
    500: 'bg-indigo-500',
    700: 'text-indigo-700',
    800: 'text-indigo-800',
    900: 'bg-indigo-900',
  },
  // Tons de cyan
  cyan: {
    100: 'bg-cyan-100',
    500: 'bg-cyan-500',
    700: 'text-cyan-700',
    800: 'text-cyan-800',
    900: 'bg-cyan-900',
  },
  // Tons de pink
  pink: {
    100: 'bg-pink-100',
    500: 'bg-pink-500',
    700: 'text-pink-700',
    800: 'text-pink-800',
    900: 'bg-pink-900',
  },
  // Tons de verde
  green: {
    100: 'bg-green-100',
    500: 'bg-green-500',
    700: 'text-green-700',
    800: 'text-green-800',
    900: 'bg-green-900',
  },
  // Tons de yellow
  yellow: {
    100: 'bg-yellow-100',
    500: 'bg-yellow-500',
    700: 'text-yellow-700',
    800: 'text-yellow-800',
    900: 'bg-yellow-900',
  },
} as const;

// =============================================================================
// ESPAÇAMENTOS (Grid 4px)
// =============================================================================

/**
 * Sistema de espaçamento baseado em grid de 4px.
 * Use estes valores para margins, paddings e gaps.
 */
export const SPACING = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

/**
 * Classes Tailwind de espaçamento comuns.
 * Use estas classes diretamente nos componentes.
 */
export const SPACING_CLASSES = {
  // Gaps
  gap: {
    xs: 'gap-1',     // 4px
    sm: 'gap-2',     // 8px
    md: 'gap-4',     // 16px
    lg: 'gap-6',     // 24px
    xl: 'gap-8',     // 32px
  },
  // Space-y (vertical)
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  // Space-x (horizontal)
  spaceX: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
  },
  // Padding
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
} as const;

// =============================================================================
// ESPAÇAMENTO SEMÂNTICO (Layout Patterns)
// =============================================================================

/**
 * Tokens de espaçamento semântico para padrões de layout comuns.
 * Use estes tokens para garantir consistência em layouts de página, seção e cards.
 *
 * @ai-context Prefira SPACING_SEMANTIC sobre SPACING_CLASSES para layouts.
 */
export const SPACING_SEMANTIC = {
  // Page Layout - Container principal da página
  page: {
    padding: 'p-4 sm:p-6 lg:p-8',
    paddingX: 'px-4 sm:px-6 lg:px-8',
    paddingY: 'py-4 sm:py-6 lg:py-8',
    gap: 'gap-6 lg:gap-8',
  },

  // Section Layout - Seções dentro de uma página
  section: {
    padding: 'p-4 sm:p-6',
    gap: 'gap-4 sm:gap-6',
    marginTop: 'mt-6 sm:mt-8',
    marginBottom: 'mb-6 sm:mb-8',
  },

  // Card Layout - Cards e containers
  card: {
    padding: 'p-4 sm:p-6',
    paddingCompact: 'p-3 sm:p-4',
    gap: 'gap-3 sm:gap-4',
    headerGap: 'gap-1.5',
  },

  // Inline Elements - Elementos lado a lado
  inline: {
    gap: 'gap-2',
    gapTight: 'gap-1',
    gapLoose: 'gap-3',
  },

  // Stack (vertical) - Elementos empilhados
  stack: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },

  // Form Elements - Formulários
  form: {
    gap: 'gap-4',
    fieldGap: 'gap-2',
    sectionGap: 'gap-6',
    labelGap: 'gap-1.5',
  },

  // Table Layout - Tabelas e data grids
  table: {
    cellPadding: 'px-3 py-2',
    headerPadding: 'px-3 py-3',
    gap: 'gap-4',
  },

  // Dialog/Modal Layout
  dialog: {
    padding: 'p-6',
    gap: 'gap-4',
    footerGap: 'gap-2',
  },
} as const;

// =============================================================================
// TIPOGRAFIA
// =============================================================================

/**
 * Tokens de tipografia.
 * Prefira usar os componentes Typography em vez de classes inline.
 */
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    heading: 'font-heading',
    body: 'font-sans',
    mono: 'font-mono',
  },
  // Font sizes
  fontSize: {
    xs: 'text-xs',       // 12px
    sm: 'text-sm',       // 14px
    base: 'text-base',   // 16px
    lg: 'text-lg',       // 18px
    xl: 'text-xl',       // 20px
    '2xl': 'text-2xl',   // 24px
    '3xl': 'text-3xl',   // 30px
    '4xl': 'text-4xl',   // 36px
  },
  // Font weights
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  // Line heights
  lineHeight: {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// =============================================================================
// SOMBRAS
// =============================================================================

/**
 * Sistema de sombras para elevação.
 * Evite shadow-xl - prefira shadow-lg ou menor.
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  // shadow-xl é proibido pelo design system
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Tokens de border radius.
 */
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Breakpoints responsivos.
 * Use os prefixos do Tailwind (sm:, md:, lg:, xl:, 2xl:).
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// TRANSIÇÕES
// =============================================================================

/**
 * Tokens de transição para animações suaves.
 */
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

/**
 * Sistema de z-index para gerenciar camadas.
 */
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-60',
  tooltip: 'z-70',
} as const;

// =============================================================================
// EXPORTS AGRUPADOS
// =============================================================================

export const TOKENS = {
  colors: COLORS,
  spacing: SPACING,
  spacingClasses: SPACING_CLASSES,
  spacingSemantic: SPACING_SEMANTIC,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  radius: RADIUS,
  breakpoints: BREAKPOINTS,
  transitions: TRANSITIONS,
  zIndex: Z_INDEX,
} as const;

export type TokensType = typeof TOKENS;
