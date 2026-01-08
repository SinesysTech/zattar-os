# Padrões de Lazy Loading

Este documento descreve os padrões de lazy loading implementados no projeto para otimização de bundle e performance.

## Componentes que DEVEM ser lazy-loaded

### 1. Plate Editor (`@/components/editor/plate/plate-editor`)

- **Tamanho aproximado**: ~500KB
- **Motivo**: Biblioteca de rich text editor com muitas dependências
- **SSR**: Desabilitado (`ssr: false`)
- **Skeleton**: `PlateEditorSkeleton`

```typescript
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

function PlateEditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
    </div>
  );
}

const PlateEditor = dynamic(
  () => import('@/components/editor/plate/plate-editor').then(m => ({ default: m.PlateEditor })),
  {
    ssr: false,
    loading: () => <PlateEditorSkeleton />
  }
);
```

**Arquivos que usam**:
- `src/features/documentos/components/document-editor.tsx`
- `src/app/app/editor/page.tsx`

### 2. Recharts Widgets (`@/app/app/dashboard`)

- **Tamanho aproximado**: ~200KB (biblioteca Recharts)
- **Componentes**: `WidgetFluxoCaixa`, `WidgetDespesasCategoria`
- **SSR**: Desabilitado (`ssr: false`)
- **Skeleton**: `ChartSkeleton` de `@/features/financeiro/components/shared`

```typescript
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/features/financeiro/components/shared';

const WidgetFluxoCaixa = dynamic(
  () => import('@/app/app/dashboard').then(m => ({ default: m.WidgetFluxoCaixa })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Fluxo de Caixa (6 meses)" />
  }
);
```

**Arquivos que usam**:
- `src/features/financeiro/components/dashboard/financeiro-dashboard.tsx`

### 3. Dyte SDK Components (`@/features/chat/components`)

- **Componentes**: `VideoCallDialog`, `CallDialog`, `CustomMeetingUI`
- **Status**: Já implementado com `React.lazy()` nos parents
- **SSR**: Desabilitado
- **Skeleton**: `MeetingSkeleton`

**Nota**: Os sub-componentes (`CustomVideoGrid`, `CustomAudioGrid`, `CustomParticipantList`) são carregados indiretamente através do lazy loading do parent `CustomMeetingUI`.

## Padrão de Implementação

### Estrutura Básica

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('./heavy-component').then(m => ({ default: m.HeavyComponent })),
  {
    ssr: false, // Para componentes client-only
    loading: () => <ComponentSkeleton />
  }
);
```

### Para Named Exports

Quando o componente não é um default export:

```typescript
const NamedComponent = dynamic(
  () => import('./module').then(m => ({ default: m.NamedComponent })),
  { ssr: false }
);
```

### Para Default Exports

```typescript
const DefaultComponent = dynamic(
  () => import('./component'),
  { ssr: false }
);
```

## Quando NÃO lazy-load

- **Componentes pequenos** (<50KB)
- **Componentes críticos para First Contentful Paint** (above-the-fold)
- **Componentes server-side** (Server Components)
- **Componentes que aparecem imediatamente** ao carregar a página

## Skeletons Disponíveis

### ChartSkeleton

```typescript
import { ChartSkeleton } from '@/features/financeiro/components/shared';

// Uso
<ChartSkeleton title="Título do Gráfico" height="320px" />
```

### PlateEditorSkeleton

Definido inline nos arquivos que usam o PlateEditor.

### MeetingSkeleton

```typescript
import { MeetingSkeleton } from '@/features/chat/components/meeting-skeleton';
```

## Verificação de Otimização

### Analisar Bundle

```bash
# Build com análise de bundle
$env:ANALYZE="true"; npm run build
```

### Verificar Tipos

```bash
npm run type-check
```

### Build Local

```bash
npm run build
```

## Isolamento de Código Server-Only

### Playwright (Captura)

O Playwright é usado apenas server-side para automação de captura de processos:

- **Localização**: `src/features/captura/services/`, `src/features/captura/drivers/`
- **Execução**: Via Server Actions em `src/features/captura/actions/`
- **Verificação**: Nenhum import de Playwright em `src/features/captura/components/`

## Diagrama de Fluxo

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Página    │────▶│   Dynamic    │────▶│   Skeleton     │
│  Carrega    │     │   Import     │     │   Loading      │
└─────────────┘     └──────────────┘     └────────────────┘
                           │
                           ▼ (async)
                    ┌──────────────┐
                    │  Componente  │
                    │   Carregado  │
                    └──────────────┘
```

## Impacto Esperado

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Bundle Inicial | ~2MB | ~1.3MB | -35% |
| First Contentful Paint | - | - | -15-20% |
| Time to Interactive | - | - | -20-25% |

## Referências

- [Next.js Lazy Loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy](https://react.dev/reference/react/lazy)
- [next/dynamic](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#nextdynamic)
