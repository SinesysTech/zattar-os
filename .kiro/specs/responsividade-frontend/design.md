# Design Document - Responsividade Frontend Completa

## Overview

Este documento descreve o design para implementação de responsividade completa no frontend da aplicação Sinesys. O sistema utiliza Next.js 16, React 19, Tailwind CSS 4, e componentes Radix UI/shadcn/ui. A implementação seguirá uma abordagem mobile-first, garantindo que todos os componentes e páginas funcionem perfeitamente em dispositivos móveis (smartphones a partir de 320px), tablets (768px-1024px) e desktops (1024px+).

A análise inicial identificou que:
- Alguns componentes já possuem responsividade parcial (breadcrumb, sidebar, alguns formulários)
- Muitos componentes carecem de otimizações para mobile
- Tabelas e grids precisam de adaptações significativas
- O sistema já possui breakpoints do Tailwind CSS configurados
- Existe um hook `useIsMobile` disponível para detecção de dispositivos

## Architecture

### Breakpoint Strategy

O sistema utilizará os breakpoints padrão do Tailwind CSS 4:
- **xs**: < 640px (smartphones)
- **sm**: 640px (smartphones grandes)
- **md**: 768px (tablets)
- **lg**: 1024px (desktops pequenos)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (desktops grandes)

### Mobile-First Approach

Todos os componentes serão desenvolvidos seguindo a abordagem mobile-first:
1. Estilos base para mobile (sem prefixo)
2. Adaptações progressivas para telas maiores (com prefixos sm:, md:, lg:, etc)
3. Otimizações específicas para touch devices

### Component Hierarchy

```
Layout Responsivo
├── Navigation Layer
│   ├── Sidebar (collapsible/drawer)
│   ├── Breadcrumb (truncated)
│   └── Mobile Menu
├── Content Layer
│   ├── Grids (1→2→3→4 columns)
│   ├── Tables (scroll/cards)
│   ├── Forms (stacked→columns)
│   └── Cards (full→grid)
├── Interaction Layer
│   ├── Dialogs (full-screen→modal)
│   ├── Dropdowns (bottom-sheet→popover)
│   └── Tooltips (touch-optimized)
└── Media Layer
    ├── Images (responsive/lazy)
    ├── Videos (aspect-ratio)
    └── Charts (scaled)
```

## Components and Interfaces

### 1. Responsive Sidebar

**Desktop (≥768px)**:
- Fixed sidebar with collapsible icon mode
- Width: 14rem (expanded), 3rem (collapsed)
- Smooth transitions between states

**Mobile (<768px)**:
- Sheet/Drawer component
- Full overlay when open
- Swipe-to-close gesture support
- Auto-close on navigation

**Interface**:
```typescript
interface ResponsiveSidebarProps {
  defaultOpen?: boolean
  collapsible?: 'icon' | 'offcanvas' | 'none'
  variant?: 'sidebar' | 'floating' | 'inset'
}
```

### 2. Responsive Tables

**Desktop (≥1024px)**:
- Full table layout with all columns
- Fixed header on scroll
- Inline actions

**Tablet (768px-1024px)**:
- Horizontal scroll for overflow columns
- Sticky first column
- Grouped actions in dropdown

**Mobile (<768px)**:
- Card-based layout
- Essential info prominent
- Expandable details
- Swipe actions

**Interface**:
```typescript
interface ResponsiveTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  mobileLayout?: 'cards' | 'scroll'
  stickyColumn?: boolean
  mobileVisibleColumns?: string[]
}
```

### 3. Responsive Forms

**Desktop (≥1024px)**:
- Multi-column layouts (2-3 columns)
- Inline labels
- Side-by-side buttons

**Tablet (768px-1024px)**:
- 2-column maximum
- Responsive field widths
- Stacked buttons on narrow

**Mobile (<768px)**:
- Single column stack
- Full-width fields
- Touch-optimized inputs (min 44px)
- Floating labels
- Full-width buttons

