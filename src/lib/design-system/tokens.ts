/**
 * Design System Tokens — ZattarOS
 *
 * Arquitetura: DTCG v2025.10 (Design Tokens Community Group, W3C) — hierarquia
 * em 3 camadas (reference → semantic → component).
 *
 * IMPORTANTE — Tailwind v4:
 *   A fonte canônica dos tokens de COR/FONTE é `src/app/globals.css` (bloco
 *   `@theme inline`). Este arquivo é um ESPELHO TIPADO: não altera valores,
 *   apenas expõe referências TS (string literals) seguras para autocomplete
 *   e para o script de auditoria.
 *
 * @ai-context Use este arquivo para importar tokens em TS. Para cores, use
 * os nomes semânticos ("primary", "success") em vez de valores OKLCH crus.
 * Para novos tokens, EDITE globals.css PRIMEIRO, depois espelhe aqui.
 */

// =============================================================================
// CAMADA 1 — REFERENCE TOKENS (CORE)
// =============================================================================

/**
 * User Palette — 18 cores OKLCH para tags, labels, cores configuráveis.
 * Cada cor tem croma 0.18 e luminosidade perceptualmente uniforme (~0.65)
 * para contraste WCAG AA em superfícies claras.
 *
 * Uso em React: style={{ color: 'var(--palette-1)' }} ou classes Tailwind
 * v4 aceitam a variável diretamente (text-[var(--palette-1)]).
 */
export const PALETTE = {
  1: { css: '--palette-1', hue: 25, name: 'vermelho', hex: '#ED4949' },
  2: { css: '--palette-2', hue: 50, name: 'laranja', hex: '#ED7E40' },
  3: { css: '--palette-3', hue: 75, name: 'âmbar', hex: '#E5A23A' },
  4: { css: '--palette-4', hue: 95, name: 'amarelo', hex: '#DAB52D' },
  5: { css: '--palette-5', hue: 130, name: 'lima', hex: '#9FBE3E' },
  6: { css: '--palette-6', hue: 145, name: 'verde', hex: '#4FB04F' },
  7: { css: '--palette-7', hue: 160, name: 'esmeralda', hex: '#3DAF7A' },
  8: { css: '--palette-8', hue: 180, name: 'teal', hex: '#3DAFA6' },
  9: { css: '--palette-9', hue: 210, name: 'ciano', hex: '#3DA8C7' },
  10: { css: '--palette-10', hue: 230, name: 'azul claro', hex: '#3D90D6' },
  11: { css: '--palette-11', hue: 255, name: 'azul', hex: '#3D6BD6' },
  12: { css: '--palette-12', hue: 275, name: 'índigo', hex: '#4D55E0' },
  13: { css: '--palette-13', hue: 295, name: 'violeta', hex: '#6E48E0' },
  14: { css: '--palette-14', hue: 310, name: 'roxo', hex: '#8E48E0' },
  15: { css: '--palette-15', hue: 330, name: 'fúcsia', hex: '#C449D6' },
  16: { css: '--palette-16', hue: 0, name: 'pink', hex: '#D6498F' },
  17: { css: '--palette-17', hue: 15, name: 'rosa', hex: '#DA4566' },
  18: { css: '--palette-18', hue: 281, name: 'cinza neutro', hex: '#6B6B70' },
} as const;

export type PaletteIndex = keyof typeof PALETTE;

/** Helper: retorna `var(--palette-N)` para uso em style ou template string. */
export const paletteVar = (n: PaletteIndex): string => `var(${PALETTE[n].css})`;

// =============================================================================
// CAMADA 2 — SEMANTIC TOKENS
// =============================================================================

/**
 * Tokens semânticos de cor. Espelham os nomes em @theme inline (globals.css).
 * Valores são strings literais — use como: `bg-${COLOR_TOKENS.primary}` → 'bg-primary'.
 */
