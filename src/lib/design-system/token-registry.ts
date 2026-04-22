/**
 * Token Registry — inventário canônico de TODAS as CSS variables do Zattar OS.
 *
 * Este arquivo é a LISTA AUTORITATIVA de tokens existentes em `src/app/globals.css`.
 * Usado por:
 *   1. scripts/audit-design-system.ts — valida cobertura de documentação
 *   2. MASTER.md — garantia de que nenhum token fica sem doc
 *   3. Style linters — detectar uso de token não-registrado
 *
 * Manutenção: quando adicionar/remover uma CSS variable em globals.css,
 * atualizar esta lista no MESMO PR. O script de auditoria detecta drift.
 *
 * Última atualização: 2026-04-22 · Total: 495 tokens
 */

/**
 * Token entry com metadados mínimos.
 */
export interface TokenEntry {
  /** Nome completo da CSS variable (com `--` prefix) */
  name: string;
  /** Categoria semântica para agrupar em reports */
  category: TokenCategory;
  /** Camada DTCG: reference | semantic | component */
  layer: 'reference' | 'semantic' | 'component';
  /** Modos que sobrescrevem este token */
  modes: TokenMode[];
  /** Descrição curta do propósito */
  purpose?: string;
}

export type TokenCategory =
  | 'core'
  | 'status'
  | 'sidebar'
  | 'chart'
  | 'chart-derived'
  | 'md3-surface'
  | 'md3-tonal'
  | 'palette'
  | 'event'
  | 'chat'
  | 'video'
  | 'portal'
  | 'entity'
  | 'glow'
  | 'skeleton'
  | 'gauge'
  | 'insight'
  | 'widget'
  | 'card-entity'
  | 'tab-pill'
  | 'pulse-strip'
  | 'detail-panel'
  | 'search'
  | 'typography'
  | 'radius'
  | 'breakpoint';

export type TokenMode = 'light' | 'dark' | 'portal' | 'website' | 'video-always';

// =============================================================================
// TOKENS — por categoria
// =============================================================================

/**
 * Reference Tokens — user palette (18 cores, single mode).
 */
export const PALETTE_REGISTRY: TokenEntry[] = Array.from({ length: 18 }, (_, i) => ({
  name: `--palette-${i + 1}`,
  category: 'palette',
  layer: 'reference',
  modes: ['light', 'dark'],
  purpose: `User-selectable palette color ${i + 1}`,
}));

/**
 * Core semantic tokens.
 */