**Interface**:
```typescript
interface ResponsiveFormFieldProps {
  gridColumns?: 1 | 2 | 3
  mobileFullWidth?: boolean
  touchOptimized?: boolean
}
```

### 4. Responsive Grids

**Breakpoint-based columns**:
- xs: 1 column
- sm: 2 columns
- md: 3 columns
- lg: 4 columns
- xl: 4-6 columns (content-dependent)

**Interface**:
```typescript
interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}
```

### 5. Responsive Dialogs

**Desktop (≥640px)**:
- Centered modal
- Max-width constraints
- Backdrop blur

**Mobile (<640px)**:
- Full-screen or near full-screen
- Bottom sheet for simple actions
- Slide-up animation
- Prevent background scroll

**Interface**:
```typescript
interface ResponsiveDialogProps {
  mobileVariant?: 'fullscreen' | 'bottom-sheet' | 'modal'
  preventBackgroundScroll?: boolean
}
```

### 6. Responsive Navigation

**Breadcrumb**:
- Desktop: Full path
- Tablet: Truncated with ellipsis
- Mobile: Current + parent only

**Interface**:
```typescript
interface ResponsiveBreadcrumbProps {
  maxItems?: number
  mobileMaxItems?: number
  showHome?: boolean
}
```

### 7. Touch-Optimized Components

**Minimum touch targets**: 44x44px
**Components affected**:
- Buttons
- Links
- Checkboxes
- Radio buttons
- Select options
- Date picker cells

**Interface**:
```typescript
interface TouchOptimizedProps {
  minTouchTarget?: number // default: 44
  increasedPadding?: boolean
}
```

## Data Models

### Viewport Detection

```typescript
interface ViewportState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}
```

### Responsive Configuration

```typescript
interface ResponsiveConfig {
  breakpoints: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    '2xl': number
  }
  touchTargetSize: number
  mobileMenuThreshold: number
  tableScrollThreshold: number
}
```

### Component Responsive State

