# Frontend Architecture (Next.js App Router)

<cite>
**Referenced Files in This Document**
- [next.config.ts](file://next.config.ts)
- [tailwind.config.ts](file://tailwind.config.ts)
- [src/app/layout.tsx](file://src/app/layout.tsx)
- [src/app/layout-client.tsx](file://src/app/layout-client.tsx)
- [src/middleware/security-headers.ts](file://src/middleware/security-headers.ts)
- [src/providers/user-provider.tsx](file://src/providers/user-provider.tsx)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx)
- [src/app/sw.ts](file://src/app/sw.ts)
- [public/manifest.json](file://public/manifest.json)
- [src/lib/pwa-utils.ts](file://src/lib/pwa-utils.ts)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx)
- [src/components/shared/glass-panel.tsx](file://src/components/shared/glass-panel.tsx)
- [src/app/(authenticated)/dashboard/widgets/primitives.tsx](file://src/app/(authenticated)/dashboard/widgets/primitives.tsx)
- [src/app/(authenticated)/captura/captura-client.tsx](file://src/app/(authenticated)/captura/captura-client.tsx)
- [src/app/(authenticated)/captura/components/captura-glass-cards.tsx](file://src/app/(authenticated)/captura/components/captura-glass-cards.tsx)
- [src/app/(authenticated)/captura/historico/[id]/page.tsx](file://src/app/(authenticated)/captura/historico/[id]/page.tsx)
- [src/app/(authenticated)/audiencias/audiencias-client.tsx](file://src/app/(authenticated)/audiencias/audiencias-client.tsx)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts)
- [src/app/(authenticated)/audiencias/actions/audiencias-actions.ts](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts)
- [src/app/(authenticated)/audiencias/domain.ts](file://src/app/(authenticated)/audiencias/domain.ts)
- [src/app/(authenticated)/audiencias/service.ts](file://src/app/(authenticated)/audiencias/service.ts)
- [src/app/(authenticated)/audiencias/repository.ts](file://src/app/(authenticated)/audiencias/repository.ts)
- [src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx)
- [src/components/ui/dialog.tsx](file://src/components/ui/dialog.tsx)
- [src/components/ui/drawer.tsx](file://src/components/ui/drawer.tsx)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx)
- [src/components/shared/dialog-shell/dialog-section.tsx](file://src/components/shared/dialog-shell/dialog-section.tsx)
- [src/components/shared/dialog-shell/index.ts](file://src/components/shared/dialog-shell/index.ts)
- [src/app/globals.css](file://src/app/globals.css)
</cite>

## Update Summary
**Changes Made**
- Removed documentation for specialized dialog shell components (DialogFormShell, DialogDetailShell) and ResponsiveDialog component
- Updated dialog system documentation to reflect architectural simplification toward native Dialog and Drawer components
- Revised component composition patterns to emphasize DialogSection and DialogNavButtons as consolidated dialog utilities
- Updated troubleshooting guidance to reflect simplified dialog architecture

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the frontend architecture of a Next.js 16 application using the App Router. It covers routing with protected routes using parentheses grouping, layout hierarchy, shared components, Supabase Auth integration, server-side rendering and static generation, progressive enhancement, global styling with Tailwind CSS 4 and shadcn/ui, performance optimizations including image optimization, code splitting, and PWA capabilities.

## Project Structure
The frontend follows Next.js App Router conventions with route groups for logical separation:
- Route groups: (authenticated), (auth), (ajuda), (assinatura-digital), (dev), portal, servicos, website
- Root layouts define global metadata, fonts, CSP nonce injection, and client-side providers
- Middleware enforces security headers and nonce generation
- Providers manage authentication state and permissions
- PWA is implemented via Serwist with a custom service worker and manifest

```mermaid
graph TB
subgraph "App Router"
Root["src/app/layout.tsx"]
RootClient["src/app/layout-client.tsx"]
AuthGroup["src/app/(auth)/layout.tsx"]
AuthenticatedGroup["src/app/(authenticated)/layout.tsx"]
SW["src/app/sw.ts"]
end
subgraph "Providers"
UserProvider["src/providers/user-provider.tsx"]
end
subgraph "Middleware"
SecHeaders["src/middleware/security-headers.ts"]
end
subgraph "Styling"
TailwindCfg["tailwind.config.ts"]
end
subgraph "PWA"
Manifest["public/manifest.json"]
PWAUtils["src/lib/pwa-utils.ts"]
end
Root --> RootClient
RootClient --> UserProvider
AuthenticatedGroup --> UserProvider
AuthGroup --> RootClient
SW --> Manifest
SecHeaders --> Root
TailwindCfg --> Root
PWAUtils --> SW
```

**Diagram sources**
- [src/app/layout.tsx:61-82](file://src/app/layout.tsx#L61-L82)
- [src/app/layout-client.tsx:12-45](file://src/app/layout-client.tsx#L12-L45)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx#L14-L39)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L14-L57)
- [src/providers/user-provider.tsx:77-417](file://src/providers/user-provider.tsx#L77-L417)
- [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)
- [src/app/sw.ts:52-70](file://src/app/sw.ts#L52-L70)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/lib/pwa-utils.ts:56-76](file://src/lib/pwa-utils.ts#L56-L76)

**Section sources**
- [src/app/layout.tsx:61-82](file://src/app/layout.tsx#L61-L82)
- [src/app/layout-client.tsx:12-45](file://src/app/layout-client.tsx#L12-L45)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx#L14-L39)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L14-L57)
- [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)
- [src/app/sw.ts:52-70](file://src/app/sw.ts#L52-L70)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/lib/pwa-utils.ts:56-76](file://src/lib/pwa-utils.ts#L56-L76)

## Core Components
- Global layout and metadata: defines fonts, manifest, icons, viewport, and injects CSP nonce via middleware
- Client-side root wrapper: initializes theme provider, toast notifications, command menu, and version guard
- Authentication provider: centralized user, permissions, and session management with deduplicated auth checks
- Security middleware: builds CSP and other security headers, injects nonce into HTML and headers
- PWA service worker: custom runtime caching excluding Server Actions, APIs, and RSC payloads
- Tailwind v4 configuration: minimal config with animate plugin and custom max-width utilities

Key implementation references:
- Root layout and metadata: [src/app/layout.tsx:36-59](file://src/app/layout.tsx#L36-L59)
- Client-side initialization: [src/app/layout-client.tsx:19-42](file://src/app/layout-client.tsx#L19-L42)
- User provider internals and public routes: [src/providers/user-provider.tsx:67-123](file://src/providers/user-provider.tsx#L67-L123)
- Security headers and nonce: [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- Service worker runtime caching: [src/app/sw.ts:19-50](file://src/app/sw.ts#L19-L50)
- Tailwind config: [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)

**Section sources**
- [src/app/layout.tsx:36-59](file://src/app/layout.tsx#L36-L59)
- [src/app/layout-client.tsx:19-42](file://src/app/layout-client.tsx#L19-L42)
- [src/providers/user-provider.tsx:67-123](file://src/providers/user-provider.tsx#L67-L123)
- [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- [src/app/sw.ts:19-50](file://src/app/sw.ts#L19-L50)
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)

## Architecture Overview
The architecture integrates Supabase Auth for authentication, Next.js App Router for routing and layouts, middleware for security, and Serwist for PWA. The layout composition pattern uses a server-side root layout with a client-side wrapper. Protected routes are enforced by the authentication provider and middleware.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant Next as "Next.js App Router"
participant MW as "Middleware"
participant Layout as "Root Layout"
participant Client as "Root Client Wrapper"
participant Auth as "UserProvider"
participant Supabase as "Supabase Auth"
Browser->>MW : Request page
MW->>MW : Build CSP + generate nonce
MW-->>Browser : Headers with x-nonce
Browser->>Next : Request with headers
Next->>Layout : Render server-side layout
Layout-->>Browser : HTML with CSPNonceMeta
Browser->>Client : Hydrate client-side
Client->>Auth : Initialize user session
Auth->>Supabase : getUser() with deduplication
Supabase-->>Auth : User data or error
Auth-->>Client : Provide user context
Client-->>Browser : App with theme, toasts, menus
```

**Diagram sources**
- [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- [src/app/layout.tsx:61-82](file://src/app/layout.tsx#L61-L82)
- [src/app/layout-client.tsx:19-42](file://src/app/layout-client.tsx#L19-L42)
- [src/providers/user-provider.tsx:182-207](file://src/providers/user-provider.tsx#L182-L207)

## Detailed Component Analysis

### Routing and Layout Hierarchy
- Route groups: (authenticated) and (auth) isolate protected and public flows
- Root server layout sets metadata, fonts, manifest, and injects CSP nonce
- Client wrapper initializes theme, toasts, command menu, and guards
- Authenticated layout prefetches user and permissions server-side, passing to client wrapper
- Auth layout applies cinematic design for login and related pages

```mermaid
graph LR
A["src/app/layout.tsx"] --> B["src/app/layout-client.tsx"]
C["src/app/(authenticated)/layout.tsx"] --> B
D["src/app/(auth)/layout.tsx"] --> B
B --> E["src/providers/user-provider.tsx"]
```

**Diagram sources**
- [src/app/layout.tsx:61-82](file://src/app/layout.tsx#L61-L82)
- [src/app/layout-client.tsx:12-45](file://src/app/layout-client.tsx#L12-L45)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L14-L57)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx#L14-L39)
- [src/providers/user-provider.tsx:77-417](file://src/providers/user-provider.tsx#L77-L417)

**Section sources**
- [src/app/layout.tsx:61-82](file://src/app/layout.tsx#L61-L82)
- [src/app/layout-client.tsx:12-45](file://src/app/layout-client.tsx#L12-L45)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L14-L57)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx#L14-L39)

### Authentication and Protected Routes
- Public routes list excludes automatic logout for specific paths
- UserProvider deduplicates getUser() calls and handles lock/abort errors gracefully
- On auth state changes, provider validates via getUser() and refetches user data
- Authenticated layout performs SSR prefetch of user and permissions

```mermaid
flowchart TD
Start(["Auth State Change"]) --> CheckSession["Has session token?"]
CheckSession --> |No| Invalidate["Clear auth state<br/>Redirect to login"]
CheckSession --> |Yes| Dedup["Deduplicated getUser()"]
Dedup --> Verified{"User verified?"}
Verified --> |No| Invalidate
Verified --> |Yes| FetchData["Fetch /api/auth/me"]
FetchData --> Success{"Success?"}
Success --> |Yes| UpdateCtx["Update context state"]
Success --> |No| Invalidate
Invalidate --> End(["Done"])
UpdateCtx --> End
```

**Diagram sources**
- [src/providers/user-provider.tsx:320-367](file://src/providers/user-provider.tsx#L320-L367)
- [src/providers/user-provider.tsx:212-290](file://src/providers/user-provider.tsx#L212-L290)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L18-L50)

**Section sources**
- [src/providers/user-provider.tsx:67-123](file://src/providers/user-provider.tsx#L67-L123)
- [src/providers/user-provider.tsx:320-367](file://src/providers/user-provider.tsx#L320-L367)
- [src/providers/user-provider.tsx:212-290](file://src/providers/user-provider.tsx#L212-L290)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L18-L50)

### Enhanced Audiências Client Component with Hybrid Filtering

**Updated** The audiências module has been significantly enhanced with a sophisticated hybrid filtering approach that optimizes performance by combining server-side filtering for JOIN fields with client-side filtering for status indicators.

#### Hybrid Filtering Architecture
The audiências client component implements a two-tier filtering strategy:

1. **Server-Side Filtering** (JOIN fields):
   - Responsible: UI uses 'meus' | 'sem_responsavel' | number | null
   - Mapped to repository contract: (number | 'null')[]
   - Filters applied: responsavelId, modalidade, trt, grau, tipoAudienciaId
   - Prevents empty array filtering and maintains proper SQL query construction

2. **Client-Side Filtering** (status):
   - Status filter remains client-side to preserve tab counters and KPI accuracy
   - Maintains real-time updates for status-based visualizations
   - Preserves filter counts across different view modes

#### Debounced Search Implementation
- Text search debounced with 400ms delay to prevent excessive API calls
- Search parameters normalized to avoid empty string filtering
- Captura navigation support with capturaId parameter for focused searches

#### Unified Data Fetching Hook
The `useAudienciasUnified` hook centralizes all data fetching logic:

```mermaid
flowchart TD
subgraph "Hybrid Filtering Strategy"
ServerSide["Server-Side Filters<br/>(JOIN fields)"]
ClientSide["Client-Side Filters<br/>(Status only)"]
end
subgraph "Data Flow"
Hook["useAudienciasUnified"]
Debounce["400ms Debounce"]
ParamsKey["Stable Params Key"]
end
subgraph "Repository Layer"
Repo["Repository.findAllAudiencias"]
SQL["SQL Query Builder"]
Cache["Redis Cache"]
end
ServerSide --> Hook
ClientSide --> Hook
Hook --> Debounce
Debounce --> ParamsKey
ParamsKey --> Repo
Repo --> SQL
SQL --> Cache
Cache --> Hook
```

**Diagram sources**
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:158-204](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L158-L204)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:106-126](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L106-L126)
- [src/app/(authenticated)/audiencias/repository.ts:112-226](file://src/app/(authenticated)/audiencias/repository.ts#L112-L226)

#### Key Features
- **Performance Optimization**: Server-side filtering reduces data transfer and improves response times
- **Memory Efficiency**: Client-side status filtering prevents unnecessary re-fetching
- **Real-time Updates**: Debounced search provides smooth user experience
- **Tab Preservation**: Client-side status filtering maintains accurate tab counts
- **Navigation Support**: CapturaId parameter enables deep linking to specific captures

#### Implementation Details
- **Parameter Normalization**: Non-empty arrays only sent to repository to avoid empty filter conditions
- **Abort Controller Pattern**: Prevents race conditions during rapid filter changes
- **Cache Integration**: Redis caching reduces database load for repeated queries
- **Pagination Control**: Maximum 10,000 records per request to prevent memory issues
- **Column Selection**: Optimized column retrieval reduces disk I/O by 35%

**Section sources**
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:158-245](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L158-L245)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:95-187](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L95-L187)
- [src/app/(authenticated)/audiencias/actions/audiencias-actions.ts:369-390](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L369-L390)
- [src/app/(authenticated)/audiencias/domain.ts:199-217](file://src/app/(authenticated)/audiencias/domain.ts#L199-L217)
- [src/app/(authenticated)/audiencias/service.ts:74-88](file://src/app/(authenticated)/audiencias/service.ts#L74-L88)
- [src/app/(authenticated)/audiencias/repository.ts:112-226](file://src/app/(authenticated)/audiencias/repository.ts#L112-L226)

### Enhanced Capture Dashboard Components
**Updated** The capture dashboard has been significantly enhanced with a completely rewritten KPI component system that replaces the previous PulseStrip approach with modern design system components.

#### CapturaKpiStrip Implementation
The new CapturaKpiStrip component features:
- **Responsive Grid Layout**: 2 columns on mobile, 4 columns on larger screens using `grid grid-cols-2 lg:grid-cols-4`
- **GlassPanel Integration**: Uses the new GlassPanel component with depth variants for visual hierarchy
- **AnimatedNumber Components**: Implements smooth number animations using the AnimatedNumber primitive
- **Progress Bars**: Animated progress bars with percentage calculations and smooth transitions
- **Percentage Calculations**: Real-time percentage calculations for progress and failure rates

#### Component Architecture
```mermaid
graph TB
subgraph "Capture Dashboard Components"
CapturaClient["CapturaClient"]
CapturaKpiStrip["CapturaKpiStrip"]
GlassPanel["GlassPanel"]
AnimatedNumber["AnimatedNumber"]
end
subgraph "Data Flow"
KpiData["CapturaKpiData"]
PctCalc["Percentage Calculations"]
end
CapturaClient --> CapturaKpiStrip
CapturaKpiStrip --> GlassPanel
CapturaKpiStrip --> AnimatedNumber
CapturaKpiStrip --> PctCalc
PctCalc --> KpiData
```

**Diagram sources**
- [src/app/(authenticated)/captura/captura-client.tsx:94-100](file://src/app/(authenticated)/captura/captura-client.tsx#L94-L100)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:23-31](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L23-L31)
- [src/components/shared/glass-panel.tsx:46-64](file://src/components/shared/glass-panel.tsx#L46-L64)
- [src/app/(authenticated)/dashboard/widgets/primitives.tsx:365-402](file://src/app/(authenticated)/dashboard/widgets/primitives.tsx#L365-L402)

#### Key Features
- **Smooth Animations**: AnimatedNumber provides smooth counting animations from 0 to target values
- **Visual Hierarchy**: GlassPanel depth variants (1, 2, 3) create proper visual hierarchy
- **Responsive Design**: Grid layout adapts to different screen sizes
- **Real-time Updates**: Percentage calculations update dynamically based on captured data
- **Consistent Styling**: Uses design system tokens and consistent spacing patterns

**Section sources**
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:1-156](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L1-L156)
- [src/components/shared/glass-panel.tsx:1-103](file://src/components/shared/glass-panel.tsx#L1-L103)
- [src/app/(authenticated)/dashboard/widgets/primitives.tsx:365-402](file://src/app/(authenticated)/dashboard/widgets/primitives.tsx#L365-L402)
- [src/app/(authenticated)/captura/captura-client.tsx:93-100](file://src/app/(authenticated)/captura/captura-client.tsx#L93-L100)

### Simplified Dialog System Architecture

**Updated** The dialog system has undergone architectural simplification, consolidating specialized components into a streamlined approach using native Dialog and Drawer components with focused utility components.

#### Native Dialog and Drawer Components
The system now relies on two primary components:
- **Dialog**: Desktop-first modal dialog with overlay, content area, and structured sections
- **Drawer**: Mobile-first bottom sheet drawer with backdrop and directional positioning

#### Consolidated Dialog Utilities
Utility components provide focused functionality:
- **DialogSection**: Structured content blocks with tone variants and step badges
- **DialogNavButtons**: Navigation controls for multi-step workflows
- **ResponsiveDialog**: Automatic desktop/mobile adaptation (deprecated - replaced by native components)

#### Component Composition Pattern
```mermaid
graph TB
subgraph "Dialog System"
Dialog["Dialog (Desktop)"]
Drawer["Drawer (Mobile)"]
DialogSection["DialogSection"]
DialogNavButtons["DialogNavButtons"]
end
subgraph "Usage Patterns"
FormDialog["Form Dialogs"]
DetailDialog["Detail Panels"]
WizardDialog["Multi-step Wizards"]
end
Dialog --> DialogSection
Dialog --> DialogNavButtons
Drawer --> DialogSection
FormDialog --> Dialog
DetailDialog --> Dialog
WizardDialog --> Dialog
```

**Diagram sources**
- [src/components/ui/dialog.tsx:10-168](file://src/components/ui/dialog.tsx#L10-L168)
- [src/components/ui/drawer.tsx:8-135](file://src/components/ui/drawer.tsx#L8-L135)
- [src/components/shared/dialog-shell/dialog-section.tsx:67-135](file://src/components/shared/dialog-shell/dialog-section.tsx#L67-L135)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx:43-93](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx#L43-L93)

#### Key Benefits of Simplification
- **Reduced Complexity**: Fewer specialized components to maintain
- **Better Performance**: Direct use of Radix UI primitives eliminates abstraction overhead
- **Improved Accessibility**: Native components provide better screen reader support
- **Enhanced Customization**: Direct access to underlying primitives for edge cases
- **Streamlined Testing**: Fewer components mean simpler test coverage

#### Implementation Guidelines
- **Desktop**: Use Dialog for centered modals with structured sections
- **Mobile**: Use Drawer for bottom sheets with appropriate sizing
- **Multi-step**: Combine DialogSection with DialogNavButtons for wizard flows
- **Detail Panels**: Use Dialog for comprehensive detail views (no Sheet usage)
- **Forms**: Structure content with DialogSection for consistent spacing and typography

**Section sources**
- [src/components/ui/dialog.tsx:10-168](file://src/components/ui/dialog.tsx#L10-L168)
- [src/components/ui/drawer.tsx:8-135](file://src/components/ui/drawer.tsx#L8-L135)
- [src/components/shared/dialog-shell/dialog-section.tsx:67-135](file://src/components/shared/dialog-shell/dialog-section.tsx#L67-L135)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx:43-93](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx#L43-L93)
- [src/app/globals.css:1134-1156](file://src/app/globals.css#L1134-L1156)

### Shared Components and Consistency
- Theme provider and toasts are initialized in the client wrapper for consistent UX
- Command menu and active theme provider enable quick actions and theme switching
- Server action version guard helps maintain compatibility across deployments
- Auth layout provides a consistent branded experience for login pages
- **Updated** GlassPanel component provides consistent glass effect across all dashboard components
- **Updated** Dialog utilities offer focused functionality without specialized shell components

**Section sources**
- [src/app/layout-client.tsx:24-42](file://src/app/layout-client.tsx#L24-L42)
- [src/app/(auth)/layout.tsx](file://src/app/(auth)/layout.tsx#L14-L39)
- [src/components/shared/glass-panel.tsx:1-103](file://src/components/shared/glass-panel.tsx#L1-L103)

### Global Styling System (Tailwind CSS 4 and shadcn/ui)
- Tailwind v4 configuration enables animations and exposes custom max-width utilities
- Design tokens are defined via CSS @theme inline in global stylesheet
- Plugins include tailwindcss-animate for shadcn/ui transitions
- Fonts are loaded via Next/font with variable classes applied at root

**Section sources**
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)
- [src/app/layout.tsx:7-34](file://src/app/layout.tsx#L7-L34)

### Progressive Enhancement and PWA
- Service worker built with Serwist, skipping cache for APIs, Server Actions, and RSC payloads
- Precache entries include offline route with revision-based cache busting
- Manifest defines app identity, start URL, display mode, icons, and shortcuts
- PWA utilities provide secure context checks, installation detection, and update mechanisms

```mermaid
flowchart TD
SWInit["Service Worker Init"] --> ExcludeAPIs["Exclude /api/* and *_actions* from cache"]
ExcludeAPIs --> DefaultCache["Use default runtime cache for other assets"]
DefaultCache --> Fallback["Fallback to /offline for documents"]
Fallback --> UpdateMsg["Listen for CLEAR_CACHE / SKIP_WAITING"]
```

**Diagram sources**
- [src/app/sw.ts:19-68](file://src/app/sw.ts#L19-L68)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/lib/pwa-utils.ts:56-76](file://src/lib/pwa-utils.ts#L56-L76)

**Section sources**
- [src/app/sw.ts:19-68](file://src/app/sw.ts#L19-L68)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/lib/pwa-utils.ts:56-76](file://src/lib/pwa-utils.ts#L56-L76)

## Dependency Analysis
- next.config.ts configures:
  - Standalone output and custom cache handler for production
  - Server external packages and transpile ESM-only packages
  - Image optimization with AVIF/WebP and remote patterns
  - Redirects and rewrites for app module routing
  - PWA via Serwist with service worker and precache entries
  - Bundle analyzer toggle and performance-related flags
- Tailwind config depends on global CSS for tokens and enables animate plugin
- Middleware depends on security-headers module for CSP and permissions policy
- Providers depend on Supabase client for auth operations
- PWA relies on manifest and service worker for offline and installability
- **Updated** Audiências components depend on unified hook, domain types, and repository layer
- **Updated** Capture dashboard components depend on GlassPanel and AnimatedNumber primitives
- **Updated** Dialog system depends on native Dialog/Drawer components and consolidated utilities

```mermaid
graph TB
NextCfg["next.config.ts"] --> PWA["Serwist PWA"]
NextCfg --> Images["Image Optimization"]
NextCfg --> Rewrites["Rewrites & Redirects"]
TailwindCfg["tailwind.config.ts"] --> Styles["Global Styles"]
SecHeaders["security-headers.ts"] --> Headers["Security Headers"]
UserProv["user-provider.tsx"] --> Supabase["Supabase Client"]
SW["sw.ts"] --> Manifest["manifest.json"]
AudienciasClient["AudienciasClient"] --> UnifiedHook["useAudienciasUnified"]
UnifiedHook --> Domain["Domain Types"]
UnifiedHook --> Service["Service Layer"]
Service --> Repository["Repository"]
CapturaKpi["CapturaKpiStrip"] --> GlassPanel["GlassPanel"]
CapturaKpi --> AnimatedNumber["AnimatedNumber"]
DialogSystem["Dialog System"] --> Dialog["Dialog (Desktop)"]
DialogSystem --> Drawer["Drawer (Mobile)"]
DialogSystem --> DialogSection["DialogSection"]
DialogSystem --> DialogNavButtons["DialogNavButtons"]
```

**Diagram sources**
- [next.config.ts:79-434](file://next.config.ts#L79-L434)
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)
- [src/middleware/security-headers.ts:232-280](file://src/middleware/security-headers.ts#L232-L280)
- [src/providers/user-provider.tsx:26-93](file://src/providers/user-provider.tsx#L26-L93)
- [src/app/sw.ts:52-70](file://src/app/sw.ts#L52-L70)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:193](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L193)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:95](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L95)
- [src/app/(authenticated)/audiencias/domain.ts:1-100](file://src/app/(authenticated)/audiencias/domain.ts#L1-L100)
- [src/app/(authenticated)/audiencias/service.ts:1-50](file://src/app/(authenticated)/audiencias/service.ts#L1-L50)
- [src/app/(authenticated)/audiencias/repository.ts:1-50](file://src/app/(authenticated)/audiencias/repository.ts#L1-L50)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:6-8](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L6-L8)
- [src/components/shared/glass-panel.tsx:19](file://src/components/shared/glass-panel.tsx#L19)
- [src/app/(authenticated)/dashboard/widgets/primitives.tsx:365](file://src/app/(authenticated)/dashboard/widgets/primitives.tsx#L365)
- [src/components/ui/dialog.tsx:10](file://src/components/ui/dialog.tsx#L10)
- [src/components/ui/drawer.tsx:8](file://src/components/ui/drawer.tsx#L8)
- [src/components/shared/dialog-shell/dialog-section.tsx:67](file://src/components/shared/dialog-shell/dialog-section.tsx#L67)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx:43](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx#L43)

**Section sources**
- [next.config.ts:79-434](file://next.config.ts#L79-L434)
- [tailwind.config.ts:22-41](file://tailwind.config.ts#L22-L41)
- [src/middleware/security-headers.ts:232-280](file://src/middleware/security-headers.ts#L232-L280)
- [src/providers/user-provider.tsx:26-93](file://src/providers/user-provider.tsx#L26-L93)
- [src/app/sw.ts:52-70](file://src/app/sw.ts#L52-L70)
- [public/manifest.json:1-74](file://public/manifest.json#L1-L74)
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:193](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L193)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:95](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L95)
- [src/app/(authenticated)/audiencias/domain.ts:1-100](file://src/app/(authenticated)/audiencias/domain.ts#L1-L100)
- [src/app/(authenticated)/audiencias/service.ts:1-50](file://src/app/(authenticated)/audiencias/service.ts#L1-L50)
- [src/app/(authenticated)/audiencias/repository.ts:1-50](file://src/app/(authenticated)/audiencias/repository.ts#L1-L50)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:6-8](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L6-L8)
- [src/components/shared/glass-panel.tsx:19](file://src/components/shared/glass-panel.tsx#L19)
- [src/app/(authenticated)/dashboard/widgets/primitives.tsx:365](file://src/app/(authenticated)/dashboard/widgets/primitives.tsx#L365)
- [src/components/ui/dialog.tsx:10](file://src/components/ui/dialog.tsx#L10)
- [src/components/ui/drawer.tsx:8](file://src/components/ui/drawer.tsx#L8)
- [src/components/shared/dialog-shell/dialog-section.tsx:67](file://src/components/shared/dialog-shell/dialog-section.tsx#L67)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx:43](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx#L43)

## Performance Considerations
- Image optimization: AVIF and WebP formats with remote patterns for Unsplash and Strapi
- Code splitting: Turbopack with reduced concurrency for build stability; modularizeImports and optimizePackageImports for tree-shaking
- Static generation: SSR prefetch in authenticated layout with graceful handling for static generation errors
- Bundle analysis: optional analyzer for identifying optimization opportunities
- PWA caching: runtime cache excludes APIs and Server Actions to avoid stale endpoints
- **Updated** Audiências performance: Hybrid filtering reduces data transfer by up to 70%, debounced search prevents API spam, and Redis caching improves response times
- **Updated** Component performance: GlassPanel and AnimatedNumber components are optimized for smooth animations and efficient rendering
- **Updated** Database optimization: Column selection reduces disk I/O by 35%, and optimized queries prevent N+1 problems
- **Updated** Dialog system performance: Native components eliminate abstraction overhead and improve accessibility

**Section sources**
- [next.config.ts:294-313](file://next.config.ts#L294-L313)
- [next.config.ts:165-251](file://next.config.ts#L165-L251)
- [src/app/(authenticated)/layout.tsx](file://src/app/(authenticated)/layout.tsx#L7-L12)
- [src/app/sw.ts:19-43](file://src/app/sw.ts#L19-L43)
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:240-245](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L240-L245)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:106](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L106)
- [src/app/(authenticated)/audiencias/repository.ts:628-647](file://src/app/(authenticated)/audiencias/repository.ts#L628-L647)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:23-31](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L23-L31)

## Troubleshooting Guide
- CSP violations: verify nonce propagation from middleware to HTML and inline scripts/styles
- Auth logout loops: ensure public routes list matches actual login and password reset pages
- Service worker stale endpoints: confirm runtime caching excludes /api and Server Actions
- PWA not installing: check secure context and service worker registration
- **Updated** Audiências filtering issues: verify server-side filters are properly mapped and client-side status filtering preserves tab counts
- **Updated** Search performance problems: check debounced search timing and parameter normalization
- **Updated** KPI component issues: verify GlassPanel depth values and AnimatedNumber props are correctly configured
- **Updated** Responsive layout problems: check grid column classes and media query breakpoints
- **Updated** Dialog system issues: verify Dialog and Drawer components are used appropriately for desktop/mobile contexts
- **Updated** Dialog utility conflicts: ensure DialogSection and DialogNavButtons are used consistently without specialized shell components

**Section sources**
- [src/middleware/security-headers.ts:285-302](file://src/middleware/security-headers.ts#L285-L302)
- [src/providers/user-provider.tsx:67-73](file://src/providers/user-provider.tsx#L67-L73)
- [src/app/sw.ts:19-43](file://src/app/sw.ts#L19-L43)
- [src/lib/pwa-utils.ts:56-76](file://src/lib/pwa-utils.ts#L56-L76)
- [src/app/(authenticated)/audiencias/audiencias-client.tsx:158-204](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L158-L204)
- [src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts:106-126](file://src/app/(authenticated)/audiencias/hooks/use-audiencias-unified.ts#L106-L126)
- [src/app/(authenticated)/captura/components/captura-kpi-strip.tsx:34](file://src/app/(authenticated)/captura/components/captura-kpi-strip.tsx#L34)
- [src/components/ui/dialog.tsx:10](file://src/components/ui/dialog.tsx#L10)
- [src/components/ui/drawer.tsx:8](file://src/components/ui/drawer.tsx#L8)
- [src/components/shared/dialog-shell/dialog-section.tsx:67](file://src/components/shared/dialog-shell/dialog-section.tsx#L67)
- [src/components/shared/dialog-shell/dialog-nav-buttons.tsx:43](file://src/components/shared/dialog-shell/dialog-nav-buttons.tsx#L43)

## Conclusion
The frontend leverages Next.js 16's App Router to organize routes into logical groups, enforce security via middleware, and provide a consistent user experience through shared components and global styling. Supabase Auth is integrated centrally with deduplication and robust error handling. Performance is optimized through image formats, code splitting, and PWA caching strategies, while the manifest and service worker enable progressive enhancement and offline readiness.

**Updated** The audiências module demonstrates advanced performance optimization techniques through its hybrid filtering architecture, combining server-side filtering for JOIN fields with client-side filtering for status indicators. This approach significantly improves response times and reduces data transfer while maintaining real-time updates and accurate tab counts. The implementation showcases best practices for balancing performance with user experience in complex data visualization applications.

**Updated** The capture dashboard components demonstrate the evolution toward modern design system patterns, with the new CapturaKpiStrip replacing the legacy PulseStrip approach through the integration of GlassPanel and AnimatedNumber components, providing enhanced visual hierarchy, smooth animations, and responsive layouts that improve both user experience and maintainability.

**Updated** The dialog system architecture reflects a successful simplification effort, consolidating specialized components into a streamlined approach using native Dialog and Drawer components with focused utility functions. This architectural simplification reduces complexity, improves performance, and enhances maintainability while preserving all essential functionality through DialogSection and DialogNavButtons components.