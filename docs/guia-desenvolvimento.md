# Guia de Desenvolvimento

## 📋 Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Convenções de Código](#convenções-de-código)
- [Criando Novas Features](#criando-novas-features)
- [Trabalhando com Componentes](#trabalhando-com-componentes)
- [API e Server Actions](#api-e-server-actions)
- [Testes](#testes)
- [Git Workflow](#git-workflow)

## 📁 Estrutura do Projeto

```
sinesys/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Rotas protegidas
│   ├── api/                  # API Routes
│   └── actions/              # Server Actions
├── src/
│   ├── features/             # Módulos de negócio (Feature-Sliced)
│   ├── components/           # Componentes reutilizáveis
│   ├── lib/                  # Bibliotecas e utils
│   └── hooks/                # React Hooks customizados
├── backend/                  # Código legado (em migração)
├── supabase/                 # Banco de dados
│   ├── migrations/           # Migrações SQL
│   └── schemas/              # Schemas declarativos
├── types/                    # Tipos TypeScript compartilhados
└── docs/                     # Documentação
```

Para detalhes completos, veja: **[Estrutura de Diretórios](./estrutura-diretorios.md)**

## 🎨 Convenções de Código

### Nomenclatura

```typescript
// ✅ Correto
// Arquivos: kebab-case
cliente - form.tsx;
processo - service.ts;

// Componentes: PascalCase
export function ClienteForm() {}

// Funções: camelCase
export function criarCliente() {}

// Tipos/Interfaces: PascalCase
export type Cliente = {};

// Constantes: UPPER_SNAKE_CASE
export const STATUS_ATIVO = "ativo";
```

### Imports

```typescript
// ✅ Correto - Importar de barrel exports
import { ClientesTable, actionListarClientes } from "@/features/partes";

// ❌ Evitar - Imports diretos internos
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";
```

### Tipagem

```typescript
// ✅ SEMPRE tipar explicitamente
function buscarCliente(id: number): Promise<Cliente | null> {
  // ...
}

// ❌ NUNCA usar `any`
function buscarCliente(id: any): any {
  // ❌
  // ...
}
```

Para mais detalhes: **[Padrões de Código](./padroes-codigo.md)**

## 🆕 Criando Novas Features

### 1. Estrutura Base

```bash
# Criar diretórios
mkdir -p src/features/nova-feature/{components,hooks,actions}

# Criar arquivos
touch src/features/nova-feature/{domain,service,repository,types,utils,index}.ts
```

### 2. Implementar Camadas

**domain.ts** - Entidades e Validação:

```typescript
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
};
```

**repository.ts** - Acesso a Dados:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { NovaFeature } from "./domain";

export async function findAll(): Promise<NovaFeature[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("nova_feature").select("*");

  if (error) throw new Error(error.message);
  return data || [];
}
```

**service.ts** - Casos de Uso:

```typescript
import { novaFeatureSchema } from "./domain";
import * as repo from "./repository";

export async function listar() {
  return await repo.findAll();
}

export async function criar(params: unknown) {
  const validacao = novaFeatureSchema.safeParse(params);
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }
  return await repo.create(validacao.data);
}
```

**actions/nova-feature-actions.ts** - Server Actions:

```typescript
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
```

**index.ts** - Barrel Export:

```typescript
export type { NovaFeature } from "./domain";
export { novaFeatureSchema } from "./domain";
export { listar, criar } from "./service";
export { actionListar, actionCriar } from "./actions/nova-feature-actions";
```

Para guia completo: **[Criando Features](./criando-features.md)**

## 🧩 Trabalhando com Componentes

### Componentes de UI (shadcn/ui)

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MeuComponente() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Ação</Button>
      </CardContent>
    </Card>
  );
}
```

### Padrões de Layout

```typescript
import { PageShell } from "@/components/shared/page-shell";
import { DataTableShell } from "@/components/shared/data-table-shell";

export default function MinhaPage() {
  return (
    <PageShell
      title="Título da Página"
      description="Descrição"
      actions={<Button>Nova Ação</Button>}
    >
      <DataTableShell>{/* Conteúdo */}</DataTableShell>
    </PageShell>
  );
}
```

Veja mais: **[Componentes Reutilizáveis](./componentes-reutilizaveis.md)**

## 🔌 API e Server Actions

### Criando API Routes

```typescript
// app/api/clientes/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Server Actions (Preferido)

```typescript
"use server";

export async function actionCriarCliente(formData: FormData) {
  // Validação
  // Lógica de negócio
  // Revalidação
  revalidatePath("/clientes");

  return { success: true, data };
}
```

Documentação completa: **[API e Endpoints](./api-documentacao.md)**

## 🧪 Testes

### Testes Unitários

```typescript
import { describe, it, expect } from "vitest";
import { criarCliente } from "./service";

describe("ClienteService", () => {
  it("deve criar um cliente válido", async () => {
    const resultado = await criarCliente({
      nome: "João Silva",
      cpf: "12345678900",
    });

    expect(resultado.success).toBe(true);
  });
});
```

### Testes E2E

```typescript
import { test, expect } from "@playwright/test";

test("deve listar clientes", async ({ page }) => {
  await page.goto("/clientes");
  await expect(page.locator("h1")).toContainText("Clientes");
});
```

Executar testes:

```bash
pnpm test        # Unitários
pnpm test:e2e    # End-to-end
```

## 🔀 Git Workflow

### Branches

```bash
# Features
git checkout -b feature/nova-funcionalidade

# Bugfixes
git checkout -b fix/correcao-bug

# Hotfixes
git checkout -b hotfix/correcao-urgente
```

### Commits (Conventional Commits)

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Exemplos
feat(clientes): adicionar filtro por status
fix(processos): corrigir validação de CPF
docs(readme): atualizar guia de instalação
refactor(audiencias): migrar para nova arquitetura
```

### Pull Requests

1. Crie branch a partir de `develop`
2. Faça commits atômicos
3. Execute testes: `pnpm test && pnpm test:e2e`
4. Crie PR para `develop`
5. Aguarde code review
6. Merge após aprovação

## 📚 Recursos Adicionais

- **[Arquitetura Completa](./arquitetura-sistema.md)**
- **[Sistema de Cache Redis](./cache-redis.md)**
- **[Guia de Deploy](./deploy.md)**
- **[Troubleshooting](./troubleshooting.md)**
- **[AGENTS.md](../AGENTS.md)** - Instruções para IA

## 💡 Dicas

- Use `pnpm dev:turbo` para desenvolvimento mais rápido
- Execute `pnpm lint` antes de commit
- Configure extensões do VS Code recomendadas
- Consulte `openspec/` para propostas de mudanças