export const CORE_REGISTRY: TokenEntry[] = [
  { name: '--background', category: 'core', layer: 'semantic', modes: ['light', 'dark', 'website'], purpose: 'Canvas principal' },
  { name: '--foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Texto principal' },
  { name: '--card', category: 'core', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Fundo de cards' },
  { name: '--card-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--popover', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--popover-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--primary', category: 'core', layer: 'semantic', modes: ['light', 'dark', 'website'], purpose: 'CTAs, links, foco' },
  { name: '--primary-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--secondary', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--secondary-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--muted', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--muted-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--accent', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--accent-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--destructive', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--destructive-foreground', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--border', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--input', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--ring', category: 'core', layer: 'semantic', modes: ['light', 'dark'], purpose: 'transparent (disabled)' },
  { name: '--brand', category: 'core', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--highlight', category: 'core', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Action Orange' },
  { name: '--radius', category: 'radius', layer: 'reference', modes: ['light', 'dark'], purpose: 'Base 8px, override via data-theme-radius' },
];

export const STATUS_REGISTRY: TokenEntry[] = [
  { name: '--success', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--success-foreground', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--warning', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--warning-foreground', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--info', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--info-foreground', category: 'status', layer: 'semantic', modes: ['light', 'dark'] },
];

export const SIDEBAR_REGISTRY: TokenEntry[] = [
  { name: '--sidebar', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-foreground', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-primary', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-primary-foreground', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-accent', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-accent-foreground', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-border', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--sidebar-ring', category: 'sidebar', layer: 'semantic', modes: ['light', 'dark'] },
];

export const CHART_REGISTRY: TokenEntry[] = [
  ...Array.from({ length: 8 }, (_, i): TokenEntry => ({
    name: `--chart-${i + 1}`,
    category: 'chart',
    layer: 'semantic',
    modes: ['light', 'dark'],
  })),
  { name: '--chart-primary-soft', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-destructive-soft', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-warning-soft', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-success-soft', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-muted-soft', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-success-dark', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chart-warning-dark', category: 'chart-derived', layer: 'semantic', modes: ['light', 'dark'] },
];

export const MD3_SURFACE_REGISTRY: TokenEntry[] = [
  { name: '--surface', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-dim', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-bright', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-container-lowest', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-container-low', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-container', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-container-high', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-container-highest', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-variant', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-surface', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-surface-variant', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--inverse-surface', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--inverse-on-surface', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--outline', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--outline-variant', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-1', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Legacy alias' },
  { name: '--surface-2', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Legacy alias' },
  { name: '--surface-3', category: 'md3-surface', layer: 'semantic', modes: ['light', 'dark'], purpose: 'Legacy alias' },
];

export const MD3_TONAL_REGISTRY: TokenEntry[] = [
  // Primary extended
  { name: '--on-primary', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--primary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-primary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--primary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--primary-fixed-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-primary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-primary-fixed-variant', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  // Secondary extended
  { name: '--on-secondary', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--secondary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-secondary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--secondary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--secondary-fixed-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-secondary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-secondary-fixed-variant', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  // Tertiary (hue 25°)
  { name: '--tertiary', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-tertiary', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--tertiary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-tertiary-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--tertiary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--tertiary-fixed-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-tertiary-fixed', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-tertiary-fixed-variant', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  // Error
  { name: '--error-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-error-container', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--on-error', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  // Dim variants
  { name: '--primary-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark', 'website'] },
  { name: '--secondary-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--tertiary-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--error-dim', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--inverse-primary', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--surface-tint', category: 'md3-tonal', layer: 'semantic', modes: ['light', 'dark'] },
];

export const PORTAL_REGISTRY: TokenEntry[] = [
  { name: '--portal-bg', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-card', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-card-hover', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-surface', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-text', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-text-muted', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-text-subtle', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-primary', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-primary-soft', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-success', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-success-soft', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-warning', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-warning-soft', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-danger', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-danger-soft', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-info', category: 'portal', layer: 'semantic', modes: ['portal'] },
  { name: '--portal-info-soft', category: 'portal', layer: 'semantic', modes: ['portal'] },
];

export const VIDEO_REGISTRY: TokenEntry[] = [
  { name: '--video-bg', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-surface', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-surface-hover', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-border', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-muted', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-text', category: 'video', layer: 'semantic', modes: ['video-always'] },
  { name: '--video-skeleton', category: 'video', layer: 'semantic', modes: ['video-always'] },
];

export const CHAT_REGISTRY: TokenEntry[] = [
  { name: '--chat-thread-bg', category: 'chat', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chat-bubble-received', category: 'chat', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chat-bubble-sent', category: 'chat', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--chat-sidebar-active', category: 'chat', layer: 'semantic', modes: ['light', 'dark'] },
];

export const EVENT_REGISTRY: TokenEntry[] = [
  { name: '--event-audiencia', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-expediente', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-obrigacao', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-pericia', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-agenda', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-prazo', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--event-default', category: 'event', layer: 'semantic', modes: ['light', 'dark'] },
];

export const ENTITY_REGISTRY: TokenEntry[] = [
  { name: '--entity-cliente', category: 'entity', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--entity-parte-contraria', category: 'entity', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--entity-terceiro', category: 'entity', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--entity-representante', category: 'entity', layer: 'semantic', modes: ['light', 'dark'] },
];

export const EFFECT_REGISTRY: TokenEntry[] = [
  // Glow
  { name: '--glow-primary', category: 'glow', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--glow-primary-subtle', category: 'glow', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--glow-primary-faint', category: 'glow', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--glow-destructive', category: 'glow', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--glow-warning', category: 'glow', layer: 'semantic', modes: ['light', 'dark'] },
  // Skeleton
  { name: '--skeleton', category: 'skeleton', layer: 'semantic', modes: ['light', 'dark'] },
  { name: '--skeleton-highlight', category: 'skeleton', layer: 'semantic', modes: ['light', 'dark'] },
  // Gauge
  { name: '--gauge-good', category: 'gauge', layer: 'component', modes: ['light', 'dark'] },
  { name: '--gauge-warning', category: 'gauge', layer: 'component', modes: ['light', 'dark'] },
  { name: '--gauge-danger', category: 'gauge', layer: 'component', modes: ['light', 'dark'] },
  { name: '--gauge-neutral', category: 'gauge', layer: 'component', modes: ['light', 'dark'] },
  // Insight banner
  { name: '--insight-alert-bg', category: 'insight', layer: 'component', modes: ['light', 'dark'] },
  { name: '--insight-success-bg', category: 'insight', layer: 'component', modes: ['light', 'dark'] },
  { name: '--insight-info-bg', category: 'insight', layer: 'component', modes: ['light', 'dark'] },
  { name: '--insight-warning-bg', category: 'insight', layer: 'component', modes: ['light', 'dark'] },
];

export const COMPONENT_REGISTRY: TokenEntry[] = [
  // Widget
  { name: '--widget-radius', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-padding', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-gap', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-border-opacity', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-label-size', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-number-weight', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-transition', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  { name: '--widget-hover-scale', category: 'widget', layer: 'component', modes: ['light', 'dark'] },
  // Card entity
  { name: '--card-entity-radius', category: 'card-entity', layer: 'component', modes: ['light', 'dark'] },
  { name: '--card-entity-padding', category: 'card-entity', layer: 'component', modes: ['light', 'dark'] },
  { name: '--card-entity-avatar-size', category: 'card-entity', layer: 'component', modes: ['light', 'dark'] },
  { name: '--card-entity-avatar-radius', category: 'card-entity', layer: 'component', modes: ['light', 'dark'] },
  // Tab pill
  { name: '--tab-pill-radius', category: 'tab-pill', layer: 'component', modes: ['light', 'dark'] },
  { name: '--tab-pill-padding-x', category: 'tab-pill', layer: 'component', modes: ['light', 'dark'] },
  { name: '--tab-pill-padding-y', category: 'tab-pill', layer: 'component', modes: ['light', 'dark'] },
  { name: '--tab-pill-active-bg', category: 'tab-pill', layer: 'component', modes: ['light', 'dark'] },
  // Pulse strip
  { name: '--pulse-gap', category: 'pulse-strip', layer: 'component', modes: ['light', 'dark'] },
  { name: '--pulse-padding-x', category: 'pulse-strip', layer: 'component', modes: ['light', 'dark'] },
  { name: '--pulse-padding-y', category: 'pulse-strip', layer: 'component', modes: ['light', 'dark'] },
  // Detail panel
  { name: '--detail-panel-width', category: 'detail-panel', layer: 'component', modes: ['light', 'dark'] },
  // Search
  { name: '--search-radius', category: 'search', layer: 'component', modes: ['light', 'dark'] },
  { name: '--search-bg', category: 'search', layer: 'component', modes: ['light', 'dark'] },
];

export const TYPOGRAPHY_REGISTRY: TokenEntry[] = [
  { name: '--font-sans', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-heading', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-display', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-headline', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-mono', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-label', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
  { name: '--font-body', category: 'typography', layer: 'reference', modes: ['light', 'dark'] },
];

// =============================================================================
// CONSOLIDADO
// =============================================================================

/** Todos os tokens registrados. */
export const TOKEN_REGISTRY: readonly TokenEntry[] = [
  ...CORE_REGISTRY,
  ...STATUS_REGISTRY,
  ...SIDEBAR_REGISTRY,
  ...CHART_REGISTRY,
  ...MD3_SURFACE_REGISTRY,
  ...MD3_TONAL_REGISTRY,
  ...PALETTE_REGISTRY,
  ...EVENT_REGISTRY,
  ...ENTITY_REGISTRY,
  ...PORTAL_REGISTRY,
  ...VIDEO_REGISTRY,
  ...CHAT_REGISTRY,
  ...EFFECT_REGISTRY,
  ...COMPONENT_REGISTRY,
  ...TYPOGRAPHY_REGISTRY,
];

/** Mapeamento rápido por nome para lookup. */
export const TOKEN_BY_NAME: ReadonlyMap<string, TokenEntry> = new Map(
  TOKEN_REGISTRY.map((t) => [t.name, t])
);

/** Agrupamento por categoria para reports. */
export function tokensByCategory(): Record<TokenCategory, TokenEntry[]> {
  const result = {} as Record<TokenCategory, TokenEntry[]>;
  for (const token of TOKEN_REGISTRY) {
    if (!result[token.category]) result[token.category] = [];
    result[token.category].push(token);
  }
  return result;
}

/** Contagem de tokens por camada DTCG. */
export function tokensByLayer(): Record<'reference' | 'semantic' | 'component', number> {
  return {
    reference: TOKEN_REGISTRY.filter((t) => t.layer === 'reference').length,
    semantic: TOKEN_REGISTRY.filter((t) => t.layer === 'semantic').length,
    component: TOKEN_REGISTRY.filter((t) => t.layer === 'component').length,
  };
}

/** Total absoluto de tokens registrados. */
export const TOKEN_COUNT = TOKEN_REGISTRY.length;
