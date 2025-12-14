<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# Arquitetura Sinesys 2.0 - AI-First

## Novas Capacidades de IA

O Sinesys 2.0 introduz uma arquitetura AI-First com as seguintes capacidades:

### Integração MCP (Model Context Protocol)

Server Actions são automaticamente expostas como ferramentas MCP para agentes de IA:

```typescript
// Usar ferramenta MCP
{
  "name": "listar_processos",
  "arguments": { "trt": "TRT15", "limite": 10 }
}
```

**Endpoint**: `GET/POST /api/mcp`

### Busca Semântica (RAG)

Busca inteligente usando embeddings de IA:

```typescript
import { buscaSemantica, obterContextoRAG } from '@/lib/ai';

// Buscar documentos semanticamente similares
const resultados = await buscaSemantica('audiência trabalhista RJ');

// Obter contexto para LLM
const { contexto, fontes } = await obterContextoRAG('pergunta', 2000);
```

### Safe Action Wrapper

Wrapper padronizado para Server Actions compatíveis com UI e MCP:

```typescript
import { authenticatedAction } from '@/lib/safe-action';

export const actionCriar = authenticatedAction(
  createSchema,
  async (data, { user }) => {
    // data validado, user injetado
    return resultado;
  }
);
```

### Arquivos RULES.md

Cada feature contém um `RULES.md` com regras de negócio para contexto de IA:

```
src/features/processos/RULES.md   # Regras de processos
src/features/partes/RULES.md      # Regras de partes
src/features/audiencias/RULES.md  # Regras de audiências
```

### Scripts de Manutenção

```bash
npm run mcp:check    # Verificar ferramentas registradas
npm run mcp:dev      # Servidor MCP de desenvolvimento
npm run ai:reindex   # Reindexar documentos para busca
```

### Referência Rápida

| Módulo | Localização | Descrição |
|--------|-------------|-----------|
| Safe Action | `@/lib/safe-action` | Wrapper de actions |
| AI/RAG | `@/lib/ai` | Embeddings e busca |
| MCP | `@/lib/mcp` | Servidor e ferramentas |
| API MCP | `/api/mcp` | Endpoint SSE |

---

# Sinesys - Instruções para Agentes de IA

## 🏗 Arquitetura do Sistema

### Princípios Arquiteturais

O Sinesys segue uma **Arquitetura Orientada a Features (Feature-Sliced Design)** adaptada para Next.js App Router:

1. **Colocação (Colocation)**: Todo código relacionado a uma feature vive junto em `src/features/{modulo}/`
2. **Isolamento**: Features são independentes e auto-contidas
3. **Escalabilidade**: Estrutura previsível facilita crescimento
4. **Manutenibilidade**: Mudanças em uma feature não afetam outras

### Estrutura de Pastas

```
src/
├── app/                      # Roteamento (páginas, layouts, API routes)
│   ├── (dashboard)/          # Rotas do dashboard
│   │   └── layout.tsx        # Layout com Sidebar fixa
│   └── api/                  # API REST
│
├── features/                 # 🆕 MÓDULOS DE NEGÓCIO
│   ├── partes/               # ✅ Migrado
│   ├── processos/            # ✅ Migrado
│   ├── contratos/            # ✅ Migrado
│   └── [outros]/             # 📋 Planejado
│
├── components/               # UI compartilhada
│   ├── ui/                   # Primitivos shadcn
│   ├── layout/               # Layout do sistema
│   └── shared/               # Padrões reutilizáveis
│
├── lib/                      # Infraestrutura
├── hooks/                    # Hooks globais
└── types/                    # Tipos compartilhados
```

### Anatomia de uma Feature

```
src/features/{modulo}/
├── components/           # Componentes React específicos
├── hooks/                # Hooks customizados
├── actions/              # Server Actions (Next.js 16)
├── domain.ts             # Entidades e regras de negócio
├── service.ts            # Casos de uso
├── repository.ts         # Acesso a dados (Supabase)
├── types.ts              # Tipagem específica
├── utils.ts              # Utilitários
└── index.ts              # Barrel exports
```

