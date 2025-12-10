# Comunica CNJ Migration to FSD - Summary

## Completed Steps

### 1. Domain Layer Migration ✅

- **Created**: `src/features/captura/comunica-cnj/domain.ts`

  - Migrated all domain types and Zod validation schemas
  - Includes: `ComunicacaoItem`, `ComunicacaoCNJ`, `TribunalInfo`, `RateLimitStatus`
  - Validation schemas: `consultarComunicacoesSchema`, `sincronizarComunicacoesSchema`, etc.

- **Created**: `src/features/captura/comunica-cnj/cnj-client.ts`
  - Migrated the CNJ API client with rate limiting
  - Methods: `consultarComunicacoes`, `obterCertidao`, `listarTribunais`

### 2. Data Layer Migration ✅

- **Created**: `src/features/captura/comunica-cnj/repository.ts`
  - Migrated all database operations
  - Uses `createServiceClient` from `@/backend/utils/supabase/service-client`
  - Functions: `findComunicacaoByHash`, `saveComunicacao`, `vincularExpediente`, etc.
  - Implements Result<T> pattern for error handling

### 3. Business Logic Layer Migration ✅

- **Created**: `src/features/captura/comunica-cnj/service.ts`
  - Migrated all business logic
  - Functions: `buscarComunicacoes`, `sincronizarComunicacoes`, `listarComunicacoesCapturadas`
  - Utility functions: `inferirGrau`, `normalizarNumeroProcesso`, `extrairPartes`
  - Auto-creates expedientes from communications when needed

### 4. Server Actions Layer ✅

- **Created**: `src/features/captura/actions/utils.ts`

  - Auth helper: `requireAuth` with permission checking

- **Created**: `src/features/captura/actions/comunica-cnj-actions.ts`
  - Server Actions replacing REST API endpoints:
    - `actionConsultarComunicacoes` - Query CNJ API
    - `actionListarComunicacoesCapturadas` - List captured communications
    - `actionSincronizarComunicacoes` - Sync and persist communications
    - `actionObterCertidao` - Get PDF certificate
    - `actionVincularExpediente` - Link communication to expediente
    - `actionListarTribunaisDisponiveis` - List available tribunals

### 5. Components Migration ✅

All components migrated to `src/features/captura/components/comunica-cnj/`:

- **consulta.tsx** - Main consultation component

  - Integrates search form and results table
  - Uses Server Actions instead of API routes

- **capturadas.tsx** - List captured communications

  - Displays communications from database
  - Filtering and search functionality
  - Mobile and desktop responsive views

- **search-form.tsx** - Search form component

  - Complex form with tribunal selection, date ranges, filters
  - Uses Server Actions for tribunal list
  - Zod validation

- **results-table.tsx** - Results display component

  - Sortable table with filters
  - Mobile card view and desktop table view
  - Integrates with detail and PDF dialogs

- **detalhes-dialog.tsx** - Communication details dialog

  - Shows full communication information
  - Responsive (Dialog on desktop, Sheet on mobile)

- **pdf-viewer-dialog.tsx** - PDF certificate viewer
  - Displays PDF certificates from CNJ
  - Uses Server Action to fetch PDF
  - Download and open in new tab functionality

### 6. Barrel Exports ✅

- **Created**: `src/features/captura/components/comunica-cnj/index.ts`
- **Created**: `src/features/captura/index.ts`

## Architecture Improvements

### Before (Legacy)

```
src/
├── core/comunica-cnj/          # Domain logic
│   ├── domain.ts
│   ├── cnj-client.ts
│   ├── repository.ts
│   └── service.ts
├── app/api/comunica-cnj/       # REST API routes
│   ├── captura/route.ts
│   ├── capturadas/route.ts
│   ├── consulta/route.ts
│   ├── certidao/[hash]/route.ts
│   └── tribunais/route.ts
└── app/(dashboard)/comunica-cnj/components/  # UI components
    ├── comunica-cnj-consulta.tsx
    ├── comunica-cnj-capturadas.tsx
    ├── comunica-cnj-results-table.tsx
    ├── comunica-cnj-search-form.tsx
    ├── comunicacao-detalhes-dialog.tsx
    └── pdf-viewer-dialog.tsx
```

