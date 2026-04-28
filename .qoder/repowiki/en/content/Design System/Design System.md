# Design System

<cite>
**Referenced Files in This Document**
- [MASTER.md](file://design-system/zattaros/MASTER.md)
- [audiencias.md](file://design-system/zattaros/pages/audiencias.md)
- [captura.md](file://design-system/zattaros/pages/captura.md)
- [expedientes.md](file://design-system/zattaros/pages/expedientes.md)
- [variants.ts](file://src/lib/design-system/variants.ts)
- [colors-section.tsx](file://src/app/(authenticated)/design-system/_components/colors-section.tsx)
- [spacing-section.tsx](file://src/app/(authenticated)/design-system/_components/spacing-section.tsx)
- [page-client.tsx](file://src/app/(authenticated)/ajuda/design-system/playground/page-client.tsx)
- [page.tsx](file://src/app/(authenticated)/design-system/page.tsx)
- [typography.tsx](file://src/components/ui/typography.tsx)
- [globals.css](file://src/app/globals.css)
- [tokens.ts](file://src/lib/design-system/tokens.ts)
- [semantic-badge.tsx](file://src/components/ui/semantic-badge.tsx)
- [badge.tsx](file://src/components/ui/badge.tsx)
- [audiencias-filter-bar.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx)
- [audiencias-semana-view.tsx](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx)
- [audiencia-status-badge.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-status-badge.tsx)
- [audiencia-modalidade-badge.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-modalidade-badge.tsx)
- [audiencia-indicador-badges.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-indicador-badges.tsx)
- [use-breakpoint.ts](file://src/hooks/use-breakpoint.ts)
- [use-mobile.ts](file://src/hooks/use-mobile.ts)
- [responsive.ts](file://src/types/responsive.ts)
- [use-responsive-layout.ts](file://src/app/(authenticated)/chat/hooks/use-responsive-layout.ts)
- [radix-ui.js](file://src/__mocks__/radix-ui.js)
- [base-vs-radix.md](file://.agents/skills/shadcn/rules/base-vs-radix.md)
- [token-registry.ts](file://src/lib/design-system/token-registry.ts)
</cite>

## Update Summary
**Changes Made**
- Updated to reflect major UI component refactoring and modernization effort
- Documented migration from @radix-ui/react-* to radix-ui unified packages
- Enhanced styling consistency with new CSS variables and design tokens
- Improved accessibility features with WCAG AAA compliance
- Streamlined component APIs with responsive utility hooks
- Introduced new responsive utilities including useIsMobile hook
- Updated design system governance with enhanced breakpoint management

## Table of Contents
1. [Introduction](#introduction)
2. [Hierarchical Design System Architecture](#hierarchical-design-system-architecture)
3. [Master Authority and Page-Specific Overrides](#master-authority-and-page-specific-overrides)
4. [Migration Strategy with Design System Escape Comments](#migration-strategy-with-design-system-escape-comments)
5. [Enhanced Typography System](#enhanced-typography-system)
6. [New Semantic Text Classes](#new-semantic-text-classes)
7. [Accessibility Compliance Improvements](#accessibility-compliance-improvements)
8. [Component Library Integration](#component-library-integration)
9. [Enhanced Semantic Badge System](#enhanced-semantic-badge-system)
10. [CountBadge Component](#countbadge-component)
11. [Responsive Utilities and Breakpoint Management](#responsive-utilities-and-breakpoint-management)
12. [Radix UI Modernization and Component Refactoring](#radix-ui-modernization-and-component-refactoring)
13. [Enhanced CSS Variables and Design Tokens](#enhanced-css-variables-and-design-tokens)
14. [Design System Playground](#design-system-playground)
15. [Page-Specific Implementation Examples](#page-specific-implementation-examples)
16. [Quality Assurance and Migration Tracking](#quality-assurance-and-migration-tracking)
17. [Integration and Maintenance](#integration-and-maintenance)
18. [Conclusion](#conclusion)

## Introduction
The ZattarOS Design System represents a comprehensive visual and interaction framework built on shadcn/ui components with semantic badge architecture. The system has undergone a major modernization effort featuring migration from @radix-ui/react-* packages to the unified radix-ui package, enhanced styling consistency through new CSS variables, improved accessibility compliance with WCAG AAA standards, streamlined component APIs, and introduction of responsive utilities like the useIsMobile hook.

**Updated** The system now features comprehensive responsive utility management, modernized component architecture, and enhanced design token governance. The migration to unified radix-ui packages ensures better maintainability and consistency across the component library, while the new responsive utilities provide developers with powerful tools for adaptive UI development.

This architecture ensures consistency across the legal management platform while allowing for module-specific adaptations through a well-defined override mechanism and modernized component development practices.

## Hierarchical Design System Architecture

The ZattarOS Design System operates on a three-tier hierarchical architecture that balances standardization with flexibility, now enhanced with modern responsive utilities and component refactoring.

### Master Authority Layer
The MASTER.md file serves as the central governing document containing 175 lines of essential design system rules. It establishes the foundational principles that all modules must follow unless overridden by specific page documentation.

**Core Governance Principles**
- **Central Authority**: MASTER.md provides canonical rules for all design system implementations
- **Standardization**: Ensures consistent design language across all application modules
- **Foundation**: Establishes baseline guidelines for color palettes, typography, spacing, and component specifications
- **Enforcement**: Contains anti-patterns and non-conformance rules that must be avoided
- **Modernization**: Incorporates latest component patterns and responsive design practices

**Master File Structure**
The master file organizes rules into logical categories:
- Identity and visual foundation
- Color palette and semantic tokens
- **Enhanced** Typography standards and font usage with comprehensive semantic text classes
- Component specifications and layout patterns
- Layout and spacing guidelines
- **Enhanced** Anti-patterns and prohibited practices with accessibility compliance
- **Enhanced** Responsive design guidelines and breakpoint management
- Pre-delivery checklist for quality assurance

### Page-Specific Override Layer
Individual module documentation files in the `design-system/zattaros/pages/` directory provide targeted overrides for specific application modules. These files follow a consistent pattern of documenting deviations from the master rules.

**Override Mechanism**
- **Selective Application**: Only deviations from MASTER.md are documented in page-specific files
- **Module Context**: Provides specialized guidance for specific business domains
- **Comprehensive Coverage**: Documents layout patterns, component usage, and domain-specific requirements
- **Audit Trail**: Maintains historical record of design decisions and rationale
- **Responsive Guidance**: Includes modern responsive design considerations

**Override Documentation Pattern**
Each page-specific file follows a standardized structure:
- Project metadata and generation timestamps
- Important override warnings and authority declarations
- Page-specific rules with clear deviations
- Component specifications for the module
- **Enhanced** Responsive design patterns and breakpoint considerations
- Recommendations and best practices
- Module-specific pre-delivery checklist

### Implementation Layer
The actual implementation layer consists of React components, TypeScript files, and design system utilities that developers use to build the application interface.

**Implementation Guidelines**
- **Escape Comments**: Strategic placement of design-system-escape comments throughout the codebase
- **Migration Tracking**: Systematic approach to transitioning from legacy classes to design system components
- **Quality Assurance**: Automated validation and manual review processes
- **Developer Experience**: Comprehensive tooling and documentation support
- **Responsive Utilities**: Integration of modern breakpoint management and responsive hooks

## Master Authority and Page-Specific Overrides

The design system implements a sophisticated override mechanism that allows for centralized governance while enabling module-specific adaptations, now enhanced with responsive design considerations.

### Master File Authority
The MASTER.md file establishes the foundational rules that govern the entire design system:

**Rule Hierarchy**
1. **Master Rules**: Primary guidelines established in MASTER.md
2. **Page Overrides**: Specific deviations documented in page-specific files
3. **Local Adaptations**: Module-specific implementations within individual components
4. **Responsive Guidelines**: Modern breakpoint management and responsive design patterns

**Authority Declaration**
The master file explicitly states its governance role:
> "Quando estiver construindo uma página específica, verifique primeiro `design-system/zattaros/pages/[page].md`. Se existir, suas regras **sobrescrevem** este Master."

### Page-Specific Override Process

**Documentation Structure**
Each page-specific file follows a consistent pattern:
- Project metadata and generation timestamps
- Important override warnings and authority declarations
- Page-specific rules with clear deviations from master
- Component specifications tailored to the module
- **Enhanced** Responsive design patterns and breakpoint considerations
- Recommendations and best practices
- Module-specific pre-delivery checklist

**Override Examples**
The audiências module demonstrates comprehensive override documentation with modern responsive considerations:
- **Shells and Composition**: Specific requirements for weekly view layout and component composition
- **Badge Categories**: Domain-specific semantic badge mappings for audiência status and modalities
- **Density and Layout**: Module-specific density requirements and layout patterns for weekly scheduling
- **Typography Specifications**: Specialized typography rules for legal domain
- **Responsive Patterns**: Modern breakpoint management and adaptive UI considerations
- **Anti-Patterns**: Module-specific design violations to avoid

**Override Validation**
The system includes mechanisms to validate override compliance:
- **Audit Reports**: Automated scanning for compliance with master rules
- **Override Tracking**: Documentation of all deviations from canonical rules
- **Module Conformance**: Verification that page-specific implementations meet requirements
- **Responsive Validation**: Ensuring modern breakpoint patterns are properly implemented

## Migration Strategy with Design System Escape Comments

The design system implements a systematic migration approach using design-system-escape comments to guide developers from raw Tailwind CSS classes to standardized components.

### Design System Escape Comment Implementation

Design-system-escape comments serve as migration guidance throughout the codebase:

```typescript
// Example of design-system-escape comment usage
<div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "container mx-auto px-6 py-4")}>
```

**Comment Structure**
- **Migration Guidance**: Direct developers to use semantic tokens instead of hardcoded values
- **Component Reference**: Point to appropriate component alternatives
- **Documentation Trail**: Create audit trails for migration progress
- **Team Communication**: Standardize communication about design system adoption

**Migration Categories**
The escape comments categorize migration needs:
- **Typography Migration**: `text-2xl → migrar para <Heading level="...">`
- **Layout Migration**: `px-6 padding direcional sem Inset equiv.` → Use container utilities
- **Component Migration**: `cursor-pointer on all clickable elements` → Use Button component
- **Spacing Migration**: `gap-3 gap sem token DS` → Use semantic spacing tokens
- **Responsive Migration**: `hidden md:block` → Use responsive hooks and breakpoint utilities

### Migration Tracking and Validation

**Automated Tracking**
- **Escape Comment Count**: Quantifying migration progress across the codebase
- **Legacy Class Detection**: Automated scanning for remaining raw Tailwind classes
- **Component Adoption Metrics**: Tracking usage of standardized components
- **Consistency Score**: Measuring adherence to design system guidelines

**Manual Validation**
- **Peer Code Review**: Review of migration progress and quality
- **Component Testing**: Validation of migrated components in different contexts
- **Accessibility Compliance**: Verification of accessible implementations
- **Performance Impact**: Assessment of migration effects on application performance

## Enhanced Typography System

The ZattarOS Design System features a comprehensive typography system with semantic text classes that provide precise control over typographic elements across the platform.

### Typography Architecture and Governance

**Semantic Typography Framework**
The system provides a structured approach to typography through semantic variants:
- **Typed Typography Components**: `<Heading>` and `<Text>` components with semantic variants
- **Design System Tokens**: Canonical CSS classes for typography (`text-kpi-value`, `text-meta-label`, etc.)
- **Responsive Typography**: Clamp-based scaling for optimal readability across devices
- **Accessibility-First**: WCAG AAA compliance with proper contrast ratios and readable sizes

**Typography Governance**
- **Canonical Specifications**: All typography follows master file specifications
- **Variant Control**: Limited typography variants to maintain consistency
- **Accessibility Standards**: All typography meets WCAG AAA requirements
- **Performance Optimization**: Efficient rendering through semantic class usage

### Typography Component Usage Patterns

**Heading Component**
```typescript
import { Heading } from '@/components/ui/typography';

// Usage examples
<Heading level="page">Main Page Title</Heading>
<Heading level="section">Section Title</Heading>
<Heading level="card">Card Title</Heading>
```

**Text Component**
```typescript
import { Text } from '@/components/ui/typography';

// Usage examples
<Text variant="kpi-value">24px bold value</Text>
<Text variant="meta-label">11px uppercase label</Text>
<Text variant="caption">13px auxiliary text</Text>
<Text variant="micro-badge">9px badge text</Text>
```

**Migration Path**
- **Legacy Typography**: Raw Tailwind classes and custom typography
- **Transition Typography**: Hybrid approaches during migration
- **Final Typography**: Fully standardized design system typography

## New Semantic Text Classes

The design system introduces comprehensive semantic text classes that replace raw Tailwind typography classes, providing better maintainability and accessibility.

### Text Class Hierarchy and Governance

**Canonical Typography Classes**
The system defines precise semantic classes for different text purposes:
- **KPI Values**: `text-kpi-value` (24px, bold, tabular-nums)
- **Meta Labels**: `text-meta-label` (11px, semibold, uppercase, tracking 0.14em)
- **Overline Labels**: `text-overline` (11px, semibold, uppercase, tracking 0.08em)
- **Caption Text**: `text-caption` (13px, muted-foreground)
- **Micro Badge Text**: `text-micro-badge` (9px, font-medium)
- **Mono Numbers**: `text-mono-num` (10px, font-mono, tabular-nums)
- **Micro Captions**: `text-micro-caption` (10px, tertiary timestamps)

**Class Governance**
- **Centralized Definition**: All classes defined in `src/app/globals.css`
- **Semantic Clarity**: Each class serves a specific design purpose
- **Accessibility Compliance**: All classes meet WCAG AAA standards
- **Responsive Behavior**: Proper scaling across device sizes

### Text Class Usage and Migration

**Migration Examples**
```typescript
// Before migration - raw Tailwind classes
<h1 className="text-2xl font-bold">Main Title</h1>
<p className="text-sm text-gray-500">Subtitle</p>
<span className="text-xs uppercase tracking-wider">Label</span>

// After migration - semantic text classes
<Heading level="page">Main Title</Heading>
<Text variant="caption">Subtitle</Text>
<Text variant="meta-label">Label</Text>
```

**Governance Benefits**
- **Consistency**: All text elements follow standardized visual patterns
- **Maintainability**: Centralized updates affect all text usage
- **Accessibility**: Consistent color contrast and semantic meaning
- **Performance**: Optimized rendering through semantic class usage

**Text Usage Patterns**
- **Domain-Specific**: Each module uses appropriate text classes
- **Consistent Styling**: All elements within a category share visual treatment
- **Semantic Clarity**: Text classes clearly communicate purpose and meaning
- **Responsive Design**: Text classes adapt to different screen sizes and contexts

## Accessibility Compliance Improvements

The design system now emphasizes comprehensive accessibility compliance with WCAG AAA standards, ensuring inclusive design for all users.

### Accessibility Architecture and Standards

**WCAG AAA Compliance Framework**
The system implements strict accessibility standards:
- **Contrast Ratios**: Minimum 7:1 for all text elements
- **Focus States**: Visible focus rings with 3-4px outline
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Proper ARIA attributes and semantic HTML
- **Motion Sensitivity**: Respect for `prefers-reduced-motion` preferences

**Accessibility Governance**
- **Compliance Standards**: All components meet WCAG AAA requirements
- **Testing Framework**: Automated accessibility validation
- **User Experience**: Inclusive design patterns for diverse users
- **Legal Compliance**: Meeting accessibility requirements for legal services

### Accessibility Implementation Patterns

**Focus Management**
```typescript
// Proper focus states
<button className="focus-visible:outline-2 focus-visible:outline-primary">
  Clickable Element
</button>

// Form accessibility
<input 
  aria-invalid={hasError}
  aria-describedby={`${fieldId}-error`}
/>
```

**Screen Reader Support**
```typescript
// Proper ARIA attributes
<button 
  aria-label="Delete item"
  aria-describedby="item-description"
>
  <TrashIcon />
</button>
```

**Motion Sensitivity**
```typescript
// Respect reduced motion preferences
<button className="motion-safe:animate-pulse">
  Animated Element
</button>
```

**Accessibility Validation**
- **Automated Testing**: Regular accessibility compliance checks
- **Manual Review**: Human validation of accessibility implementations
- **User Testing**: Real user testing with accessibility needs
- **Continuous Improvement**: Ongoing accessibility enhancements

## Component Library Integration

The ZattarOS Design System is built on shadcn/ui components, providing a comprehensive library of reusable UI elements with semantic badge architecture. The system has been modernized with unified radix-ui packages and enhanced responsive utilities.

### Component Categories and Governance

**Standard Component Library**
The system provides canonical components through shadcn/ui integration:
- **Form Elements**: Input fields, text areas, select components with validation states
- **Navigation Components**: Menus, breadcrumbs, pagination, tabs, accordions
- **Feedback Components**: Notifications, alerts, loading states, progress indicators
- **Layout Components**: Cards, grids, modals, dialogs, split panes
- **Interactive Components**: Tooltips, popovers, context menus with modernized APIs

**Component Governance**
- **Canonical Specifications**: All components follow master file specifications
- **Variation Control**: Limited component variations to maintain consistency
- **Accessibility Standards**: All components meet WCAG accessibility requirements
- **Performance Optimization**: Components designed for optimal performance
- **Modern API**: Unified radix-ui package integration with streamlined interfaces

### Component Usage Patterns and Migration

**Import Structure**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

**Variant System**
Components support multiple variants for different contexts:
- Default, secondary, outline, ghost, destructive variants
- Small, medium, large, icon sizes
- Custom styling through className prop with design system approval

**Migration Path**
- **Legacy Components**: Raw Tailwind classes and custom components
- **Transition Components**: Hybrid approaches during migration
- **Final Components**: Fully standardized design system components

## Enhanced Semantic Badge System

The semantic badge system provides consistent status communication across the platform through categorized variants with centralized governance. The system has been enhanced with a new CountBadge component for specialized count display functionality.

### Badge Category System and Governance

**Centralized Management**
The semantic badge system is governed centrally in the variants.ts file:
- **BadgeCategory Types**: Comprehensive enumeration of all badge categories
- **BadgeVisualVariant Types**: Standardized visual variants (default, secondary, success, etc.)
- **BadgeTone Control**: Tone selection (soft vs solid) based on category semantics
- **Centralized Mapping**: Single source of truth for all badge variant mappings

**Category Governance**
Badge categories are organized by domain and purpose:
- **Institutional Categories**: `tribunal`, `grau`, `status` (solid tone)
- **Status Categories**: `expediente_status`, `audiencia_status`, `captura_status` (soft tone)
- **Domain Categories**: `expediente_tipo`, `parte`, `polo` (category-specific)
- **Project Categories**: `project_status`, `task_status`, `priority` (soft tone)

### CountBadge Component

**New CountBadge Component**
The CountBadge component is a specialized badge designed specifically for displaying numeric counts in tabs, pills, and quantity indicators. It provides a consistent visual pattern for count displays across the application.

**Component Architecture**
```typescript
export function CountBadge({
  children,
  className,
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Badge>, 'variant' | 'tone'> & {
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <Badge
      variant="secondary"
      tone="soft"
      size={size}
      className={cn('tabular-nums', className)}
      {...props}
    >
      {children}
    </badge>
  );
}
```

**Design Philosophy**
- **Neutral Semantics**: Uses secondary soft tone to avoid domain-specific associations
- **Tabular Numbers**: Ensures consistent width for numeric displays
- **Size Flexibility**: Supports xs, sm, and md sizes for different contexts
- **Consistent Styling**: Provides uniform appearance across all count displays

**Usage Patterns**
- **Tab Counts**: Displaying item counts in navigation tabs
- **Pill Counts**: Showing quantities in pill-shaped indicators
- **Quantity Indicators**: Presenting numerical values in compact badges
- **Status Counts**: Displaying counts for filtered results

**Integration Examples**
```typescript
// Tab trigger with count badge
<TabsTrigger value="marcadas">
  Marcadas <CountBadge>{counts.marcadas}</CountBadge>
</TabsTrigger>

// Day tab with count badge
<CountBadge className={lowPrepCount > 0 ? 'bg-warning/15 text-warning' : undefined}>
  {dayAudiencias.length}
</CountBadge>
```

**Migration Benefits**
- **Consistency**: All count displays follow standardized visual patterns
- **Maintainability**: Centralized count display logic across the application
- **Accessibility**: Consistent color contrast and semantic meaning for counts
- **Performance**: Optimized rendering through specialized component design

### Badge Variant Mapping and Migration

**Centralized Mapping Functions**
The system provides centralized mapping functions:
```typescript
export function getSemanticBadgeVariant(
  category: BadgeCategory,
  key: string | number | null | undefined
): BadgeVisualVariant {
  // Implementation handles category-specific mapping
}
```

**Migration Benefits**
- **Consistency**: All badges follow standardized visual patterns
- **Maintainability**: Centralized updates affect all badge usage
- **Accessibility**: Consistent color contrast and semantic meaning
- **Performance**: Optimized rendering through centralized logic

**Badge Usage Patterns**
- **Domain-Specific**: Each module uses appropriate badge categories
- **Consistent Styling**: All badges within a category share visual treatment
- **Semantic Clarity**: Badge variants clearly communicate status and meaning
- **Responsive Design**: Badges adapt to different screen sizes and contexts

## Responsive Utilities and Breakpoint Management

The design system now features comprehensive responsive utility management with modern breakpoint handling and adaptive UI patterns.

### Modern Breakpoint Management

**Unified Breakpoint System**
The system provides a comprehensive breakpoint management system through the useBreakpoint hook family:
- **Flexible Breakpoints**: Support for xs, sm, md, lg, xl, 2xl breakpoints
- **Multiple Hook Variants**: Direct comparison, below, between, and convenience hooks
- **Type Safety**: Strongly typed breakpoint definitions
- **SSR Compatibility**: Server-side rendering safe implementations

**Breakpoint Hook Architecture**
```typescript
// Direct breakpoint comparison
const isDesktop = useBreakpoint('lg');

// Below breakpoint checking
const isMobile = useBreakpointBelow('md');

// Range checking
const isTablet = useBreakpointBetween('md', 'lg');

// Convenience hooks
const isSmallMobile = useBreakpointBelow('sm');
const isLargeDesktop = useBreakpoint('xl');
```

**Responsive Utility Hooks**
- **useIsMobile**: Simplified mobile detection (below md breakpoint)
- **useBreakpoints**: Comprehensive breakpoint state object
- **useViewport**: Advanced viewport state management
- **Custom Breakpoint Logic**: Flexible breakpoint comparison functions

### Modern Responsive Patterns

**Adaptive Component Design**
Components now support modern responsive patterns:
- **Conditional Rendering**: Based on breakpoint detection
- **Layout Adaptation**: Grid columns, spacing, and component sizing
- **Feature Detection**: Capability-based feature availability
- **Performance Optimization**: Efficient breakpoint change handling

**Responsive Component Examples**
```typescript
// Adaptive grid layout
const { columns, gridClasses } = useResponsiveLayout(participantCount);

// Conditional component rendering
{useIsMobile() ? <MobileView /> : <DesktopView />}

// Adaptive spacing
<div className={`p-${useIsMobile() ? '4' : '6'}`}>
  Content
</div>
```

**Breakpoint Governance**
- **Consistent Breakpoints**: Unified breakpoint definitions across the system
- **Responsive Patterns**: Standardized responsive design approaches
- **Performance Monitoring**: Efficient breakpoint change handling
- **Accessibility Considerations**: Responsive design with accessibility in mind

### Responsive Layout Management

**Advanced Layout Hooks**
The system provides sophisticated layout management through specialized hooks:
- **useResponsiveLayout**: Chat and video layout adaptation
- **useViewport**: Comprehensive viewport state management
- **Custom Responsive Logic**: Flexible layout adaptation patterns

**Layout Adaptation Patterns**
- **Column-Based Layouts**: Dynamic grid column adjustment
- **Sidebar Management**: Collapsible and adaptive sidebars
- **Control Sizing**: Adaptive component sizing based on screen size
- **Participant-Based Layouts**: Dynamic layouts based on user counts

**Layout Hook Implementation**
```typescript
export function useResponsiveLayout(participantCount: number) {
  const { width } = useViewport();
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    columns: 1,
    showSidebar: false,
    controlSize: "sm",
    gridClasses: "grid-cols-1",
  });

  useEffect(() => {
    // Responsive layout logic based on width and participant count
    // Returns optimized layout configuration
  }, [width, participantCount]);

  return layoutConfig;
}
```

**Layout Governance**
- **Performance Optimization**: Efficient layout calculations
- **State Management**: Clean separation of layout concerns
- **Extensibility**: Easy adaptation for new layout patterns
- **Testing Support**: Comprehensive testing utilities for responsive layouts

## Radix UI Modernization and Component Refactoring

The design system has undergone a comprehensive modernization effort migrating from individual @radix-ui/react-* packages to the unified radix-ui package, streamlining component APIs and improving maintainability.

### Unified Package Migration

**Package Migration Strategy**
The system has successfully migrated from individual radix packages to the unified radix-ui package:
- **Package Consolidation**: Single radix-ui package replacing @radix-ui/react-* packages
- **API Consistency**: Unified component APIs and patterns
- **Bundle Size Optimization**: Reduced bundle size through package consolidation
- **Maintenance Simplification**: Single package to track and update

**Migration Benefits**
- **Simplified Dependencies**: Fewer packages to manage and update
- **API Standardization**: Consistent component patterns across the system
- **Better Type Definitions**: Improved TypeScript support and IntelliSense
- **Future-Proof Architecture**: Unified package reduces fragmentation risks

### Component API Modernization

**Streamlined Component Interfaces**
Components now feature simplified and more intuitive APIs:
- **asChild Pattern**: Consistent composition pattern using asChild prop
- **Unified Trigger Components**: Standardized trigger and close component patterns
- **Simplified Props**: Reduced prop complexity while maintaining functionality
- **Better TypeScript Support**: Enhanced type safety and developer experience

**Modern Component Patterns**
```typescript
// Modern trigger pattern with asChild
<DialogTrigger asChild>
  <Button>Open Dialog</Button>
</DialogTrigger>

// Unified menu components
<DropdownMenuTrigger asChild>
  <Button>Menu</Button>
</DropdownMenuTrigger>
```

**API Governance**
- **Pattern Consistency**: Standardized component patterns across the system
- **Backward Compatibility**: Gradual migration approach preserving functionality
- **Developer Experience**: Improved DX through simplified APIs
- **Documentation Alignment**: Updated documentation reflecting modern APIs

### Enhanced Component Architecture

**Modern Component Design**
Components now feature enhanced architecture supporting modern patterns:
- **Composition Over Inheritance**: Better component composition patterns
- **Render Props Alternative**: asChild pattern replacing complex render props
- **Better Performance**: Optimized component rendering and updates
- **Enhanced Accessibility**: Improved accessibility through modern patterns

**Component Testing and Validation**
- **Comprehensive Testing**: Modern testing patterns for refactored components
- **Accessibility Validation**: Enhanced accessibility testing for modern components
- **Performance Monitoring**: Performance testing for optimized component architecture
- **Regression Prevention**: Automated testing to prevent component regressions

**Component Governance**
- **Modern Patterns**: Adoption of current best practices for component design
- **API Stability**: Stable APIs that minimize breaking changes
- **Developer Onboarding**: Easier onboarding with simplified component patterns
- **Long-term Maintainability**: Future-proof architecture supporting ongoing evolution

## Enhanced CSS Variables and Design Tokens

The design system now features enhanced CSS variable management and comprehensive design token governance, providing better consistency and maintainability.

### Comprehensive CSS Variable System

**Enhanced Variable Registry**
The system maintains a comprehensive registry of CSS variables supporting modern design patterns:
- **Chart Variables**: Soft chart colors for data visualization consistency
- **Glow Effects**: Consistent glow and highlight effects across components
- **Video Call Tokens**: Specialized tokens for video conferencing interfaces
- **Portal Tokens**: Dedicated tokens for client portal interfaces

**Variable Categories**
```typescript
// Chart soft colors for consistent data visualization
const CHART_SOFT_VARS = [
  '--chart-primary-soft',
  '--chart-destructive-soft',
  '--chart-warning-soft',
  '--chart-success-soft',
  '--chart-muted-soft',
];

// Glow effects for interactive elements
const GLOW_VARS = [
  '--glow-primary',
  '--glow-destructive',
  '--glow-warning',
];

// Video call specific tokens
const VIDEO_VARS = [
  '--video-bg',
  '--video-surface',
  '--video-surface-hover',
  '--video-border',
  '--video-muted',
  '--video-text',
  '--video-skeleton',
];
```

**Variable Governance**
- **Centralized Management**: Single source of truth for all CSS variables
- **Type Safety**: TypeScript support for CSS variable access
- **Consistency Enforcement**: Automated validation of variable usage
- **Performance Optimization**: Efficient variable resolution and caching

### Advanced Design Token System

**Token Registry and Management**
The system provides comprehensive token registry management:
- **Component-Level Tokens**: Tokens specific to individual components
- **Layered Architecture**: Reference, semantic, and component token layers
- **Theme Support**: Complete light and dark theme token management
- **Dynamic Updates**: Runtime token modification support

**Token Categories**
- **Color Tokens**: Semantic color mappings for consistent theming
- **Spacing Tokens**: Grid-based spacing system for consistent layouts
- **Typography Tokens**: Semantic typography scales for accessible text
- **Size Tokens**: Unified sizing system for consistent component dimensions

**Token Governance**
- **Hierarchical Structure**: DTCG v2025.10 compliant token architecture
- **Type Safety**: Strong typing for all token access patterns
- **Documentation**: Comprehensive token documentation and usage examples
- **Validation**: Automated validation of token usage and consistency

### Design Token Integration

**Modern Token Usage Patterns**
Tokens are now integrated throughout the system with modern patterns:
- **TypeScript Integration**: Strongly typed token access throughout the application
- **CSS Variable Resolution**: Efficient CSS variable resolution and caching
- **Theme Switching**: Seamless theme switching with token updates
- **Runtime Modification**: Dynamic token modification for advanced theming

**Token Performance Optimization**
- **Efficient Resolution**: Optimized token resolution for better performance
- **Caching Strategies**: Intelligent caching of token values and computed styles
- **Memory Management**: Efficient memory usage for large token registries
- **Bundle Optimization**: Minimal impact on bundle size through token optimization

**Token Governance**
- **Consistency Enforcement**: Automated enforcement of token usage patterns
- **Migration Support**: Tools and processes for migrating to new token systems
- **Performance Monitoring**: Continuous monitoring of token system performance
- **Future Planning**: Long-term planning for token system evolution

## Design System Playground

The design system playground provides an interactive environment for testing and validating component implementations with comprehensive migration guidance and modern responsive utilities.

### Playground Features and Migration Testing

**Interactive Component Testing**
The playground includes comprehensive testing capabilities:
- **Component State Testing**: Default, hover, disabled, loading states
- **Theme Switching**: Light and dark mode testing
- **Responsive Behavior**: Multi-breakpoint testing with modern utilities
- **Accessibility States**: Focus management and screen reader compatibility

**Migration Validation and Guidance**
- **Legacy Class Detection**: Automatic identification of remaining raw Tailwind classes
- **Component Replacement Suggestions**: Real-time recommendations for migration
- **Design Token Usage Validation**: Verification of semantic token adoption
- **Accessibility Compliance Checking**: Automated accessibility validation

**Real-Time Feedback and Migration Tracking**
- **Immediate Visual Feedback**: Component changes reflected instantly
- **Automated Validation**: Design system adherence verification
- **Migration Progress Tracking**: Quantifiable migration metrics
- **Responsive Testing**: Modern breakpoint and responsive utility validation

### Playground Implementation and Governance

**Component Organization and Testing**
- **Logical Grouping**: Components organized by category and function
- **Comprehensive State Coverage**: All component states and variants tested
- **Real-World Usage Scenarios**: Practical implementation examples
- **Edge Case Handling**: Robust testing of boundary conditions

**Testing Methodology and Quality Assurance**
- **Automated State Testing**: Systematic testing of component states
- **Manual Validation Workflows**: Human oversight for complex scenarios
- **Performance Benchmarking**: Load testing and optimization validation
- **Cross-Browser Compatibility**: Multi-browser and multi-device testing

**Typography Testing and Validation**
- **Semantic Text Classes**: Testing of new text classes (kpi-value, meta-label, etc.)
- **Accessibility Compliance**: Validation of WCAG AAA typography standards
- **Responsive Typography**: Testing across different screen sizes and breakpoints
- **Migration Guidance**: Real-time suggestions for typography migration

**CountBadge Testing and Validation**
- **Component State Testing**: Testing of CountBadge variants and sizes
- **Integration Scenarios**: Validating CountBadge usage in tabs and badges
- **Accessibility Compliance**: Ensuring CountBadge meets accessibility standards
- **Performance Optimization**: Testing CountBadge rendering performance

**Responsive Utilities Testing**
- **Breakpoint Hook Testing**: Comprehensive testing of useBreakpoint utilities
- **Mobile Detection**: Validation of useIsMobile and related responsive utilities
- **Layout Adaptation**: Testing responsive layout management patterns
- **Performance Monitoring**: Performance testing of responsive utility hooks

## Page-Specific Implementation Examples

### Audiências Module Deep Dive

The audiências module showcases comprehensive integration with the enhanced design system, featuring improved typography, semantic badge system, accessibility compliance, and modern responsive utilities.

**Weekly View Implementation and Governance**
The audiências module demonstrates advanced design system implementation with clear governance:
- **Page-Specific Rules**: Extensive documentation of module-specific requirements
- **Badge Category Governance**: Centralized badge category usage with domain-specific mappings
- **Layout Pattern Governance**: Strict adherence to module-specific density and layout requirements
- **Component Composition**: Clear guidelines for component hierarchy and relationships
- **Responsive Pattern Governance**: Modern breakpoint management and adaptive UI patterns

**Enhanced Typography Integration**
- **KPI Values**: Migration from raw classes to `text-kpi-value` semantic class
- **Meta Labels**: Implementation of `text-meta-label` for uppercase field labels
- **Overline Labels**: Usage of `text-overline` for section headers within cards
- **Caption Text**: Migration to `text-caption` for auxiliary information
- **Micro Badge Text**: Implementation of `text-micro-badge` for small status indicators

**CountBadge Integration and Usage**
The audiências module demonstrates comprehensive CountBadge integration with clear usage patterns and governance:

**Tab Count Implementation**
```typescript
<TabsTrigger value="todas">
  Todas
  <CountBadge>{counts.total}</CountBadge>
</TabsTrigger>
<TabsTrigger value={StatusAudiencia.Marcada}>
  Marcadas
  <CountBadge>{counts.marcadas}</CountBadge>
</TabsTrigger>
```

**Dynamic Count Styling**
```typescript
<CountBadge className={lowPrepCount > 0 ? 'bg-warning/15 text-warning' : undefined}>
  {dayAudiencias.length}
</CountBadge>
```

**CountBadge Governance**
- **Consistent Usage**: All count displays use CountBadge component
- **Size Standardization**: Appropriate size selection based on context
- **Styling Guidelines**: Dynamic styling for different count states
- **Accessibility Compliance**: Proper contrast and semantic meaning

**Responsive Utility Integration**
The module demonstrates modern responsive utility usage:
- **Mobile Detection**: Using useIsMobile for mobile-specific layouts
- **Breakpoint Management**: Implementing useBreakpoint for adaptive behavior
- **Layout Adaptation**: Responsive grid layouts and component arrangements
- **Performance Optimization**: Efficient responsive behavior without performance impact

**Component Composition and Migration**
- **Weekly View Layout**: Complex card component with migration guidance
- **Detail Panel Integration**: Component composition with migration tracking
- **Section Header Usage**: Governance of header components with semantic clarity
- **Inline Editing Capabilities**: Migration from raw components to standardized solutions

**Migration Examples and Validation**
The module shows practical migration from raw classes with comprehensive validation:
```typescript
// Before migration - raw Tailwind classes
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant="default">Urgente</Badge>
</div>

// After migration - semantic badge system
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant={getSemanticBadgeVariant('priority', 'urgent')}>
    Urgente
  </Badge>
</div>
```

**Typography Migration Examples**
```typescript
// Number formatting in cards
// Before: text-[10px] font-mono text-muted-foreground tabular-nums
// After: text-mono-num

// Section headers within cards
// Before: text-[11px] uppercase tracking-[0.14em] font-semibold
// After: text-meta-label

// Counter badges
// Before: text-[9px] font-medium
// After: text-micro-badge
```

**Responsive Migration Examples**
```typescript
// Before: hidden md:block
// After: {useIsMobile() ? null : <DesktopComponent />}

// Before: grid-cols-1 md:grid-cols-2
// After: {useIsMobile() ? 'grid-cols-1' : 'grid-cols-2'}

// Before: p-4
// After: {useIsMobile() ? 'p-4' : 'p-6'}
```

**Governance and Compliance**
- **Audit Results**: Comprehensive compliance reporting with automated scanning
- **Override Validation**: Verification that page-specific rules are properly implemented
- **Migration Tracking**: Quantifiable progress in design system adoption
- **Quality Assurance**: Multi-layered validation of implementation quality
- **Responsive Validation**: Ensuring modern breakpoint patterns are properly implemented

### Captura Module Implementation

The captura module demonstrates design system adoption with specialized documentation and clear governance patterns, now enhanced with modern responsive utilities.

**Dashboard Layout Migration and Governance**
The captura module shows systematic migration from raw Tailwind classes with clear governance:
- **Layout Override Documentation**: Explicit documentation of layout deviations from master
- **Component Specification Governance**: Clear component usage guidelines
- **Color Strategy Governance**: Centralized color strategy documentation
- **Effect Recommendations**: Governed recommendations for visual effects
- **Responsive Pattern Integration**: Modern breakpoint management and adaptive layouts

**Typography Integration and Migration**
- **Semantic Text Classes**: Integration with new typography system
- **Component Composition**: Governance of component relationships and usage
- **Migration Tracking**: Clear documentation of migration progress
- **Quality Assurance**: Validation of design system compliance
- **Responsive Typography**: Testing across different screen sizes and breakpoints

### Expedientes Module Implementation

**Typography Implementation and Migration**
- **KPI Values**: Migration from raw classes to `text-kpi-value` semantic class
- **Meta Labels**: Implementation of `text-meta-label` for uppercase field labels
- **Overline Labels**: Usage of `text-overline` for section headers within cards
- **Caption Text**: Migration to `text-caption` for auxiliary information
- **Micro Badge Text**: Implementation of `text-micro-badge` for small status indicators

**Component Composition and Migration**
- **QueueCard Implementation**: Complex card component with migration guidance
- **DetailPanel Integration**: Component composition with migration tracking
- **SectionHeader Usage**: Governance of header components with semantic clarity
- **Inline Editing Capabilities**: Migration from raw components to standardized solutions

**Responsive Utility Integration**
The module demonstrates modern responsive utility usage:
- **Mobile-First Design**: Using useIsMobile for mobile-specific optimizations
- **Breakpoint-Based Layouts**: Implementing useBreakpointBetween for tablet layouts
- **Adaptive Spacing**: Responsive spacing using modern breakpoint utilities
- **Performance Considerations**: Efficient responsive behavior implementation

**Migration Examples and Validation**
The module shows practical migration from raw classes with comprehensive validation:
```typescript
// Before migration - raw Tailwind classes
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant="default">Urgente</Badge>
</div>

// After migration - semantic badge system
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant={getSemanticBadgeVariant('priority', 'urgent')}>
    Urgente
  </Badge>
</div>
```

**Typography Migration Examples**
```typescript
// Number formatting in cards
// Before: text-[10px] font-mono text-muted-foreground tabular-nums
// After: text-mono-num

// Section headers within cards
// Before: text-[11px] uppercase tracking-[0.14em] font-semibold
// After: text-meta-label

// Counter badges
// Before: text-[9px] font-medium
// After: text-micro-badge
```

**Responsive Migration Examples**
```typescript
// Before: hidden lg:block
// After: {useIsMobile() ? null : <DesktopFeature />}

// Before: space-y-4
// After: {useIsMobile() ? 'space-y-2' : 'space-y-4'}
```

**Governance and Compliance**
- **Audit Results**: Comprehensive compliance reporting with automated scanning
- **Override Validation**: Verification that page-specific rules are properly implemented
- **Migration Tracking**: Quantifiable progress in design system adoption
- **Quality Assurance**: Multi-layered validation of implementation quality
- **Responsive Validation**: Ensuring modern breakpoint patterns are properly implemented

## Quality Assurance and Migration Tracking

The design system includes comprehensive quality assurance processes to ensure consistent implementation and track migration progress, now enhanced with modern responsive utility validation.

### Audit and Validation Systems

**Automated Scanning and Governance**
- **Legacy Class Detection**: Systematic scanning for remaining raw Tailwind classes
- **Component Usage Validation**: Verification of standardized component adoption
- **Design Token Compliance Checking**: Validation of semantic token usage
- **Accessibility Compliance Verification**: Automated accessibility validation
- **Responsive Utility Validation**: Testing of modern breakpoint and responsive utilities

**Manual Review Processes and Governance**
- **Peer Code Review**: Structured review process for design system adherence
- **User Experience Validation**: Human validation of design system implementations
- **Performance Impact Assessment**: Evaluation of migration effects on application performance
- **Cross-Platform Compatibility Testing**: Multi-environment validation
- **Responsive Pattern Review**: Validation of modern breakpoint usage

### Migration Metrics and Governance

**Progress Tracking and Measurement**
- **Percentage of Components Migrated**: Quantifiable migration progress
- **Reduction in Legacy CSS Classes**: Measurable improvement in code quality
- **Increase in Semantic Badge Usage**: Evidence of design system adoption
- **Improvement in Accessibility Scores**: Quantified accessibility improvements
- **Responsive Utility Adoption**: Tracking of modern breakpoint usage

**Quality Indicators and Governance**
- **Consistency in Component Usage**: Measurement of design system adherence
- **Reduction in Design Debt**: Quantified improvement in codebase quality
- **Improved Maintainability Scores**: Evidence of better code organization
- **Enhanced User Experience Metrics**: Measurable UX improvements
- **Responsive Pattern Consistency**: Validation of modern breakpoint usage

**Typography Migration Metrics**
- **Semantic Text Class Adoption**: Tracking of new text class usage
- **Typography Anti-Pattern Elimination**: Reduction in raw typography classes
- **Accessibility Compliance Improvement**: Measured accessibility enhancements
- **Migration Progress Visualization**: Clear metrics for typography migration

**CountBadge Migration Metrics**
- **CountBadge Component Adoption**: Tracking of CountBadge usage across modules
- **Count Display Standardization**: Evidence of consistent count presentation
- **Badge System Enhancement**: Improved semantic badge architecture
- **Developer Productivity**: Measured improvement in count display implementation

**Responsive Utility Metrics**
- **useIsMobile Adoption**: Tracking of mobile detection usage
- **useBreakpoint Usage**: Validation of modern breakpoint utilities
- **Responsive Pattern Consistency**: Measuring adoption of modern responsive patterns
- **Performance Impact**: Measuring performance effects of responsive utilities

## Integration and Maintenance

The design system architecture supports scalable maintenance and evolution through centralized governance, modern responsive utilities, and comprehensive component refactoring.

### Documentation Workflow and Governance

**Master File Updates and Governance**
- **Centralized Rule Management**: Single source of truth for design system evolution
- **Version Control for Design Evolution**: Historical tracking of design system changes
- **Backward Compatibility Considerations**: Governance of breaking change management
- **Migration Guides for Breaking Changes**: Clear guidance for system evolution
- **Responsive Pattern Documentation**: Updated documentation for modern breakpoint usage

**Page-Specific Documentation and Governance**
- **Specialized Knowledge Capture**: Module-specific documentation with clear governance
- **Context-Specific Implementation Guidance**: Tailored guidance for different modules
- **Quick Reference Material**: Governed documentation for developer onboarding
- **Onboarding Material**: Structured training materials with quality assurance
- **Responsive Pattern Integration**: Documentation of modern breakpoint usage

### Development Process Integration and Governance

**Design-to-Development Handoff and Governance**
- **Clear Component Specifications**: Governed component documentation and usage
- **Consistent Naming Conventions**: Standardized naming with quality control
- **Standardized Implementation Patterns**: Governed development practices
- **Automated Validation Checks**: Quality gates for code delivery
- **Responsive Utility Integration**: Modern breakpoint management in development workflow

**Quality Assurance Pipeline and Governance**
- **Pre-Delivery Checklists**: Governed quality assurance processes
- **Automated Accessibility Testing**: Quality gates for accessibility compliance
- **Visual Regression Detection**: Automated visual quality assurance
- **Performance Monitoring**: Continuous performance validation
- **Responsive Utility Testing**: Automated testing of modern breakpoint utilities

**Maintenance Strategies and Governance**
- **Regular Design System Audits**: Systematic quality assessment
- **Component Usage Analytics**: Data-driven maintenance decisions
- **Developer Feedback Integration**: Governed feedback incorporation
- **Continuous Improvement Processes**: Structured evolution of design system
- **Responsive Utility Monitoring**: Ongoing validation of modern breakpoint patterns

**Typography Maintenance and Governance**
- **Semantic Text Class Updates**: Centralized typography token management
- **Accessibility Compliance Monitoring**: Ongoing accessibility validation
- **Migration Progress Tracking**: Quantified typography adoption metrics
- **Developer Education**: Training on new typography system
- **Responsive Typography Validation**: Testing across different screen sizes

**CountBadge Maintenance and Governance**
- **Component Usage Analytics**: Tracking CountBadge adoption across modules
- **Performance Monitoring**: Ensuring efficient CountBadge rendering
- **Accessibility Compliance**: Regular validation of CountBadge accessibility
- **Developer Education**: Training on CountBadge usage patterns and best practices
- **Responsive Integration**: Ensuring CountBadge works with modern breakpoint utilities

**Responsive Utility Maintenance and Governance**
- **Breakpoint Utility Usage Analytics**: Tracking modern breakpoint adoption
- **Performance Monitoring**: Ensuring efficient responsive utility usage
- **Accessibility Compliance**: Validating responsive utilities with accessibility standards
- **Developer Education**: Training on modern breakpoint patterns and best practices
- **Migration Support**: Assisting teams in adopting modern responsive utilities

## Conclusion

The ZattarOS Design System represents a comprehensive approach to design system governance that balances centralized authority with module-specific flexibility. Through the implementation of MASTER.md as the central authority, systematic page-specific override mechanisms, and design-system-escape comments, the system provides a robust foundation for maintaining design integrity while accommodating the unique requirements of different application modules.

**Updated** The system now features major typography improvements with new semantic text classes, enhanced accessibility compliance with WCAG AAA standards, comprehensive anti-pattern prevention measures, and a new CountBadge component for consistent count display across tabs and badges. The introduction of CountBadge provides specialized functionality for numeric count displays, enhancing the semantic badge system with dedicated component architecture.

The comprehensive modernization effort has successfully migrated the component library to the unified radix-ui package, streamlining component APIs and improving maintainability. The enhanced responsive utility system provides developers with powerful tools for adaptive UI development, while the expanded CSS variable and design token system ensures better consistency and maintainability across the platform.

The hierarchical architecture ensures that all modules follow consistent design principles while allowing for targeted adaptations through documented overrides. The comprehensive audit and validation processes guarantee high-quality implementations across all modules, while the playground environment facilitates testing and validation of design system implementations.

The integration with shadcn/ui components ensures scalability and maintainability, while the centralized badge system and component governance provide consistent visual language across the platform. The systematic migration approach with design-system-escape comments guides developers through the transition from raw Tailwind classes to standardized components, creating a sustainable development workflow.

Through this modernized architecture, the design system supports both current development needs and future evolution, providing a solid foundation for the continued growth of the ZattarOS platform. The emphasis on trust, authority, and accessibility creates a professional foundation suitable for legal services, while the comprehensive anti-pattern prevention and quality assurance processes ensure high-quality implementations across all modules.

The governance model established through MASTER.md and page-specific overrides ensures that design decisions are well-documented, consistently applied, and easily maintained over time. This approach enables the design system to evolve with the platform's needs while maintaining the consistency and quality that developers and users expect.

The enhanced typography system with semantic text classes, comprehensive accessibility compliance, systematic migration guidance, and the new CountBadge component position the ZattarOS Design System as a leader in accessible, maintainable, and scalable design systems for legal technology applications. The CountBadge component specifically addresses the need for consistent count display across tabs, badges, and quantity indicators, providing developers with a reliable, accessible solution for numeric count presentation.

The audiências module integration demonstrates the practical benefits of these enhancements, with improved semantic badge usage, better heading semantics for accessibility, streamlined count display patterns, and modern responsive utility integration that enhances both developer productivity and user experience. This comprehensive approach to design system evolution ensures that the ZattarOS platform maintains its competitive edge in legal technology while providing a solid foundation for future innovations.

The modernized component architecture with unified radix-ui packages, enhanced responsive utilities, and comprehensive design token management positions the ZattarOS Design System for continued success in supporting the platform's growth and evolution. The systematic approach to component refactoring, responsive utility integration, and design token management ensures that the system remains maintainable, accessible, and aligned with current best practices in design system development.