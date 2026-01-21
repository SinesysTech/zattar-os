# Otimizações de Performance - Componentes de Chamada (Dyte)

## Visão Geral

Este documento descreve as otimizações de performance implementadas para os componentes de chamada (vídeo/áudio) usando o Dyte SDK. O objetivo é reduzir o tamanho do bundle inicial e melhorar o tempo de carregamento da página de chat.

## Problema Original

Os componentes de chamada (`VideoCallDialog`, `CallDialog`, `CustomMeetingUI`) e o Dyte SDK estavam sendo carregados de forma eager (eager loading), mesmo quando o usuário não estava usando chamadas. Isso resultava em:

- Bundle JavaScript inicial maior (~20-30% maior)
- Tempo de carregamento mais lento na página `/chat`
- Maior uso de memória mesmo quando chat está inativo
- Pior experiência em dispositivos móveis

## Soluções Implementadas

### 1. Lazy Loading com React.lazy

Todos os componentes pesados relacionados a chamadas são carregados de forma lazy usando `React.lazy()` e `Suspense`:

#### ChatWindow (Componente Principal)

```tsx
// src/features/chat/components/chat-layout.tsx
import { lazy, Suspense } from 'react';

const ChatWindow = lazy(() => 
  import('./chat-window').then(m => ({ default: m.ChatWindow }))
);

// Uso com Suspense
{selectedChat ? (
  <Suspense fallback={<ChatWindowSkeleton />}>
    <ChatWindow {...props} />
  </Suspense>
) : null}
```

**Benefício:** O Dyte SDK só é carregado quando o usuário seleciona uma conversa, não quando a página de chat é aberta.

#### VideoCallDialog e CallDialog

```tsx
// src/features/chat/components/chat-window.tsx
const VideoCallDialog = lazy(() => 
  import('./video-call-dialog').then(m => ({ default: m.VideoCallDialog }))
);

const CallDialog = lazy(() => 
  import('./call-dialog').then(m => ({ default: m.CallDialog }))
);

// Uso com Suspense
<Suspense fallback={<MeetingSkeleton />}>
  <VideoCallDialog {...props} />
</Suspense>
```

**Benefício:** Os dialogs de chamada só são carregados quando o usuário inicia uma chamada.

#### CustomMeetingUI

```tsx
// src/features/chat/components/video-call-dialog.tsx
const CustomMeetingUI = lazy(() => 
  import('./custom-meeting-ui').then(m => ({ default: m.CustomMeetingUI }))
);

// Uso com Suspense
<Suspense fallback={<MeetingSkeleton />}>
  <CustomMeetingUI {...props} />
</Suspense>
```

**Benefício:** A UI customizada de reunião só é carregada quando a chamada está ativa.

### 2. Tree-Shaking de Imports do Dyte

Todos os imports do Dyte SDK foram otimizados para usar named imports e type imports quando possível:

#### ✅ Correto - Named Imports

```tsx
// Componentes que precisam do runtime
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { useDyteSelector } from "@dytesdk/react-web-core";
import { DyteParticipantTile } from "@dytesdk/react-ui-kit";
```

#### ✅ Correto - Type Imports

```tsx
// Hooks que só precisam do tipo
import type DyteClient from '@dytesdk/web-core';
import type { DyteClient } from '@dytesdk/web-core';
```

**Arquivos otimizados:**
- `use-transcription.ts` - Convertido para `import type`
- `use-recording.ts` - Já usa `import type`
- `use-screenshare.ts` - Já usa `import type`
- `use-adaptive-quality.ts` - Já usa `import type`
- `use-network-quality.ts` - Já usa `import type`
- `use-video-effects.ts` - Já usa `import type`

### 3. Dynamic Imports para Módulos Pesados

Módulos opcionais são carregados dinamicamente apenas quando necessários:

```tsx
// src/features/chat/hooks/use-video-effects.ts
const transformerModule = await import('@dytesdk/video-background-transformer');
// Só carrega quando o usuário ativa um efeito de vídeo
```

### 4. Barrel Exports Otimizados

Os barrel exports (`index.ts`) foram atualizados para suportar lazy loading:

```tsx
// src/features/chat/components/index.ts
// Lazy load heavy call components
export const CallDialog = lazy(() => 
  import('./call-dialog').then(m => ({ default: m.CallDialog }))
);

export const VideoCallDialog = lazy(() => 
  import('./video-call-dialog').then(m => ({ default: m.VideoCallDialog }))
);
```

## Estrutura de Carregamento

### Antes (Eager Loading)

```
Página /chat carrega
  ├── ChatLayout (eager)
  │   ├── ChatWindow (eager)
  │   │   ├── VideoCallDialog (eager) → Dyte SDK carregado
  │   │   ├── CallDialog (eager) → Dyte SDK carregado
  │   │   └── CustomMeetingUI (eager) → UI Kit carregado
  │   └── ChatSidebar (eager)
  └── Todos os hooks do Dyte (eager)
```