```typescript
interface ComponentResponsiveState {
  layout: 'mobile' | 'tablet' | 'desktop'
  columns: number
  showFullContent: boolean
  useCompactMode: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Sidebar drawer on mobile
*For any* viewport width less than 768px, the sidebar should render as a Sheet/Drawer component
**Validates: Requirements 1.1**

### Property 2: Sidebar overlay closes drawer
*For any* open sidebar drawer on mobile, clicking the overlay should close the drawer
**Validates: Requirements 1.3**

### Property 3: Collapsed sidebar shows icons
*For any* collapsed sidebar on desktop, only icons with tooltips should be visible
**Validates: Requirements 1.4**

### Property 4: Navigation closes mobile sidebar
*For any* navigation event on mobile with open sidebar, the sidebar should automatically close
**Validates: Requirements 1.5**

### Property 5: Table horizontal scroll on mobile
*For any* table displayed at viewport width less than 768px, horizontal scrolling should be enabled
**Validates: Requirements 2.1**

### Property 6: Table column prioritization
*For any* table with many columns on mobile, essential columns should be visible without scrolling
**Validates: Requirements 2.2**

### Property 7: Sticky first column
*For any* table with primary identifiers in first column on mobile, the first column should remain fixed during horizontal scroll
**Validates: Requirements 2.3**

### Property 8: Table full display on desktop
*For any* table displayed at viewport width ≥768px with sufficient space, all columns should be visible without horizontal scroll
**Validates: Requirements 2.4**

### Property 9: Mobile table actions grouped
*For any* table actions displayed on mobile, they should be grouped in a dropdown menu or action sheet
**Validates: Requirements 2.5**

### Property 10: Form fields stacked on mobile
*For any* form displayed at viewport width less than 640px, all form fields should be stacked vertically
**Validates: Requirements 3.1**

### Property 11: Touch target minimum size
*For any* form field displayed on mobile, the touch target should be at least 44x44 pixels
**Validates: Requirements 3.3**

### Property 12: Tablet form columns
*For any* multi-column form displayed at viewport width 768px-1024px, the layout should have maximum 2 columns
**Validates: Requirements 3.4**

### Property 13: Mobile form buttons layout
*For any* form buttons displayed on mobile, they should be stacked vertically or full-width
**Validates: Requirements 3.5**

### Property 14: Grid single column on mobile
*For any* grid layout displayed at viewport width less than 640px, items should be displayed in a single column
**Validates: Requirements 4.1**

### Property 15: Grid two columns on small screens
*For any* grid layout displayed at viewport width 640px-768px, items should be displayed in 2 columns
**Validates: Requirements 4.2**

### Property 16: Grid three columns on tablet
*For any* grid layout displayed at viewport width 768px-1024px, items should be displayed in 3 columns
**Validates: Requirements 4.3**

### Property 17: Grid four+ columns on desktop
*For any* grid layout displayed at viewport width greater than 1024px, items should be displayed in 4 or more columns
**Validates: Requirements 4.4**

### Property 18: Card images scale proportionally
*For any* card containing images on mobile, images should scale proportionally to fit container width
**Validates: Requirements 4.5**

### Property 19: Dialog full-screen on mobile
*For any* dialog opened at viewport width less than 640px, it should display as full-screen or near full-screen
**Validates: Requirements 5.1**

### Property 20: Dialog form no horizontal scroll
*For any* dialog containing a form on mobile, all fields should be accessible without horizontal scroll
**Validates: Requirements 5.2**

### Property 21: Dialog buttons at bottom
*For any* dialog with action buttons on mobile, buttons should be positioned at the bottom with adequate spacing
**Validates: Requirements 5.3**

### Property 22: Dialog vertical scroll
*For any* dialog with content exceeding viewport height on mobile, vertical scrolling should be enabled within the dialog
**Validates: Requirements 5.4**

### Property 23: Dialog prevents background scroll
*For any* open dialog on mobile, background scrolling should be prevented
**Validates: Requirements 5.5**

### Property 24: Breadcrumb truncation on mobile
*For any* breadcrumb displayed at viewport width less than 768px, only current page and one parent level should be shown
**Validates: Requirements 6.1**

### Property 25: Breadcrumb collapse menu
*For any* breadcrumb with more than 2 levels on mobile, a collapsed menu should provide access to all levels
**Validates: Requirements 6.2**

### Property 26: Breadcrumb full path on desktop
*For any* breadcrumb displayed on desktop, the complete navigation path should be shown
**Validates: Requirements 6.3**

### Property 27: Breadcrumb text truncation
*For any* breadcrumb items that are too long on mobile, text should be truncated with ellipsis
**Validates: Requirements 6.4**

### Property 28: Breadcrumb navigation
*For any* breadcrumb item tapped on mobile, navigation to that level should occur
**Validates: Requirements 6.5**

### Property 29: Touch-optimized date picker
*For any* date picker opened on mobile, a touch-optimized calendar interface should be displayed
**Validates: Requirements 7.1**

### Property 30: Mobile select interface
*For any* select dropdown opened on mobile, options should be displayed in a full-screen or bottom sheet interface
**Validates: Requirements 7.2**

### Property 31: Select option touch targets
*For any* select options displayed on mobile, touch targets should be at least 44x44 pixels
**Validates: Requirements 7.3**

### Property 32: Mobile combobox interface
*For any* combobox used on mobile, a mobile-optimized search interface should be shown
**Validates: Requirements 7.4**

### Property 33: Component interaction feedback
*For any* date or select component interaction on mobile, clear visual feedback should be provided
**Validates: Requirements 7.5**

### Property 34: Editor toolbar hidden on mobile
*For any* document editor displayed at viewport width less than 768px, the formatting toolbar should be hidden or collapsed
**Validates: Requirements 8.1**

### Property 35: Editor floating toolbar
*For any* editor tap on mobile, a compact floating toolbar with essential formatting options should appear
**Validates: Requirements 8.2**

### Property 36: Editor toolbar overflow menus
*For any* editor toolbar displayed on mobile, advanced options should be grouped in overflow menus
**Validates: Requirements 8.3**

### Property 37: Editor condensed toolbar on tablet
*For any* editor displayed on tablet, a condensed toolbar with most-used options visible should be shown
**Validates: Requirements 8.4**

### Property 38: Editor state preservation
*For any* viewport switch between mobile and desktop, document content and cursor position should be preserved
**Validates: Requirements 8.5**

### Property 39: Dashboard widgets stacked on mobile
*For any* dashboard widgets displayed at viewport width less than 640px, they should be stacked vertically
**Validates: Requirements 9.1**

### Property 40: Charts scale on mobile
*For any* charts and graphs displayed on mobile, they should scale to fit viewport width while maintaining readability
**Validates: Requirements 9.2**

### Property 41: Dashboard metrics prioritization
*For any* dashboard cards containing multiple metrics on mobile, key metrics should be prioritized with expansion for details
**Validates: Requirements 9.3**

### Property 42: Dashboard two-column on tablet
*For any* dashboard viewed on tablet, widgets should be displayed in a 2-column layout
**Validates: Requirements 9.4**

### Property 43: Dashboard filters collapsible
*For any* dashboard filters displayed on mobile, they should be grouped in a collapsible panel or bottom sheet
**Validates: Requirements 9.5**

### Property 44: Chat separate views on mobile
*For any* chat interface displayed at viewport width less than 768px, room list and chat messages should be shown in separate views
**Validates: Requirements 10.1**

### Property 45: Chat room navigation
*For any* chat room selected on mobile, navigation to message view with back button should occur
**Validates: Requirements 10.2**

### Property 46: Chat message bubbles optimized
*For any* chat messages displayed on mobile, message bubbles should be optimized for narrow screens
**Validates: Requirements 10.3**

### Property 47: Chat attachments compact
*For any* file attachments displayed in chat on mobile, they should be shown in a compact, scrollable format
**Validates: Requirements 10.5**

### Property 48: Components responsive classes
*For any* UI component rendered at different viewport sizes, appropriate responsive classes should be applied
**Validates: Requirements 11.1**

### Property 49: Responsive spacing
*For any* spacing and padding applied to components, responsive values that scale appropriately should be used
**Validates: Requirements 11.2**

### Property 50: Readable typography on mobile
*For any* typography rendered on mobile, font sizes should be at least 16px for body text
**Validates: Requirements 11.3**

### Property 51: Interactive elements touch targets
*For any* interactive elements rendered on mobile, minimum touch target size should be 44x44 pixels
**Validates: Requirements 11.4**

### Property 52: Responsive sizing units
*For any* components using fixed widths or heights, they should be converted to responsive units or max-width constraints
**Validates: Requirements 11.5**

### Property 53: List card layout on mobile
*For any* list view displayed at viewport width less than 768px, table layout should be converted to card-based layout
**Validates: Requirements 12.1**

### Property 54: List item information hierarchy
*For any* list items displayed on mobile, essential information should be shown prominently with secondary details on expansion
**Validates: Requirements 12.2**

### Property 55: List filters collapsible
*For any* filters and search displayed on mobile, they should be grouped in a collapsible filter panel
**Validates: Requirements 12.3**

### Property 56: Mobile bulk actions interface
*For any* bulk actions performed on mobile, a mobile-optimized selection interface should be provided
**Validates: Requirements 12.4**

### Property 57: Compact pagination on mobile
*For any* pagination displayed on mobile, a compact pagination control with page numbers should be shown
**Validates: Requirements 12.5**

### Property 58: Responsive image sizing
*For any* images loaded on mobile, appropriately sized images based on viewport width should be served
**Validates: Requirements 13.1**

### Property 59: Media lazy loading
*For any* media content displayed on mobile, lazy loading should be used for off-screen content
**Validates: Requirements 13.2**

### Property 60: Responsive video containers
*For any* videos embedded on mobile, responsive video containers that maintain aspect ratio should be used
**Validates: Requirements 13.4**

### Property 61: Media upload optimization
*For any* media uploaded on mobile, file size should be optimized before upload when appropriate
**Validates: Requirements 13.5**

### Property 62: Portrait to landscape reflow
*For any* device orientation change from portrait to landscape, content should reflow to utilize available width
**Validates: Requirements 14.1**

### Property 63: Landscape to portrait adjustment
*For any* device orientation change from landscape to portrait, layout should adjust to fit narrower viewport
**Validates: Requirements 14.2**

### Property 64: Landscape form optimization
*For any* forms displayed in landscape mode on mobile, field layout should be optimized for horizontal space
**Validates: Requirements 14.3**

### Property 65: Rotation state preservation
*For any* device rotation while viewing content, scroll position and state should be maintained
**Validates: Requirements 14.4**

### Property 66: Landscape media maximization
*For any* media content displayed in landscape mode, viewing area should be maximized
**Validates: Requirements 14.5**

### Property 67: Navigation ARIA labels
*For any* responsive navigation rendered, appropriate ARIA labels and roles should be provided
**Validates: Requirements 15.1**

### Property 68: Menu state announcements
*For any* mobile menu opened or closed, state changes should be announced to screen readers
**Validates: Requirements 15.2**

### Property 69: Touch targets keyboard accessible
*For any* touch targets rendered on mobile, they should be keyboard accessible
**Validates: Requirements 15.3**

### Property 70: Visible focus indicators
*For any* focus movement between elements on mobile, visible focus indicators should be provided
**Validates: Requirements 15.4**

### Property 71: Logical tab order preservation
*For any* responsive layout change based on viewport, logical tab order should be maintained
**Validates: Requirements 15.5**

## Error Handling

### Viewport Detection Errors

**Issue**: Viewport size detection fails or returns incorrect values
**Handling**:
- Fallback to default breakpoint (desktop)
- Use CSS media queries as backup
- Log error for monitoring

**Issue**: Orientation change not detected
**Handling**:
- Listen to multiple events (orientationchange, resize)
- Debounce handlers to prevent excessive re-renders
- Maintain last known orientation as fallback

### Component Rendering Errors

**Issue**: Component fails to render in responsive mode
**Handling**:
- Graceful degradation to desktop layout
- Error boundary to catch rendering errors
- Display user-friendly error message

**Issue**: Touch target size below minimum
**Handling**:
- Automatically increase padding/size
- Log warning in development mode
- Provide override prop for edge cases

### Media Loading Errors

**Issue**: Responsive images fail to load
**Handling**:
- Fallback to original image source
- Display placeholder or error state
- Retry with exponential backoff

**Issue**: Lazy loading fails
**Handling**:
- Load content immediately as fallback
- Log error for monitoring
- Provide manual load trigger

### State Management Errors

**Issue**: State lost during viewport change
**Handling**:
- Persist critical state to sessionStorage
- Implement state recovery mechanism
- Warn user before data loss

**Issue**: Scroll position not preserved
**Handling**:
- Store scroll position before layout change
- Restore after re-render
- Use scroll restoration API

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Focus Areas**:
- Component rendering at different viewports
- Responsive class application
- Touch target size validation
- Layout calculations
- State preservation

**Example Tests**:
```typescript
describe('ResponsiveSidebar', () => {
  it('renders as drawer on mobile', () => {
    // Test sidebar renders as Sheet component below 768px
  })
  
  it('shows icons only when collapsed', () => {
    // Test collapsed state shows only icons
  })
})
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Focus Areas**:
- Viewport width variations
- Content size variations
- Breakpoint transitions
- Touch target sizes
- Grid column calculations