## 📘 Guia de Implementação

### Criar Nova Feature

1. **Criar estrutura**:

   ```bash
   mkdir -p src/features/nova-feature/{components,hooks,actions}
   touch src/features/nova-feature/{domain,service,repository,types,utils,index}.ts
   ```

2. **Definir domínio** (`domain.ts`):

   - Schemas Zod para validação
   - Tipos TypeScript
   - Constantes e enums
   - Regras de negócio puras

3. **Implementar repository** (`repository.ts`):

   - Acesso ao Supabase
   - CRUD operations
   - Queries com filtros

4. **Implementar service** (`service.ts`):

   - Casos de uso
   - Validação de entrada
   - Orquestração de lógica

5. **Criar Server Actions** (`actions/`):

   - Use `'use server'` directive
   - Retorne `{ success, data?, error? }`
   - Revalidate cache com `revalidatePath()`

6. **Criar componentes** (`components/`):

   - Use `'use client'` quando necessário
   - Importe de `@/features/nova-feature`
   - Siga padrões shadcn/ui

7. **Criar página** (`app/(dashboard)/nova-feature/page.tsx`):
   - Server Component por padrão
   - Use PageShell para layout
   - Importe componentes da feature

### Migrar Módulo Existente

1. **Identifique o escopo**: Quais arquivos pertencem ao módulo?
2. **Crie a estrutura** em `features/{modulo}/`
3. **Mova componentes** para `components/`
4. **Mova hooks** para `hooks/`
5. **Consolide tipos** em `types.ts` ou `domain.ts`
6. **Extraia lógica** para `service.ts` e `repository.ts`
7. **Atualize imports** nas páginas
8. **Delete arquivos antigos**
9. **Teste** a funcionalidade

## ⚙️ Convenções de Código

### Nomenclatura

- **Arquivos**: `kebab-case.ts` (ex: `cliente-form.tsx`)
- **Componentes**: `PascalCase` (ex: `ClienteForm`)
- **Funções**: `camelCase` (ex: `criarCliente`)
- **Tipos**: `PascalCase` (ex: `Cliente`, `CriarClienteParams`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `STATUS_LABELS`)

### Imports

```typescript
// ✅ Correto - importar de barrel exports
import { ClientesTable, actionListarClientes } from "@/features/partes";

// ❌ Evitar - imports diretos internos
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";
```

### Tipagem

```typescript
// ✅ Usar Zod para schemas de validação
import { z } from "zod";

const clienteSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().regex(/^\d{11}$/),
});

type Cliente = z.infer<typeof clienteSchema> & {
  id: number;
  created_at: string;
};
```

### Padrão de Resposta

```typescript
// Server Actions e API Routes devem retornar:
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## 📋 Status da Migração FSD

### Módulos Migrados ✅

- **Partes** - `features/partes/`
- **Processos** - `features/processos/`
- **Contratos** - `features/contratos/`
- **RH** - `features/rh/`
- **Expedientes** - `features/expedientes/` - Completo
  - Consolidação de duplicatas, tipos e serviços migrados
- **Captura** - `features/captura/` ✅ (Completo - Domain, service, repository, tipos, hooks)
- **Usuários** - `features/usuarios/` ✅ (Completo - Repository, actions, hooks, permissões)
- **Endereços** - `features/enderecos/` ✅ (Completo)
- **Acervo** - `features/acervo/` ✅ (Completo)

### Módulos em Migração 🔄

- **Audiências** - Em migração para `features/audiencias/`
- **Acordos/Condenações** - Em migração para `features/acordos/`
- **Financeiro** - Em migração para `features/financeiro/`

### Regras de Migração

1. **Módulos novos**: Implementar diretamente em `features/`
2. **Módulos existentes**: Migrar apenas quando houver necessidade de refatoração significativa
3. **Módulos legados**: Manter funcional, evitar grandes refatorações desnecessárias
4. **Não quebrar**: Garantir retrocompatibilidade durante migração

## 🛠️ Componentes e Padrões

### Layout do Dashboard

```tsx
// app/(dashboard)/layout.tsx
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset id="main-content">{children}</SidebarInset>
    </SidebarProvider>
  );
}
```

### PageShell

```tsx
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export default function MinhaPage() {
  return (
    <PageShell
      title="Título da Página"
      description="Descrição opcional"
      actions={<Button>Nova Ação</Button>}
    >
      {/* Conteúdo da página */}
    </PageShell>
  );
}
```

### DataTableShell (Superfície de Dados)

```tsx
import { DataTableShell } from "@/components/shared/data-table-shell";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { ResponsiveTable } from "@/components/ui/responsive-table";