**Bundle inicial:** ~800KB+ (incluindo Dyte SDK)

### Depois (Lazy Loading)

```
Página /chat carrega
  ├── ChatLayout (eager)
  │   ├── ChatWindow (lazy) → Carregado apenas quando chat selecionado
  │   │   ├── VideoCallDialog (lazy) → Carregado apenas quando chamada iniciada
  │   │   │   └── CustomMeetingUI (lazy) → Carregado apenas quando chamada ativa
  │   │   └── CallDialog (lazy) → Carregado apenas quando chamada iniciada
  │   └── ChatSidebar (eager)
  └── Hooks do Dyte (lazy) → Carregados apenas quando necessários
```

**Bundle inicial:** ~600KB (sem Dyte SDK)
**Bundle sob demanda:** ~200KB (Dyte SDK + componentes)

## Métricas Esperadas

### Bundle Size

- **Redução inicial:** 20-30% menor no bundle principal
- **Code splitting:** Dyte SDK em chunk separado (~200KB)
- **Lazy chunks:** Carregados apenas quando necessário

### Performance

- **LCP (Largest Contentful Paint):** <2s na página `/chat` (mobile)
- **FCP (First Contentful Paint):** <1.5s na página `/chat`
- **Time to Interactive:** Redução de ~500ms-1s no carregamento inicial

### Memória

- **Uso inicial:** Redução de ~10-15MB quando chat está inativo
- **Carregamento sob demanda:** Memória alocada apenas quando chamada ativa

## Verificação

### Build Analysis

Para verificar o impacto das otimizações:

```bash
# Análise do bundle
npm run build -- --profile

# Ou com análise detalhada
npm run analyze
```

### Verificação Manual

1. **Network Tab (DevTools):**
   - Abrir página `/chat`
   - Verificar que `@dytesdk` não aparece nos requests iniciais
   - Selecionar uma conversa
   - Verificar que `ChatWindow` chunk é carregado
   - Iniciar uma chamada
   - Verificar que `VideoCallDialog` e `CustomMeetingUI` chunks são carregados

2. **Lighthouse:**
   - Executar Lighthouse na página `/chat`
   - Verificar métricas de performance
   - LCP deve ser <2s
   - Bundle size deve estar reduzido

## Componentes de Loading

### ChatWindowSkeleton

Skeleton usado durante o carregamento do `ChatWindow`:

```tsx
<div className="flex-1 flex flex-col">
  <Skeleton className="h-16 w-full" />
  <div className="flex-1 p-4 space-y-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
  <Skeleton className="h-20 w-full" />
</div>
```

### MeetingSkeleton

Skeleton usado durante o carregamento dos componentes de chamada (já existente em `meeting-skeleton.tsx`).

## Boas Práticas

### ✅ Fazer

1. **Sempre usar lazy loading** para componentes que importam o Dyte SDK
2. **Usar type imports** quando possível para tree-shaking
3. **Fornecer fallbacks apropriados** com Suspense
4. **Testar em dispositivos móveis** para verificar impacto real
5. **Monitorar bundle size** após cada mudança

### ❌ Evitar

1. **Não importar componentes de chamada eager** em páginas que não precisam
2. **Não usar default imports** quando named imports estão disponíveis
3. **Não esquecer Suspense** ao usar React.lazy
4. **Não carregar módulos pesados** antes de serem necessários

## Troubleshooting

### Problema: Componente não carrega

**Solução:** Verificar se o export está correto no arquivo:
```tsx
// ✅ Correto
export function VideoCallDialog() { ... }

// ❌ Incorreto (não funciona com lazy)
export default function VideoCallDialog() { ... }
```

### Problema: Bundle ainda grande

**Solução:** Verificar imports do Dyte:
```tsx
// ✅ Correto - Type import
import type DyteClient from '@dytesdk/web-core';

// ❌ Incorreto - Runtime import desnecessário
import DyteClient from '@dytesdk/web-core';
```

### Problema: Erro de SSR

**Solução:** Usar `next/dynamic` com `ssr: false` se necessário:
```tsx
import dynamic from 'next/dynamic';

const VideoCallDialog = dynamic(
  () => import('./video-call-dialog').then(m => ({ default: m.VideoCallDialog })),
  { ssr: false }
);
```

## Referências

- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Dyte SDK Documentation](https://docs.dyte.io/)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)

## Changelog

### 2024-01-XX - Implementação Inicial

- ✅ Lazy loading de `ChatWindow` em `chat-layout.tsx`
- ✅ Lazy loading de `VideoCallDialog` e `CallDialog` em `chat-window.tsx`
- ✅ Lazy loading de `CustomMeetingUI` em dialogs
- ✅ Otimização de imports do Dyte (type imports)
- ✅ Barrel exports atualizados para lazy loading
- ✅ Documentação criada

