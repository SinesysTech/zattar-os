# Dashboard Module

Módulo autocontido de Dashboard seguindo a arquitetura modular do projeto Zattar Advogados.

## Arquitetura

Este módulo implementa uma **arquitetura modular autocontida** (microuniverso), onde toda a funcionalidade relacionada ao dashboard está organizada em uma única estrutura coesa seguindo **Clean Architecture**.

### Estrutura de Camadas

```
src/app/(dashboard)/dashboard/
├── 📄 index.ts              # Barrel export (API pública do módulo)
├── 📄 domain.ts             # Camada de Domínio (tipos, schemas, constantes)
├── 📄 service.ts            # Camada de Serviço (lógica de negócio)
├── 📄 utils.ts              # Utilitários (formatadores, helpers)
├── 📄 layout.tsx            # Layout do dashboard
├── 📄 page.tsx              # Página raiz (redirect para /geral)
│
├── 📁 repositories/         # Camada de Dados
│   ├── admin-metrics.ts
│   ├── audiencias-metrics.ts
│   ├── expedientes-metrics.ts
│   ├── financeiro-metrics.ts
│   ├── processos-metrics.ts
│   ├── produtividade-metrics.ts
│   ├── shared/
│   │   └── formatters.ts
│   └── index.ts
│
├── 📁 actions/              # Camada de Actions (Next.js Server Actions)
│   ├── dashboard-actions.ts
│   ├── metricas-actions.ts
│   ├── capturas-actions.ts
│   └── index.ts
│
├── 📁 hooks/                # Camada de Hooks (client-side data fetching)
│   ├── use-dashboard.ts
│   ├── use-dashboard-financeiro.ts
│   ├── use-widget-permissions.ts
│   └── index.ts
│
├── 📁 components/           # Camada de Componentes
│   ├── dashboard-tabs.tsx
│   ├── shared/
│   │   ├── metric-card.tsx
│   │   ├── dashboard-content.tsx
│   │   ├── domain-section.tsx
│   │   └── obrigacoes-recentes-card.tsx
│   ├── widgets/
│   │   ├── widget-wrapper.tsx
│   │   ├── stat-card.tsx
│   │   ├── widget-fluxo-caixa.tsx
│   │   ├── widget-despesas-categoria.tsx
│   │   ├── widget-processos-resumo.tsx
│   │   ├── widget-audiencias-proximas.tsx
│   │   ├── widget-expedientes-urgentes.tsx
│   │   └── widget-produtividade.tsx
│   └── index.ts
│
├── 📁 [page-modules]/       # Submódulos de Página
│   ├── geral/               # Dashboard Geral
│   ├── contratos/           # Dashboard de Contratos
│   ├── processos/           # Dashboard de Processos
│   ├── audiencias/          # Dashboard de Audiências
│   ├── expedientes/         # Dashboard de Expedientes
│   └── financeiro/          # Dashboard Financeiro
│
└── 📁 __tests__/            # Testes
    ├── components/
    └── e2e/
```

## Princípios da Arquitetura

### 1. Separação de Responsabilidades

Cada camada tem uma responsabilidade específica:

- **domain.ts**: Define tipos, interfaces, schemas Zod e constantes (sem lógica)
- **repositories/**: Acessa dados do banco de dados (Supabase)
- **service.ts**: Implementa regras de negócio e orquestra repositories
- **actions/**: Expõe funcionalidades via Server Actions do Next.js
- **hooks/**: Gerencia estado client-side e data fetching
- **components/**: Apresenta UI (client e server components)

### 2. Fluxo de Dados

```
UI (Components/Pages)
    ↓
Hooks (Client State)
    ↓
Actions (Server Boundary)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Supabase (Database)
```

### 3. Barrel Exports

Cada nível exporta sua API pública via `index.ts`, garantindo:
- Encapsulamento de implementação
- API clara e documentada
- Fácil refatoração interna

## Como Usar

### Importando do Módulo

**✅ CORRETO**: Sempre importe do barrel export principal:

```typescript
import {
  DashboardContent,
  useDashboard,
  actionObterDashboard
} from '@/app/(dashboard)/dashboard';

import type {
  DashboardData,
  DashboardUsuarioData
} from '@/app/(dashboard)/dashboard';
```

**❌ EVITE**: Importar de caminhos internos:

```typescript
// NÃO FAÇA ISSO
import { DashboardContent } from '@/app/(dashboard)/dashboard/components/shared/dashboard-content';
```

### Usando Hooks no Cliente

```typescript
'use client';

import { useDashboard } from '@/app/(dashboard)/dashboard';

export function MeuComponente() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return <DashboardView data={data} />;
}
```

### Usando Actions no Servidor

```typescript
'use server';

import { actionObterDashboard } from '@/app/(dashboard)/dashboard';

export async function carregarDashboard(usuarioId: number) {
  const resultado = await actionObterDashboard({ usuarioId });

  if (!resultado.success) {
    throw new Error(resultado.error);
  }

  return resultado.data;
}
```

### Acessando Repositórios (Internamente)

```typescript
// Dentro do módulo dashboard
import { buscarProcessosResumo } from './repositories';

export async function obterDadosProcessos() {
  return await buscarProcessosResumo(usuarioId);
}
```

## Convenções de Nomenclatura

### Arquivos e Diretórios
- `kebab-case` para nomes de arquivos e pastas
- Exemplos: `dashboard-tabs.tsx`, `use-dashboard.ts`

### Componentes
- `PascalCase` para componentes React
- Exemplos: `DashboardContent`, `MetricCard`, `WidgetFluxoCaixa`

### Funções
- `camelCase` para funções e métodos
- Prefixos consistentes:
  - `buscar*` para repository functions
  - `obter*` para service functions
  - `action*` para server actions
  - `use*` para hooks

### Tipos
- `PascalCase` para tipos e interfaces
- Sufixos descritivos:
  - `*Data` para dados principais
  - `*Resumo` para dados agregados
  - `*Input` para inputs de funções
  - `*Params` para parâmetros

## Extensão do Módulo

### Adicionando um Novo Widget

1. **Criar componente do widget**:
   ```typescript
   // components/widgets/widget-meu-novo.tsx
   export function WidgetMeuNovo() { ... }
   ```

2. **Exportar no barrel**:
   ```typescript
   // components/widgets/index.ts
   export * from './widget-meu-novo';
   ```

3. **Usar na página**:
   ```typescript
   // geral/page.tsx
   import { WidgetMeuNovo } from '../components';
   ```

### Adicionando Nova Métrica

1. **Definir tipo no domain**:
   ```typescript
   // domain.ts
   export interface MinhaNovaMetrica {
     total: number;
     detalhes: string;
   }
   ```

2. **Criar repository**:
   ```typescript
   // repositories/minha-metrica.ts
   export async function buscarMinhaMetrica(usuarioId: number) { ... }
   ```

3. **Integrar no service**:
   ```typescript
   // service.ts
   import { buscarMinhaMetrica } from './repositories';

   export async function obterDashboard(usuarioId: number) {
     const minhaMetrica = await buscarMinhaMetrica(usuarioId);
     // ...
   }
   ```

### Adicionando Nova Página Dashboard

1. **Criar pasta da página**:
   ```
   src/app/(dashboard)/dashboard/minha-pagina/
   ├── page.tsx
   └── components/
       └── ...
   ```

2. **Adicionar aba na navegação**:
   ```typescript
   // components/dashboard-tabs.tsx
   const tabs = [
     // ...
     { name: 'Minha Página', href: '/dashboard/minha-pagina' }
   ];
   ```

## Permissões e Autenticação

O módulo implementa verificação de permissões em múltiplas camadas:

### No Service Layer
```typescript
const temPermissao = await checkPermission(usuarioId, 'modulo:dashboard');
if (!temPermissao) {
  return DADOS_PADRAO;
}
```

### Nos Hooks
```typescript
const { canViewProcessos, canViewFinanceiro } = useWidgetPermissions();
```

### Nos Componentes
```typescript
{canViewProcessos && <WidgetProcessosResumo />}
```

## Performance e Cache

### Estratégia de Cache

```typescript
// domain.ts
export const DASHBOARD_CACHE_KEYS = {
  usuario: (id: number) => `dashboard:usuario:${id}`,
  admin: () => 'dashboard:admin',
} as const;

export const DASHBOARD_CACHE_TTL = {
  usuario: 300,  // 5 minutos
  admin: 600,    // 10 minutos
} as const;
```

### Revalidação

```typescript
// actions/dashboard-actions.ts
'use server';

export async function actionRefreshDashboard() {
  revalidatePath('/dashboard');
  return { success: true };
}
```

## Testes

### Estrutura de Testes

```
__tests__/
├── components/
│   └── dashboard.test.tsx     # Testes de componentes
└── e2e/
    └── dashboard.spec.ts      # Testes E2E
```

### Executando Testes

```bash
# Testes unitários
npm run test:dashboard

# Testes E2E
npm run test:e2e:dashboard
```

## Integração com MCP Tools

O módulo dashboard é totalmente integrado com o sistema MCP (Model Context Protocol):

```typescript
// lib/mcp/registries/dashboard-tools.ts
import { actionObterDashboard } from '@/app/(dashboard)/dashboard';

export const dashboardTools = [
  {
    name: 'obter_dashboard',
    description: 'Obtém dados do dashboard',
    handler: actionObterDashboard
  }
];
```

## Migração

Este módulo foi migrado de `src/features/dashboard/` para `src/app/(dashboard)/dashboard/` como parte da implementação da nova arquitetura modular.

**Referências antigas**: `@/features/dashboard`
**Referências novas**: `@/app/(dashboard)/dashboard`

## Dependências Externas

### Módulos do Projeto
- `@/lib/supabase/server` - Cliente Supabase
- `@/lib/auth/authorization` - Sistema de permissões
- `@/components/ui/*` - Componentes UI (shadcn/ui)
- `@/components/shared/*` - Componentes compartilhados
- `@/features/financeiro` - Integração com módulo financeiro

### Bibliotecas Externas
- `next` - Framework Next.js 16
- `react` - React 19
- `zod` - Validação de schemas
- `recharts` - Gráficos e visualizações

## Contribuindo

Ao adicionar funcionalidades ao dashboard:

1. ✅ Siga a estrutura de camadas
2. ✅ Use barrel exports
3. ✅ Implemente verificação de permissões
4. ✅ Adicione tipos no domain.ts
5. ✅ Documente com JSDoc
6. ✅ Escreva testes
7. ✅ Mantenha a coesão do módulo

## Referências

- [Guia de Desenvolvimento](../../../../docs/guia-desenvolvimento.md)
- [Diretrizes Estruturais](../../../../CLAUDE.md)
- [OpenSpec](../../../../openspec/AGENTS.md)