function MinhaTabela() {
  return (
    <DataTableShell
      toolbar={<TableToolbar {...toolbarProps} />}
      pagination={<TablePagination {...paginationProps} />}
    >
      <ResponsiveTable data={data} columns={columns} />
    </DataTableShell>
  );
}
```

### DialogFormShell (Diálogos de Cadastro)

```tsx
import { DialogFormShell } from '@/components/shared/dialog-form-shell';

<DialogFormShell
  open={open}
  onOpenChange={onOpenChange}
  title="Novo Cliente"
  description="Preencha os dados do cliente"
  multiStep={{ current: 1, total: 5 }}
  footer={<FooterButtons />}
>
  {/* Conteúdo do formulário */}
</DialogFormShell>
```

Regras:
- ✅ Usar `DialogFormShell` para todos os diálogos de cadastro
- ✅ Background branco explícito (`bg-white dark:bg-gray-950`)
- ✅ Botão Cancelar no footer (sem botão X no header)
- ✅ Barra de progresso integrada para multi-step
- ✅ Grid responsivo: `grid-cols-1 md:grid-cols-2`
- ✅ Inputs com `w-full`


## 📚 Recursos Adicionais

- **README.md**: Visão geral do projeto e instruções de setup
- **docs/arquitetura-sistema.md**: Documentação completa da arquitetura
- **openspec/**: Especificações de mudanças e propostas
- **tests/**: Testes automatizados (unit, integration, e2e)

---

# Sinesys - Instruções para Agentes de IA

## Arquitetura do Projeto

### Feature-Sliced Design (FSD)

O Sinesys adota uma **Arquitetura Orientada a Features**, inspirada no Feature-Sliced Design. O código está organizado por funcionalidades completas de negócio, não por tipo técnico.

#### Estrutura de Features

```
src/features/{modulo}/
├── components/       # Componentes React específicos da feature
│   ├── {entidade}/  # Agrupados por entidade
│   └── shared/      # Compartilhados dentro da feature
├── hooks/           # Hooks customizados da feature
├── actions/         # Server Actions (Next.js 16)
├── domain.ts        # Entidades, Value Objects, regras puras
├── service.ts       # Casos de uso e lógica de negócio
├── repository.ts    # Acesso ao banco de dados
├── types.ts         # Tipagem específica
├── utils.ts         # Utilitários de formatação/validação
└── index.ts         # Barrel exports
```

#### Módulos Migrados para FSD

- ✅ **Partes** (`features/partes/`) - Completo
  - Clientes, Partes Contrárias, Terceiros, Representantes
- ✅ **Processos** (`features/processos/`) - Completo

  - Domain, Service, Repository pattern

- ✅ **Contratos** (`features/contratos/`) - Completo
  - Estrutura completa de feature
- ✅ **RH** (`features/rh/`) - Completo
  - Salários, Folhas de Pagamento, Integração Financeira
- ✅ **Expedientes** (`features/expedientes/`) - Completo
  - Consolidação de duplicatas, tipos e serviços migrados
- 🔄 **Outros módulos** - Em migração progressiva

#### Arquitetura Final FSD

O Sinesys utiliza **100% Feature-Sliced Design (FSD)**:

- ✅ **Todas as features** estão em `src/features/{modulo}/`
- ✅ **Infraestrutura** está em `src/lib/` (Supabase, Redis, etc.)
- ✅ **Hooks** estão em `src/features/{modulo}/hooks/` ou `src/hooks/` (globais)
- ✅ **Tipos** estão em `src/features/{modulo}/types.ts` ou `src/types/` (compartilhados)
- ✅ **Server Actions** estão em `src/features/{modulo}/actions/`

**Imports corretos:**
```typescript
// ✅ Features
import { ... } from '@/features/partes';
import { ... } from '@/features/processos';
import { ... } from '@/features/captura';