export const COLOR_TOKENS = {
  // Core
  background: 'background',
  foreground: 'foreground',
  card: 'card',
  'card-foreground': 'card-foreground',
  popover: 'popover',
  'popover-foreground': 'popover-foreground',
  primary: 'primary',
  'primary-foreground': 'primary-foreground',
  secondary: 'secondary',
  'secondary-foreground': 'secondary-foreground',
  muted: 'muted',
  'muted-foreground': 'muted-foreground',
  accent: 'accent',
  'accent-foreground': 'accent-foreground',
  border: 'border',
  input: 'input',
  ring: 'ring',
  brand: 'brand',
  highlight: 'highlight',

  // Status
  success: 'success',
  'success-foreground': 'success-foreground',
  warning: 'warning',
  'warning-foreground': 'warning-foreground',
  info: 'info',
  'info-foreground': 'info-foreground',
  destructive: 'destructive',
  'destructive-foreground': 'destructive-foreground',

  // Sidebar
  sidebar: 'sidebar',
  'sidebar-foreground': 'sidebar-foreground',
  'sidebar-primary': 'sidebar-primary',
  'sidebar-primary-foreground': 'sidebar-primary-foreground',
  'sidebar-accent': 'sidebar-accent',
  'sidebar-accent-foreground': 'sidebar-accent-foreground',
  'sidebar-border': 'sidebar-border',
  'sidebar-ring': 'sidebar-ring',

  // Chart (1-8 + derivados)
  'chart-1': 'chart-1',
  'chart-2': 'chart-2',
  'chart-3': 'chart-3',
  'chart-4': 'chart-4',
  'chart-5': 'chart-5',
  'chart-6': 'chart-6',
  'chart-7': 'chart-7',
  'chart-8': 'chart-8',

  // Surface (MD3 layering alternativo + legacy)
  'surface-1': 'surface-1',
  'surface-2': 'surface-2',
  'surface-3': 'surface-3',
} as const;

export type ColorToken = keyof typeof COLOR_TOKENS;

/**
 * Status colors — mapeamento semântico para estados de UI.
 */