### After (FSD)

```
src/features/captura/
├── domain.ts                   # Generic captura domain
├── types.ts                    # Generic captura types
├── comunica-cnj/              # Comunica CNJ feature
│   ├── domain.ts              # CNJ-specific domain & validation
│   ├── cnj-client.ts          # CNJ API client
│   ├── repository.ts          # Database operations
│   └── service.ts             # Business logic
├── actions/                   # Server Actions (replaces API routes)
│   ├── utils.ts
│   └── comunica-cnj-actions.ts
├── components/comunica-cnj/   # UI components
│   ├── consulta.tsx
│   ├── capturadas.tsx
│   ├── search-form.tsx
│   ├── results-table.tsx
│   ├── detalhes-dialog.tsx
│   ├── pdf-viewer-dialog.tsx
│   └── index.ts
└── index.ts                   # Feature barrel export
```

## Key Changes

### 1. Database Client

- **Before**: Used `createDbClient()` from `@/core/common/db`
- **After**: Uses `createServiceClient()` from `@/backend/utils/supabase/service-client`
- Both use the same Supabase secret key approach

### 2. Error Handling

- **Before**: Mixed error handling approaches
- **After**: Consistent `Result<T>` pattern with `AppError`
- Uses `ok()` and `err()` helpers from `@/core/common/types`

### 3. API Layer

- **Before**: REST API routes in `/api/comunica-cnj/*`
- **After**: Server Actions in `actions/comunica-cnj-actions.ts`
- Benefits: Type-safe, no need for manual serialization, better DX

### 4. Component Integration

- **Before**: Components called API routes directly via `fetch()`
- **After**: Components call Server Actions
- Cleaner, type-safe, and more maintainable

### 5. Type Safety

- All domain types properly exported and reused
- Zod schemas for validation at boundaries
- TypeScript strict mode compliance

## Dependencies

### External

- `@supabase/supabase-js` - Database client
- `axios` - HTTP client for CNJ API
- `zod` - Schema validation
- `date-fns` - Date formatting (used in service layer)

### Internal

- `@/core/common/types` - Result<T>, AppError, PaginatedResponse
- `@/core/common/db` - Database client utilities
- `@/backend/utils/supabase/service-client` - Supabase service client
- `@/backend/auth/authorization` - Permission checking
- `@/lib/server` - Server-side Supabase client
- `@/core/expedientes/service` - Expediente creation (cross-feature dependency)

## Next Steps

1. **Update Page Components** - Update `src/app/(dashboard)/comunica-cnj/page.tsx` to use new components
2. **Delete Legacy Code** - Remove old API routes and core files after verification
3. **Update Imports** - Search codebase for `@/core/comunica-cnj` imports and update to `@/features/captura`
4. **Testing** - Verify all functionality works with new architecture
5. **Documentation** - Update API documentation to reflect Server Actions

## Notes

- **Cross-Feature Dependency**: Service layer imports `criarExpediente` from `@/core/expedientes/service`
  - This is acceptable as expedientes is a core feature
  - Could be refactored later if expedientes becomes a feature
- **Rate Limiting**: CNJ client implements rate limiting (60 requests per minute)

  - Stored in memory, resets every minute
  - Could be enhanced with Redis for distributed systems

- **PDF Handling**: Certificates are fetched as base64 and converted to Blob URLs
  - Memory efficient
  - Automatic cleanup on dialog close

## Migration Checklist

- [x] Migrate domain types and validation schemas
- [x] Migrate CNJ API client
- [x] Migrate repository layer
- [x] Migrate service layer
- [x] Create Server Actions
- [x] Migrate UI components
- [x] Create barrel exports
- [ ] Update page components
- [ ] Delete legacy API routes
- [ ] Delete legacy core files
- [ ] Update all imports across codebase
- [ ] Test functionality
- [ ] Update documentation