// ✅ Infraestrutura
import { createClient } from '@/lib/supabase/server';
import { getCached } from '@/lib/redis';

// ✅ Hooks
import { useTribunais } from '@/features/captura/hooks/use-tribunais';
import { useMinhasPermissoes } from '@/features/usuarios/hooks/use-minhas-permissoes';

// ❌ NUNCA usar
// (o backend legado foi removido; use sempre features ou lib)
import { ... } from '@/app/_lib/...'; // REMOVIDO
```

### Quando Criar Novo Código

#### ✅ SEMPRE use Features para:

- Novos módulos de negócio
- Funcionalidades de domínio específico
- Componentes com lógica acoplada ao domínio
- Casos de uso completos (CRUD + regras de negócio)

#### ✅ Use Componentes Compartilhados para:

- Componentes UI primitivos (botões, inputs)
- Padrões de layout (PageShell, DataTableShell)
- Componentes sem lógica de negócio
- Utilitários visuais reutilizáveis

#### ✅ Use Infraestrutura (`src/lib/`) para:

- Clientes Supabase (`@/lib/supabase/`)
- Cache Redis (`@/lib/redis`)
- Autenticação (`@/lib/auth/`)
- Utilitários de infraestrutura (`@/lib/utils/`)

### Exemplo de Importação

```typescript
// ✅ CORRETO - Importar de features
import { ClientesTableWrapper, actionListarClientes } from "@/features/partes";
import { listarProcessos, type Processo } from "@/features/processos";

// ✅ CORRETO - Importar componentes compartilhados
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

// ❌ PROIBIDO - Backend foi removido, use features
// (exemplo legado removido)
// ✅ Use features:
import { actionCriarCliente } from "@/features/partes";
```

---

## Padrões de Código

### 1. Páginas Next.js (App Router)

As páginas devem ser **minimalistas**, apenas compondo features:

```typescript
// src/app/(dashboard)/processos/page.tsx
import { PageShell } from "@/components/shared/page-shell";
import { ProcessosTableWrapper } from "@/features/processos";
import { actionListarProcessos } from "@/features/processos/actions/processos-actions";

export default async function ProcessosPage() {
  const result = await actionListarProcessos({ pagina: 1, limite: 50 });

  return (
    <PageShell title="Processos" description="Gerenciamento de processos">
      {result.success ? (
        <ProcessosTableWrapper initialData={result.data} />
      ) : (
        <div>Erro: {result.error}</div>
      )}
    </PageShell>
  );
}
```

### 2. Criar Nova Feature

#### Passo 1: Estrutura Base

```bash
mkdir -p src/features/nova-feature/{components,hooks,actions}
touch src/features/nova-feature/{domain,service,repository,types,utils,index}.ts
```

#### Passo 2: Domain (Entidades e Validação)

```typescript
// src/features/nova-feature/domain.ts
import { z } from "zod";

// Schema de validação
export const novaFeatureSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
});

// Tipo da entidade
export type NovaFeature = z.infer<typeof novaFeatureSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

// Constantes
export const STATUS_LABELS = {
  ativo: "Ativo",
  inativo: "Inativo",
} as const;
```

#### Passo 3: Repository (Acesso a Dados)

```typescript
// src/features/nova-feature/repository.ts
import { createClient } from "@/lib/supabase/server";
import type { NovaFeature } from "./domain";

export async function findAll(): Promise<NovaFeature[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nova_feature")
    .select("*")
    .order("nome");

  if (error) throw new Error(error.message);
  return data || [];
}
```

#### Passo 4: Service (Casos de Uso)

```typescript
// src/features/nova-feature/service.ts
import { novaFeatureSchema } from "./domain";
import * as repo from "./repository";

export async function listar() {
  return await repo.findAll();
}

