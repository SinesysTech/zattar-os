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
- 🔄 **Outros módulos** - Em migração progressiva

#### Módulos Legados (Backend)

Módulos ainda não migrados permanecem em `backend/{modulo}/services/`:
- Audiências
- Expedientes
- Acordos/Condenações
- Financeiro
- RH
- Captura de dados PJE/TRT

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

#### ✅ Use Backend (Legado) para:
- Integrações externas (PJE/TRT, 2FAuth)
- Autenticação e autorização
- Utilitários de infraestrutura
- Módulos ainda não migrados

### Exemplo de Importação

```typescript
// ✅ CORRETO - Importar de features
import { ClientesTableWrapper, actionListarClientes } from '@/features/partes';
import { listarProcessos, type Processo } from '@/features/processos';

// ✅ CORRETO - Importar componentes compartilhados
import { PageShell } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';

// ❌ EVITAR - Importar diretamente de backend (exceto legado necessário)
import { criarCliente } from '@/backend/clientes/services/clientes/criar-cliente.service';
```

---

## Padrões de Código

### 1. Páginas Next.js (App Router)

As páginas devem ser **minimalistas**, apenas compondo features:

```typescript
// src/app/(dashboard)/processos/page.tsx
import { PageShell } from '@/components/shared/page-shell';
import { ProcessosTableWrapper } from '@/features/processos';
import { actionListarProcessos } from '@/features/processos/actions/processos-actions';

export default async function ProcessosPage() {
  const result = await actionListarProcessos({ pagina: 1, limite: 50 });

  return (
    <PageShell 
      title="Processos" 
      description="Gerenciamento de processos"
    >
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
import { z } from 'zod';

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
  ativo: 'Ativo',
  inativo: 'Inativo',
} as const;
```

#### Passo 3: Repository (Acesso a Dados)

```typescript
// src/features/nova-feature/repository.ts
import { createClient } from '@/lib/supabase/server';
import type { NovaFeature } from './domain';

export async function findAll(): Promise<NovaFeature[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('nova_feature')
    .select('*')
    .order('nome');

  if (error) throw new Error(error.message);
  return data || [];
}
```

#### Passo 4: Service (Casos de Uso)

```typescript
// src/features/nova-feature/service.ts
import { novaFeatureSchema } from './domain';
import * as repo from './repository';

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
'use server';

import { revalidatePath } from 'next/cache';
import * as service from '../service';

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
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
    };
    
    const data = await service.criar(params);
    revalidatePath('/nova-feature');
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

#### Passo 6: Barrel Export

```typescript
// src/features/nova-feature/index.ts
export type { NovaFeature } from './domain';
export { novaFeatureSchema, STATUS_LABELS } from './domain';
export { listar, criar } from './service';
export { actionListar, actionCriar } from './actions/nova-feature-actions';
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
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useViewport } from '@/hooks/use-viewport';

const { isMobile } = useViewport();
```

### 4. Componentes UI

```typescript
// ✅ Usar shadcn/ui quando possível
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ✅ Usar padrões Zattar
import { PageShell } from '@/components/shared/page-shell';
import { DataTableShell } from '@/components/shared/data-table-shell';
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