export const STATUS_COLORS = {
  success: { css: '--success', tailwind: 'success', icon: '✓' },
  warning: { css: '--warning', tailwind: 'warning', icon: '!' },
  info: { css: '--info', tailwind: 'info', icon: 'i' },
  error: { css: '--destructive', tailwind: 'destructive', icon: '✕' },
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;

// =============================================================================
// ENTIDADE DE DOMÍNIO JURÍDICO
// =============================================================================

/**
 * Cores semânticas por tipo de entidade no sistema jurídico.
 * Mapeadas em globals.css:714-718.
 */
export const ENTITY_COLORS = {
  cliente: { css: '--entity-cliente', maps: 'primary', intent: 'cliente principal do escritório' },
  'parte-contraria': { css: '--entity-parte-contraria', maps: 'warning', intent: 'oposição processual' },
  terceiro: { css: '--entity-terceiro', maps: 'info', intent: 'peritos, testemunhas, outros envolvidos' },
  representante: { css: '--entity-representante', maps: 'success', intent: 'representante legal' },
} as const;

export type EntityColor = keyof typeof ENTITY_COLORS;

// =============================================================================
// EVENT COLORS — Calendário / Agenda
// =============================================================================

/**
 * Mapeamento semântico de tipos de evento para cores da palette.
 * Fonte: globals.css:803-816.
 */
export const EVENT_TOKENS = {
  audiencia: { css: '--event-audiencia', palette: 10, semantic: 'formal/oficial' },
  expediente: { css: '--event-expediente', palette: 3, semantic: 'atenção/prazo' },
  obrigacao: { css: '--event-obrigacao', palette: 2, semantic: 'financeiro' },
  pericia: { css: '--event-pericia', palette: 13, semantic: 'técnico/expert' },
  agenda: { css: '--event-agenda', palette: 12, semantic: 'pessoal/neutro' },
  prazo: { css: '--event-prazo', palette: 1, semantic: 'urgência' },
  default: { css: '--event-default', palette: 11, semantic: 'fallback' },
} as const;

export type EventTokenKey = keyof typeof EVENT_TOKENS;

// =============================================================================
// MD3 — Material Design 3 Surface System
// =============================================================================

/**
 * Escala MD3 de surface hierarchy. Use quando precisar de níveis rigorosos
 * de elevação (além do glass depth 1-3).
 */
export const MD3_SURFACE = {
  surface: '--surface',
  'surface-dim': '--surface-dim',
  'surface-bright': '--surface-bright',
  'surface-container-lowest': '--surface-container-lowest',
  'surface-container-low': '--surface-container-low',
  'surface-container': '--surface-container',
  'surface-container-high': '--surface-container-high',
  'surface-container-highest': '--surface-container-highest',
  'surface-variant': '--surface-variant',
  'on-surface': '--on-surface',
  'on-surface-variant': '--on-surface-variant',
  'inverse-surface': '--inverse-surface',
  'inverse-on-surface': '--inverse-on-surface',
  outline: '--outline',
  'outline-variant': '--outline-variant',
} as const;

export type MD3SurfaceToken = keyof typeof MD3_SURFACE;

/**
 * Extended tonal palette (MD3 Primary/Secondary/Tertiary).
 * Use em componentes com requisito de "tonal palette" completa.
 */
export const MD3_TONAL = {
  // Primary extended
  'on-primary': '--on-primary',
  'primary-container': '--primary-container',
  'on-primary-container': '--on-primary-container',
  'primary-fixed': '--primary-fixed',
  'primary-fixed-dim': '--primary-fixed-dim',
  'on-primary-fixed': '--on-primary-fixed',
  'on-primary-fixed-variant': '--on-primary-fixed-variant',

  // Secondary extended
  'on-secondary': '--on-secondary',
  'secondary-container': '--secondary-container',
  'on-secondary-container': '--on-secondary-container',
  'secondary-fixed': '--secondary-fixed',
  'secondary-fixed-dim': '--secondary-fixed-dim',
  'on-secondary-fixed': '--on-secondary-fixed',
  'on-secondary-fixed-variant': '--on-secondary-fixed-variant',

  // Tertiary (hue 25° red complement)
  tertiary: '--tertiary',
  'on-tertiary': '--on-tertiary',
  'tertiary-container': '--tertiary-container',
  'on-tertiary-container': '--on-tertiary-container',
  'tertiary-fixed': '--tertiary-fixed',
  'tertiary-fixed-dim': '--tertiary-fixed-dim',
  'on-tertiary-fixed': '--on-tertiary-fixed',
  'on-tertiary-fixed-variant': '--on-tertiary-fixed-variant',

  // Error container
  'error-container': '--error-container',
  'on-error-container': '--on-error-container',
  'on-error': '--on-error',

  // Dim variants
  'primary-dim': '--primary-dim',
  'secondary-dim': '--secondary-dim',
  'tertiary-dim': '--tertiary-dim',
  'error-dim': '--error-dim',
  'inverse-primary': '--inverse-primary',
  'surface-tint': '--surface-tint',
} as const;

// =============================================================================
// PORTAL DO CLIENTE
// =============================================================================

/**
 * Tokens dedicados ao Portal do Cliente (rota /portal). Isolados para
 * evitar acoplamento com admin. Cada token tem override em :root + .dark.
 */
export const PORTAL_TOKENS = {
  bg: '--portal-bg',
  card: '--portal-card',
  'card-hover': '--portal-card-hover',
  surface: '--portal-surface',
  text: '--portal-text',
  'text-muted': '--portal-text-muted',
  'text-subtle': '--portal-text-subtle',
  primary: '--portal-primary',
  'primary-soft': '--portal-primary-soft',
  success: '--portal-success',
  'success-soft': '--portal-success-soft',
  warning: '--portal-warning',
  'warning-soft': '--portal-warning-soft',
  danger: '--portal-danger',
  'danger-soft': '--portal-danger-soft',
  info: '--portal-info',
  'info-soft': '--portal-info-soft',
} as const;

export type PortalToken = keyof typeof PORTAL_TOKENS;

// =============================================================================
// VIDEO CALL (Always Dark)
// =============================================================================

/**
 * Tokens de videochamada. Ignoram light/dark mode — sempre escuros por
 * demanda de contraste em vídeo.
 */
export const VIDEO_TOKENS = {
  bg: '--video-bg',
  surface: '--video-surface',
  'surface-hover': '--video-surface-hover',
  border: '--video-border',
  muted: '--video-muted',
  text: '--video-text',
  skeleton: '--video-skeleton',
} as const;

// =============================================================================
// CHAT
// =============================================================================

export const CHAT_TOKENS = {
  'thread-bg': '--chat-thread-bg',
  'bubble-received': '--chat-bubble-received',
  'bubble-sent': '--chat-bubble-sent',
  'sidebar-active': '--chat-sidebar-active',
} as const;

// =============================================================================
// GLOW EFFECTS
// =============================================================================

export const GLOW_EFFECTS = {
  primary: '--glow-primary',
  'primary-subtle': '--glow-primary-subtle',
  'primary-faint': '--glow-primary-faint',
  destructive: '--glow-destructive',
  warning: '--glow-warning',
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
 */
export const SPACING_CLASSES = {
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  spaceX: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
  },
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
} as const;

/**
 * Tokens de espaçamento semântico para padrões de layout comuns.
 * Prefira SPACING_SEMANTIC sobre SPACING_CLASSES para layouts.
 */
export const SPACING_SEMANTIC = {
  page: {
    padding: 'p-4 sm:p-6 lg:p-8',
    paddingX: 'px-4 sm:px-6 lg:px-8',
    paddingY: 'py-4 sm:py-6 lg:py-8',
    gap: 'gap-6 lg:gap-8',
  },
  section: {
    padding: 'p-4 sm:p-6',
    gap: 'gap-4 sm:gap-6',
    marginTop: 'mt-6 sm:mt-8',
    marginBottom: 'mb-6 sm:mb-8',
  },
  card: {
    padding: 'p-4 sm:p-6',
    paddingCompact: 'p-3 sm:p-4',
    gap: 'gap-3 sm:gap-4',
    headerGap: 'gap-1.5',
  },
  inline: {
    gap: 'gap-2',
    gapTight: 'gap-1',
    gapLoose: 'gap-3',
  },
  stack: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  form: {
    gap: 'gap-4',
    fieldGap: 'gap-2',
    sectionGap: 'gap-6',
    labelGap: 'gap-1.5',
  },
  table: {
    cellPadding: 'px-3 py-2',
    headerPadding: 'px-3 py-3',
    gap: 'gap-4',
  },
  dialog: {
    padding: 'p-6',
    gap: 'gap-4',
    footerGap: 'gap-2',
  },
} as const;

// =============================================================================
// TIPOGRAFIA
// =============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'font-heading',
    body: 'font-sans',
    mono: 'font-mono',
    display: 'font-display',
    headline: 'font-headline',
  },
  fontSize: {
    '3xs': 'text-[9px]',
    '2xs': 'text-[10px]',
    'xs-fixed': 'text-[11px]',
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  },
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  lineHeight: {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

/**
 * Padrões tipográficos recorrentes.
 *
 * @deprecated Use typed components from `@/components/ui/typography`:
 *   `<Heading level="page">` instead of TEXT_PATTERNS.pageTitle
 *   `<Heading level="widget">` instead of TEXT_PATTERNS.widgetTitle
 *   `<Text variant="kpi-value">` instead of TEXT_PATTERNS.kpiValue
 *   `<Text variant="meta-label">` instead of TEXT_PATTERNS.metaLabel
 *   `<Text variant="mono-num">` instead of TEXT_PATTERNS.monoNum
 */
export const TEXT_PATTERNS = {
  metaLabel: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
  monoNum: 'text-[10px] font-mono text-muted-foreground/55 tabular-nums',
  microBadge: 'text-[9px] font-medium',
  microCaption: 'text-[10px] text-muted-foreground/50',
  pageTitle: 'text-page-title',
  widgetTitle: 'text-widget-title',
  cardTitle: 'text-card-title',
  widgetSub: 'text-widget-sub',
  kpiValue: 'text-kpi-value',
  inlineTag: 'text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50 border border-primary/10',
  pillTag: 'text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10',
} as const;

// =============================================================================
// ESCALA DE OPACIDADE
// =============================================================================

/**
 * Escala de opacidade documentada. Define QUANDO usar cada nível.
 * NUNCA invente opacidades fora desta escala sem justificativa.
 */
export const OPACITY_SCALE = {
  primaryBg: {
    subtle: '/3',
    whisper: '/4',
    tint: '/5',
    soft: '/6',
    medium: '/8',
    strong: '/10',
    emphasis: '/15',
  },
  border: {
    ghost: '/10',
    subtle: '/20',
    light: '/30',
    medium: '/40',
    standard: '/50',
  },
  mutedText: {
    ghost: '/40',
    faint: '/50',
    subtle: '/55',
    soft: '/60',
    standard: '',
  },
  primaryText: {
    faint: '/50',
    soft: '/60',
    medium: '/70',
    standard: '',
  },
} as const;

// =============================================================================
// LAYOUT DE PÁGINA
// =============================================================================

export const PAGE_LAYOUT = {
  container: 'max-w-350 mx-auto',
  sectionGap: 'space-y-5',
  pagePadding: 'py-6',
  page: 'max-w-350 mx-auto space-y-5 py-6',
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  detailLayout: 'grid gap-3 lg:grid-cols-[1fr_380px]',
  detailPanel: 'sticky top-4 self-start',
  pageHeader: 'flex items-start justify-between gap-4',
  toolbar: 'flex flex-col sm:flex-row items-start sm:items-center gap-3',
} as const;

// =============================================================================
// GLASS PANEL
// =============================================================================

/**
 * Tokens do sistema de profundidade Glass.
 * Base compartilhada: rounded-2xl border transition-all duration-300 flex flex-col
 */
export const GLASS_DEPTH = {
  1: 'glass-widget bg-transparent border-border/20',
  2: 'glass-kpi bg-transparent border-border/30',
  3: 'bg-primary/[0.04] backdrop-blur-xl border-primary/10',
} as const;

export const GLASS_BASE = 'rounded-2xl border transition-all duration-300 flex flex-col' as const;

/**
 * Variantes de glass classes (além do depth system).
 * Use via className="glass-dialog" etc.
 */
export const GLASS_VARIANTS = {
  kpi: 'glass-kpi',
  widget: 'glass-widget',
  card: 'glass-card',
  panel: 'glass-panel',
  dropdown: 'glass-dropdown',
  dialog: 'glass-dialog',
  'dialog-overlay': 'glass-dialog-overlay',
} as const;

export type GlassVariant = keyof typeof GLASS_VARIANTS;

// =============================================================================
// ICON CONTAINERS
// =============================================================================

export const ICON_CONTAINER = {
  lg: 'size-10 rounded-xl flex items-center justify-center shrink-0',
  md: 'size-8 rounded-lg flex items-center justify-center shrink-0',
  sm: 'size-6 rounded-md flex items-center justify-center shrink-0',
  xs: 'size-5 rounded flex items-center justify-center shrink-0',
} as const;

// =============================================================================
// AVATAR SIZES
// =============================================================================

export const AVATAR_SIZES = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'size-10',
  xl: 'size-12',
  '2xl': 'h-14 w-14',
  '3xl': 'h-16 w-16',
} as const;