export async function criar(params: unknown) {
  // Validar
  const validacao = novaFeatureSchema.safeParse(params);
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  // Persistir
  return await repo.create(validacao.data);
}
```

#### Passo 5: Server Actions

```typescript
// src/features/nova-feature/actions/nova-feature-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import * as service from "../service";

export async function actionListar() {
  try {
    const data = await service.listar();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriar(formData: FormData) {
  try {
    const params = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
    };

    const data = await service.criar(params);
    revalidatePath("/nova-feature");

    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

#### Passo 6: Barrel Export

```typescript
// src/features/nova-feature/index.ts
export type { NovaFeature } from "./domain";
export { novaFeatureSchema, STATUS_LABELS } from "./domain";
export { listar, criar } from "./service";
export { actionListar, actionCriar } from "./actions/nova-feature-actions";
```

---

## Convenções de Nomenclatura

### Arquivos

- **Features**: `kebab-case.ts` (ex: `clientes-table-wrapper.tsx`)
- **Componentes**: `kebab-case.tsx` (ex: `page-shell.tsx`)
- **Server Actions**: `{entidade}-actions.ts` (ex: `processos-actions.ts`)
- **Barrel exports**: Sempre `index.ts`

### Código

- **Variáveis/Funções**: `camelCase`
- **Tipos/Interfaces**: `PascalCase`
- **Componentes**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **SQL**: `snake_case`

### Server Actions

- Prefixo `action` obrigatório
- Verbo no infinitivo: `actionListar`, `actionCriar`, `actionAtualizar`

---

## Regras Importantes

### 1. Tipagem TypeScript

```typescript
// ✅ SEMPRE usar tipos explícitos
export async function listar(): Promise<Processo[]> { ... }

// ❌ NUNCA usar any
const dados: any = await fetch(...); // PROIBIDO

// ✅ Usar unknown e validar
const dados: unknown = await fetch(...);
const validacao = schema.safeParse(dados);
```

### 2. Validação com Zod

```typescript
// ✅ SEMPRE validar entrada
const schema = z.object({ nome: z.string() });
const result = schema.safeParse(input);

if (!result.success) {
  throw new Error(result.error.errors[0].message);
}
```

### 3. Responsividade

```typescript
// ✅ Usar componentes responsivos
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useViewport } from "@/hooks/use-viewport";

const { isMobile } = useViewport();
```

### 4. Componentes UI

```typescript
// ✅ Usar shadcn/ui quando possível
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ✅ Usar padrões Zattar
import { PageShell } from "@/components/shared/page-shell";
import { DataTableShell } from "@/components/shared/data-table-shell";
```

---

## Checklist para Novas Features

- [ ] Criar estrutura em `src/features/{modulo}/`
- [ ] Definir `domain.ts` com schemas Zod
- [ ] Implementar `repository.ts` com acesso a dados
- [ ] Implementar `service.ts` com lógica de negócio
- [ ] Criar `actions/*.ts` com Server Actions
- [ ] Criar componentes em `components/`
- [ ] Exportar via `index.ts` (barrel)
- [ ] Criar página em `app/(dashboard)/{modulo}/`
- [ ] Adicionar rota na sidebar (`components/layout/app-sidebar.tsx`)
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Validar tipagem TypeScript (sem `any`)
- [ ] Documentar casos de uso complexos

---

## Referências Rápidas

### Estrutura de Diretórios

```
src/
├── app/              # Rotas e páginas (minimalistas)
├── features/         # Módulos de negócio (FSD)
├── components/       # Componentes compartilhados
│   ├── ui/          # Primitivos shadcn
│   ├── layout/      # Layouts (sidebar, header)
│   └── shared/      # Padrões Zattar
├── lib/             # Infraestrutura
├── hooks/           # Hooks globais
└── types/           # Tipos compartilhados
```

### Imports Comuns

```typescript
// Features
import { ... } from '@/features/partes';
import { ... } from '@/features/processos';

// Componentes UI
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/page-shell';

// Hooks
import { useViewport } from '@/hooks/use-viewport';
import { useDebounce } from '@/hooks/use-debounce';

// Lib
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
```
