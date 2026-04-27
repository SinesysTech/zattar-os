# Design System

<cite>
**Referenced Files in This Document**
- [MASTER.md](file://design-system/zattaros/MASTER.md)
- [captura.md](file://design-system/zattaros/pages/captura.md)
- [expedientes.md](file://design-system/zattaros/pages/expedientes.md)
- [page-client.tsx](file://src/app/(authenticated)/ajuda/design-system/playground/page-client.tsx)
- [variants.ts](file://src/lib/design-system/variants.ts)
- [expedientes-control-view.tsx](file://src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx)
- [colors-section.tsx](file://src/app/(authenticated)/design-system/_components/colors-section.tsx)
- [spacing-section.tsx](file://src/app/(authenticated)/design-system/_components/spacing-section.tsx)
- [globals.css](file://src/app/globals.css)
- [page.tsx](file://src/app/(ajuda)/ajuda/design-system/componentes/page.tsx)
</cite>

## Update Summary
**Changes Made**
- Updated to reflect comprehensive design system adoption with migration from raw Tailwind CSS classes to ZattarOS Design System components
- Added documentation for design-system-escape comments implementation for systematic migration guidance
- Enhanced coverage of semantic badge system and component architecture
- Updated component specifications to reflect shadcn/ui integration
- Expanded design system playground documentation with migration examples

## Table of Contents
1. [Introduction](#introduction)
2. [Design System Architecture](#design-system-architecture)
3. [Migration Strategy with Design System Escape Comments](#migration-strategy-with-design-system-escape-comments)
4. [Component Library Integration](#component-library-integration)
5. [Semantic Badge System](#semantic-badge-system)
6. [Design System Playground](#design-system-playground)
7. [Page-Specific Implementation Examples](#page-specific-implementation-examples)
8. [Quality Assurance and Migration Tracking](#quality-assurance-and-migration-tracking)
9. [Integration and Maintenance](#integration-and-maintenance)
10. [Conclusion](#conclusion)

## Introduction
The ZattarOS Design System represents a comprehensive visual and interaction framework built on shadcn/ui components with semantic badge architecture. This system has evolved to provide systematic migration guidance through design-system-escape comments while maintaining design consistency across the legal management platform.

The design system now operates on a hierarchical structure where the MASTER.md file provides foundational rules, page-specific documentation files override or supplement these rules when they exist, and design-system-escape comments guide developers through the migration process from raw Tailwind CSS classes to standardized components.

## Design System Architecture
The ZattarOS Design System is built on a three-tier architecture that ensures consistency while enabling systematic migration.

### Master File Architecture
The MASTER.md file serves as the central authority for design system rules, containing 205 lines of essential guidelines that establish the foundation for all page implementations.

**Global Rules Framework**
The master file establishes fundamental design principles through structured categories:

**Color Palette System**
- Primary brand colors with semantic roles (Primary, Secondary, CTA/Accent)
- Background and text color specifications
- CSS variable declarations for consistent theming
- Color notes explaining design philosophy

**Typography Foundation**
- Heading and body font specifications
- Mood and personality guidelines for legal services
- Google Fonts integration requirements
- CSS import instructions for font loading

**Spacing and Layout Standards**
- Comprehensive spacing token definitions (xs to 3xl)
- Usage guidelines for different contexts
- Responsive breakpoint considerations

**Shadow System**
- Depth-based shadow specifications
- Usage patterns for different UI elements
- Performance considerations for visual effects

### Component Specification Library
The master file provides canonical component specifications that serve as the reference for all UI elements:

**Button System**
- Primary and secondary button variations
- Hover states and interaction patterns
- Accessibility considerations
- Transition timing and easing

**Card Components**
- Card styling and elevation patterns
- Hover effects and depth transitions
- Interactive state management

**Form Elements**
- Input field styling and focus states
- Validation and error handling patterns
- Consistent spacing and alignment

**Modal System**
- Overlay styling and backdrop effects
- Modal positioning and sizing constraints
- Responsive behavior patterns

## Migration Strategy with Design System Escape Comments
The design system implements a systematic migration approach using design-system-escape comments to guide developers from raw Tailwind CSS classes to standardized components.

### Design System Escape Comment Implementation
Design-system-escape comments are strategically placed throughout the codebase to provide migration guidance:

```typescript
// Example of design-system-escape comment usage
<div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "container mx-auto px-6 py-4")}>
```

These comments serve multiple purposes:
- **Migration Guidance**: Direct developers to use semantic tokens instead of hardcoded values
- **Component Reference**: Point to appropriate component alternatives
- **Documentation Trail**: Create audit trails for migration progress
- **Team Communication**: Standardize communication about design system adoption

### Migration Categories
The escape comments categorize migration needs:

**Typography Migration**
- `text-2xl → migrar para <Heading level="...">`
- `font-bold → className de <Text>/<Heading>`
- `text-sm → migrar para <Text variant="body-sm">`

**Layout Migration**
- `px-6 padding direcional sem Inset equiv.` → Use container utilities
- `gap-3 gap sem token DS` → Use semantic spacing tokens
- `space-y-8 → migrar para <Stack gap="section">` → Use Stack component

**Component Migration**
- `cursor-pointer on all clickable elements` → Use Button component
- `font-medium → className de <Text>/<Heading>` → Use Text component

### Migration Tracking
The design system tracks migration progress through:
- **Audit Reports**: Automated scanning for legacy classes
- **Escape Comment Count**: Quantifying migration progress
- **Component Adoption Metrics**: Tracking shadcn/ui usage
- **Consistency Score**: Measuring design system adherence

## Component Library Integration
The ZattarOS Design System is built on shadcn/ui components, providing a comprehensive library of reusable UI elements.

### Component Categories
The component library includes several categories:

**Form Elements**
- Input fields with validation states
- Text areas and select components
- Checkbox and radio button groups
- DatePicker and time pickers

**Navigation Components**
- Navigation menus and breadcrumbs
- Pagination controls
- Tab systems and accordions
- Sidebar navigation

**Feedback Components**
- Toast notifications and alerts
- Loading spinners and skeletons
- Progress indicators
- Empty state illustrations

**Layout Components**
- Cards with various styles
- Grid systems and responsive layouts
- Modals and dialogs
- Split panes and resizable layouts

### Component Usage Patterns
Components follow consistent usage patterns:

**Import Structure**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

**Variant System**
Components support multiple variants for different contexts:
- Default, secondary, outline, ghost, destructive
- Small, medium, large, icon sizes
- Custom styling through className prop

**Accessibility Features**
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## Semantic Badge System
The semantic badge system provides consistent status communication across the platform through categorized variants.

### Badge Category System
The system defines multiple badge categories for different domains:

**Process-related Badges**
- `expediente_status`: Pending, Downloaded, Overdue
- `status`: Active, Archived, Finalized
- `priority`: Low, Medium, High, Urgent

**Institutional Badges**
- `tribunal`: TRT1-24, TST, STJ, STF
- `grau`: First Instance, Second Instance, Higher Court
- `parte`: Plaintiff, Defendant, Third Party

**Domain-specific Badges**
- `audiencia_status`: Scheduled, Completed, Cancelled
- `captura_status`: Pending, In Progress, Completed
- `expediente_tipo`: Various types with color-coded variants

### Badge Variant Mapping
Each category maps to specific visual variants:

```typescript
export function getSemanticBadgeVariant(
  category: BadgeCategory,
  key: string | number | null | undefined
): BadgeVisualVariant {
  // Implementation handles category-specific mapping
}
```

**Tone Selection**
- Soft tone for status and type categories
- Solid tone for institutional and identity categories

**Color Consistency**
- TRT1-24 use alternating color schemes
- Status badges use semantic color meanings
- Institutional badges use neutral tones

## Design System Playground
The design system playground provides an interactive environment for testing and validating component implementations.

### Playground Features
The playground includes comprehensive testing capabilities:

**Component State Testing**
- Default, hover, disabled, loading states
- Theme switching between light and dark modes
- Responsive behavior testing
- Accessibility state verification

**Migration Validation**
- Legacy class detection and replacement suggestions
- Component replacement recommendations
- Design token usage validation
- Accessibility compliance checking

**Real-time Feedback**
- Immediate visual feedback for component changes
- Automated validation of design system adherence
- Migration progress tracking
- Error detection and correction suggestions

### Playground Implementation
The playground demonstrates best practices:

**Component Organization**
- Logical grouping by component type
- Comprehensive state coverage
- Real-world usage scenarios
- Edge case handling

**Testing Methodology**
- Automated state testing
- Manual validation workflows
- Performance benchmarking
- Cross-browser compatibility testing

## Page-Specific Implementation Examples

### Expedientes Module Deep Dive
The expedientes module showcases complex operational dashboard patterns with detailed implementation guidance.

**Mission Control Pattern**
The expedientes module demonstrates advanced design system implementation:

```typescript
// Example of semantic badge usage
<SemanticBadge 
  category="expediente_status" 
  key={expediente.status}
  variant={getSemanticBadgeVariant('expediente_status', expediente.status)}
/>
```

**Component Composition**
- QueueCard for urgent case management
- DetailPanel for contextual information
- SectionHeader for grouping
- Inline editing capabilities

**Migration Examples**
The module shows practical migration from raw classes:

```typescript
// Before migration
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant="default">Urgente</Badge>
</div>

// After migration  
<div className="flex items-center gap-3">
  <Badge variant="outline">23 Processos</Badge>
  <Badge variant={getSemanticBadgeVariant('priority', 'urgent')}>
    Urgente
  </Badge>
</div>
```

### Captura Module Implementation
The capture system demonstrates design system adoption with specialized documentation.

**Dashboard Layout Migration**
The captura module shows systematic migration from raw Tailwind classes:

```typescript
// Legacy approach
<div className="container mx-auto px-6 py-4">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Captura</h1>
  </div>
</div>

// Design system approach
<div className="container mx-auto">
  <div className="flex items-center justify-between py-4">
    <Heading level="h1">Captura</Heading>
  </div>
</div>
```

**Component Integration**
- SemanticBadge for status indicators
- Button variants for actions
- Card components for information display
- Input components for data entry

## Quality Assurance and Migration Tracking
The design system includes comprehensive quality assurance processes to ensure consistent implementation.

### Audit and Validation
**Automated Scanning**
- Legacy class detection in CSS files
- Component usage validation
- Design token compliance checking
- Accessibility compliance verification

**Manual Review Processes**
- Peer code review for design system adherence
- User experience validation
- Performance impact assessment
- Cross-platform compatibility testing

### Migration Metrics
**Progress Tracking**
- Percentage of components migrated
- Reduction in legacy CSS classes
- Increase in semantic badge usage
- Improvement in accessibility scores

**Quality Indicators**
- Consistency in component usage
- Reduction in design debt
- Improved maintainability scores
- Enhanced user experience metrics

## Integration and Maintenance
The design system architecture supports scalable maintenance and evolution.

### Documentation Workflow
**Master File Updates**
- Centralized rule management in MASTER.md
- Version control for design system evolution
- Backward compatibility considerations
- Migration guides for breaking changes

**Page-Specific Documentation**
- Specialized knowledge capture per module
- Context-specific implementation guidance
- Quick reference for developers
- Onboarding material for new team members

### Development Process Integration
**Design-to-Development Handoff**
- Clear component specifications
- Consistent naming conventions
- Standardized implementation patterns
- Automated validation checks

**Quality Assurance Pipeline**
- Pre-delivery checklists
- Automated accessibility testing
- Visual regression detection
- Performance monitoring

**Maintenance Strategies**
- Regular design system audits
- Component usage analytics
- Developer feedback integration
- Continuous improvement processes

## Conclusion
The ZattarOS Design System represents a comprehensive approach to design system adoption that balances consistency with practical migration strategies. Through the implementation of design-system-escape comments, systematic migration guidance, and semantic badge architecture, the system provides a robust foundation for maintaining design integrity while accommodating the unique requirements of different application modules.

The integration with shadcn/ui components ensures scalability and maintainability, while the playground environment facilitates testing and validation of design system implementations. The comprehensive audit and validation processes guarantee high-quality implementations across all modules.

By focusing on essential guidelines in the master file and delegating specialized knowledge to dedicated page documentation, the system achieves optimal balance between standardization and flexibility. This approach ensures that developers have access to comprehensive implementation guidance while maintaining the ability to adapt designs for specific use cases.

The system's emphasis on trust, authority, and accessibility creates a professional foundation suitable for legal services, while the comprehensive anti-pattern prevention and quality assurance processes ensure high-quality implementations across all modules. Through this architecture, the design system supports both current development needs and future evolution, providing a solid foundation for the continued growth of the ZattarOS platform.