/**
 * DASHBOARD DESIGN SYSTEM — Barrel Export
 * ============================================================================
 * Exporta todas as primitivas de widgets e utilitários do design system.
 * Use: import { GlassPanel, Sparkline, GaugeMeter, ... } from '@/components/dashboard'
 * ============================================================================
 */

export {
  // Layout
  GlassPanel,
  WidgetContainer,
  GallerySection,
  ListItem,

  // Charts
  Sparkline,
  MiniArea,
  MiniBar,
  MiniDonut,
  StackedBar,
  Treemap,

  // Indicators
  UrgencyDot,
  ProgressRing,
  GaugeMeter,
  AnimatedNumber,

  // Intelligence
  InsightBanner,
  TabToggle,
  CalendarHeatmap,
  ComparisonStat,

  // Data display
  Stat,

  // Helpers
  fmtMoeda,
  fmtNum,
  fmtData,
} from '@/app/app/dashboard/mock/widgets/primitives';