**Example Property Tests**:
```typescript
// Property 1: Sidebar drawer on mobile
test('Property 1: Sidebar renders as drawer for any viewport < 768px', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 320, max: 767 }), // viewport widths
      (width) => {
        const { container } = render(<Sidebar />, { viewport: width })
        const drawer = container.querySelector('[data-mobile="true"]')
        expect(drawer).toBeInTheDocument()
      }
    ),
    { numRuns: 100 }
  )
})

// Property 14: Grid single column on mobile
test('Property 14: Grid displays single column for any viewport < 640px', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 320, max: 639 }),
      fc.array(fc.anything(), { minLength: 1, maxLength: 20 }),
      (width, items) => {
        const { container } = render(
          <ResponsiveGrid items={items} />,
          { viewport: width }
        )
        const columns = getComputedColumns(container)
        expect(columns).toBe(1)
      }
    ),
    { numRuns: 100 }
  )
})

// Property 51: Interactive elements touch targets
test('Property 51: Interactive elements have min 44x44px touch targets', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('button', 'link', 'checkbox', 'radio'),
      (elementType) => {
        const { container } = render(
          createElement(elementType),
          { viewport: 375 } // mobile
        )
        const element = container.firstChild
        const { width, height } = element.getBoundingClientRect()
        expect(width).toBeGreaterThanOrEqual(44)
        expect(height).toBeGreaterThanOrEqual(44)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

**Framework**: Playwright

**Focus Areas**:
- End-to-end responsive flows
- Touch interactions
- Orientation changes
- Real device testing
- Cross-browser compatibility

**Test Scenarios**:
- Complete user journey on mobile
- Form submission on different devices
- Navigation across breakpoints
- Media upload and display
- Chat functionality on mobile

### Visual Regression Testing

**Framework**: Playwright + Percy/Chromatic

**Focus Areas**:
- Component appearance at each breakpoint
- Layout consistency
- Spacing and alignment
- Typography scaling
- Dark mode compatibility

### Accessibility Testing

**Framework**: axe-core + Playwright

**Focus Areas**:
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader compatibility
- Touch target sizes

### Performance Testing

**Metrics**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

**Tools**:
- Lighthouse
- WebPageTest
- Chrome DevTools

**Targets**:
- Mobile FCP < 1.8s
- Mobile LCP < 2.5s
- CLS < 0.1
- TTI < 3.8s

## Implementation Notes

### Tailwind CSS Configuration

The system already uses Tailwind CSS 4 with custom breakpoints defined in `globals.css`:
```css
--breakpoint-sm: 481px;
--breakpoint-md: 768px;
--breakpoint-lg: 1025px;
--breakpoint-xl: 1281px;
--breakpoint-2xl: 1536px;
```

### Existing Responsive Utilities

The codebase already includes:
- `useIsMobile` hook for device detection
- Touch target CSS for pointer: coarse devices
- Overflow-x-hidden on html and body
- Reduced motion support

### Component Library

All components use shadcn/ui which provides:
- Radix UI primitives with built-in accessibility
- Responsive variants via CVA (class-variance-authority)
- Sheet component for mobile drawers
- Dialog with responsive behavior

### Best Practices

1. **Mobile-First CSS**: Write base styles for mobile, add breakpoints for larger screens
2. **Touch Targets**: Use `min-height: 44px; min-width: 44px` for all interactive elements
3. **Viewport Meta**: Already configured with proper viewport settings
4. **Flexible Images**: Use `max-width: 100%; height: auto`
5. **Responsive Typography**: Use clamp() for fluid typography
6. **Grid/Flexbox**: Prefer CSS Grid and Flexbox over fixed layouts
7. **Container Queries**: Consider for component-level responsiveness
8. **Reduced Motion**: Respect prefers-reduced-motion
9. **Dark Mode**: Ensure responsive components work in both themes
10. **Performance**: Lazy load off-screen content, optimize images

### Migration Strategy

1. **Phase 1**: Core layout components (sidebar, navigation, breadcrumb)
2. **Phase 2**: Data display components (tables, grids, cards)
3. **Phase 3**: Form components (inputs, selects, date pickers)
4. **Phase 4**: Complex components (editor, chat, dashboard)
5. **Phase 5**: Pages and views (processos, audiências, etc)
6. **Phase 6**: Polish and optimization

Each phase should include:
- Implementation
- Unit tests
- Property-based tests
- Visual regression tests
- Accessibility audit
- Performance check
