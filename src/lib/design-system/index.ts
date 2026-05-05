/**
 * Design System ZattarOS
 *
 * Sistema de Design Determinístico para aplicações AI-First.
 * Este módulo centraliza tokens, variantes e utilitários para garantir
 * consistência visual em todo o sistema.
 *
 * @ai-context Importe deste módulo para acessar tokens de design e mapeamentos semânticos.
 * Use getSemanticBadgeVariant() para determinar variantes visuais baseadas em domínio.
 *
 * @example
 * import { getSemanticBadgeVariant, TOKENS, FORMAT, PALETTE } from '@/lib/design-system';
 *
 * const variant = getSemanticBadgeVariant('tribunal', 'TRT1'); // 'info'
 * const valor = FORMAT.currency(1234.56); // "R$ 1.234,56"
 * const paletteColor = PALETTE[5].hex; // '#9FBE3E' (lima)
 */

// =============================================================================
// Tokens fundamentais
// =============================================================================
export {
  // Reference layer
  PALETTE,
  paletteVar,

  // Semantic layer — color
  COLOR_TOKENS,
  STATUS_COLORS,
  ENTITY_COLORS,
  EVENT_TOKENS,
  MD3_SURFACE,
  MD3_TONAL,
  PORTAL_TOKENS,
  VIDEO_TOKENS,
  CHAT_TOKENS,
  GLOW_EFFECTS,

  // Component layer
  WIDGET_TOKENS,
  CARD_ENTITY_TOKENS,
  TAB_PILL_TOKENS,
  PULSE_STRIP_TOKENS,
  DETAIL_PANEL_WIDTH,

  // Layout primitives
  SPACING,
  SPACING_CLASSES,
  SPACING_SEMANTIC,
  TYPOGRAPHY,
  TEXT_PATTERNS,
  OPACITY_SCALE,
  PAGE_LAYOUT,
  GLASS_DEPTH,
  GLASS_BASE,
  GLASS_VARIANTS,
  ICON_CONTAINER,
  AVATAR_SIZES,
  SHADOWS,
  RADIUS,
  BREAKPOINTS,
  TRANSITIONS,
  DURATION_MS,
  Z_INDEX,

  // Runtime theming
  THEME_PRESETS,
  THEME_RADIUS,
  THEME_SCALE,

  // Barrel
  TOKENS,

  // Types
  type TokensType,
  type PaletteIndex,
  type ColorToken,
  type StatusColor,
  type EntityColor,
  type EventTokenKey,
  type MD3SurfaceToken,
  type PortalToken,
  type GlassVariant,
  type ThemePreset,
  type ThemeRadius,
  type ThemeScale,
} from './tokens';

// =============================================================================
// Token Registry (auditoria e validação)
// =============================================================================
export {
  TOKEN_REGISTRY,
  TOKEN_BY_NAME,
  TOKEN_COUNT,
  tokensByCategory,
  tokensByLayer,
  CORE_REGISTRY,
  STATUS_REGISTRY,
  SIDEBAR_REGISTRY,
  CHART_REGISTRY,
  MD3_SURFACE_REGISTRY,
  MD3_TONAL_REGISTRY,
  PALETTE_REGISTRY,
  PORTAL_REGISTRY,
  VIDEO_REGISTRY,
  CHAT_REGISTRY,
  EVENT_REGISTRY,
  ENTITY_REGISTRY,
  EFFECT_REGISTRY,
  COMPONENT_REGISTRY,
  TYPOGRAPHY_REGISTRY,
  BREAKPOINT_REGISTRY,
  type TokenEntry,
  type TokenCategory,
  type TokenMode,
} from './token-registry';

// =============================================================================
// Variantes semânticas e mapeamentos
// =============================================================================
export {
  // Tipos
  type BadgeVisualVariant,
  type BadgeTone,
  type BadgeCategory,

  // Mapeamentos individuais
  TRIBUNAL_VARIANTS,
  STATUS_VARIANTS,
  GRAU_VARIANTS,
  PARTE_TIPO_VARIANTS,
  POLO_VARIANTS,
  AUDIENCIA_STATUS_VARIANTS,
  AUDIENCIA_MODALIDADE_VARIANTS,
  EXPEDIENTE_TIPO_VARIANTS,
  CAPTURA_STATUS_VARIANTS,
  COMUNICACAO_CNJ_VARIANTS,
  PERICIA_SITUACAO_VARIANTS,
  PARCELA_STATUS_VARIANTS,
  REPASSE_STATUS_VARIANTS,
  DOCUMENTO_STATUS_VARIANTS,

  // Funções
  getSemanticBadgeVariant,
  getSemanticBadgeTone,
  getExpedienteTipoVariant,

  // Labels
  PARTE_TIPO_LABELS,
  GRAU_LABELS,
  CAPTURA_STATUS_LABELS,
  getParteTipoLabel,

  // Exports agrupados
  VARIANTS,
  LABELS,
} from './variants';

// =============================================================================
// Event Colors (calendar/agenda)
// =============================================================================
export {
  type EventType,
  type LegacyEventColor,
  type EventColorClasses,
  getEventColorClasses,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from './event-colors';

// =============================================================================
// Semantic Tones
// =============================================================================
export {
  type SemanticTone,
  tokenForTone,
  bgClassForTone,
  textClassForTone,
} from './semantic-tones';

// =============================================================================
// Utilitários
// =============================================================================
export {
  cn,

  // Formatação
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatCPF,
  formatCNPJ,
  formatDocument,
  formatPhone,
  formatProcessNumber,
  truncateText,
  toTitleCase,
  removeAccents,

  // Validação
  isValidCPF,
  isValidCNPJ,

  // Cálculos
  calculateAge,
  daysUntil,

  // Barrel
  FORMAT,
  VALIDATE,
  CALC,
} from './utils';