// =============================================================================
// SOMBRAS
// =============================================================================

/**
 * Sistema de sombras para elevação. shadow-xl e acima são PROIBIDOS.
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  ambient: 'shadow-ambient',
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

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

export const BREAKPOINTS = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// TRANSIÇÕES
// =============================================================================

export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const;

/**
 * Durações em ms — use para animações programáticas (framer-motion, setTimeout).
 */
export const DURATION_MS = {
  fast: 150,
  normal: 200,
  slow: 300,
  chart: 500,
  long: 700,
  count: 1200,
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

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
// THEME PRESETS (Runtime)
// =============================================================================

/**
 * Presets de tema disponíveis via body[data-theme-preset].
 * Valores OKLCH vivem em globals.css (fonte única); aqui só os rótulos
 * humanos usados na UI de customização.
 */
export const THEME_PRESETS = {
  default: { name: 'Zattar Purple' },
  blue: { name: 'Blue' },
  green: { name: 'Green' },
  orange: { name: 'Orange' },
  red: { name: 'Red' },
  violet: { name: 'Violet' },
  yellow: { name: 'Yellow' },
  slate: { name: 'Slate' },
} as const;

export type ThemePreset = keyof typeof THEME_PRESETS;

export const THEME_RADIUS = {
  none: '0rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
} as const;

export type ThemeRadius = keyof typeof THEME_RADIUS;

export const THEME_SCALE = {
  sm: '90%',
  default: '100%',
  lg: '110%',
} as const;

export type ThemeScale = keyof typeof THEME_SCALE;

// =============================================================================
// WIDGET COMPONENT TOKENS
// =============================================================================

export const WIDGET_TOKENS = {
  radius: 'var(--widget-radius)',
  padding: 'var(--widget-padding)',
  gap: 'var(--widget-gap)',
  borderOpacity: 'var(--widget-border-opacity)',
  labelSize: 'var(--widget-label-size)',
  numberWeight: 'var(--widget-number-weight)',
  transition: 'var(--widget-transition)',
  hoverScale: 'var(--widget-hover-scale)',
} as const;

export const CARD_ENTITY_TOKENS = {
  radius: 'var(--card-entity-radius)',
  padding: 'var(--card-entity-padding)',
  avatarSize: 'var(--card-entity-avatar-size)',
  avatarRadius: 'var(--card-entity-avatar-radius)',
} as const;

export const TAB_PILL_TOKENS = {
  radius: 'var(--tab-pill-radius)',
  paddingX: 'var(--tab-pill-padding-x)',
  paddingY: 'var(--tab-pill-padding-y)',
  activeBg: 'var(--tab-pill-active-bg)',
} as const;

export const PULSE_STRIP_TOKENS = {
  gap: 'var(--pulse-gap)',
  paddingX: 'var(--pulse-padding-x)',
  paddingY: 'var(--pulse-padding-y)',
} as const;

export const DETAIL_PANEL_WIDTH = 'var(--detail-panel-width)' as const;

// =============================================================================
// EXPORTS AGRUPADOS
// =============================================================================

export const TOKENS = {
  // Camada 1 — Reference
  palette: PALETTE,

  // Camada 2 — Semantic
  colors: COLOR_TOKENS,
  status: STATUS_COLORS,
  entity: ENTITY_COLORS,
  events: EVENT_TOKENS,
  md3Surface: MD3_SURFACE,
  md3Tonal: MD3_TONAL,
  portal: PORTAL_TOKENS,
  video: VIDEO_TOKENS,
  chat: CHAT_TOKENS,
  glow: GLOW_EFFECTS,

  // Camada 3 — Component
  widget: WIDGET_TOKENS,
  cardEntity: CARD_ENTITY_TOKENS,
  tabPill: TAB_PILL_TOKENS,
  pulseStrip: PULSE_STRIP_TOKENS,
  detailPanelWidth: DETAIL_PANEL_WIDTH,

  // Layout & primitives
  spacing: SPACING,
  spacingClasses: SPACING_CLASSES,
  spacingSemantic: SPACING_SEMANTIC,
  typography: TYPOGRAPHY,
  textPatterns: TEXT_PATTERNS,
  opacityScale: OPACITY_SCALE,
  pageLayout: PAGE_LAYOUT,
  glassDepth: GLASS_DEPTH,
  glassBase: GLASS_BASE,
  glassVariants: GLASS_VARIANTS,
  iconContainer: ICON_CONTAINER,
  avatarSizes: AVATAR_SIZES,
  shadows: SHADOWS,
  radius: RADIUS,
  breakpoints: BREAKPOINTS,
  transitions: TRANSITIONS,
  durationMs: DURATION_MS,
  zIndex: Z_INDEX,

  // Theming
  themePresets: THEME_PRESETS,
  themeRadius: THEME_RADIUS,
  themeScale: THEME_SCALE,
} as const;

export type TokensType = typeof TOKENS;
