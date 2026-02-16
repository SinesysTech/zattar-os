# Design Document: Correção da Integração Tarefas + To-Do

## 1. Visão Geral

Este documento detalha a solução técnica para corrigir a integração entre os módulos To-Do e Tarefas, removendo a visualização de quadro Kanban duplicada e mantendo apenas a visualização de lista/tabela.

### 1.1 Objetivos

1. Remover componentes de quadro Kanban de Tarefas
2. Manter apenas visualização de lista (DataTable)
3. Preservar funcionalidades enriquecidas do To-Do (subtarefas, comentários, anexos)
4. Corrigir espaçamento da paginação
5. Simplificar a arquitetura removendo código desnecessário

### 1.2 Não-Objetivos

- Modificar o módulo Kanban existente (`src/features/kanban/`)
- Criar integração entre Tarefas e Kanban
- Alterar a lógica de agregação de eventos virtuais

## 2. Arquitetura

### 2.1 Estrutura Atual (Problemática)

```
src/app/app/tarefas/
├── components/
│   ├── data-table.tsx          ✅ Manter (lista)
│   ├── task-board.tsx          ❌ REMOVER (Kanban duplicado)
│   ├── task-card.tsx           ❌ REMOVER (usado apenas no board)
│   ├── task-detail-sheet.tsx  ✅ Manter (detalhes)
│   ├── task-dialog.tsx         ✅ Manter (criação)
│   └── ...
├── tarefas-client.tsx          🔧 SIMPLIFICAR (remover lógica de viewMode)
├── store.ts                    🔧 SIMPLIFICAR (remover viewMode)
└── domain.ts                   🔧 AJUSTAR (remover position)
```

### 2.2 Estrutura Proposta (Corrigida)

```
src/app/app/tarefas/
├── components/
│   ├── data-table.tsx          ✅ Lista única (sem ViewModePopover)
│   ├── task-detail-sheet.tsx  ✅ Detalhes completos
│   ├── task-dialog.tsx         ✅ Criação de tarefas
│   ├── columns.tsx             ✅ Definição de colunas
│   ├── data-table-*.tsx        ✅ Componentes auxiliares
│   └── ...
├── page.tsx                    ✅ Server component (busca dados)
├── store.ts                    🔧 Sem viewMode
└── domain.ts                   🔧 Sem position
```

### 2.3 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      page.tsx (Server)                      │
│  - Busca tarefas + eventos virtuais                        │
│  - Passa dados para TarefasClient                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TarefasClient (Client)                    │
│  - Renderiza apenas DataTable                              │
│  - Gerencia dialogs globais (TaskDetailSheet, TaskDialog)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DataTable                              │
│  - Renderiza tabela com filtros                            │
│  - Paginação com espaçamento correto                       │
│  - Sem ViewModePopover                                     │
└─────────────────────────────────────────────────────────────┘
```

## 3. Componentes

### 3.1 Componentes a Remover

#### 3.1.1 TaskBoard (`task-board.tsx`)
**Motivo**: Duplica funcionalidade do módulo Kanban existente.

**Dependências a remover**:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

#### 3.1.2 TaskCard (`task-card.tsx`)
**Motivo**: Usado apenas pelo TaskBoard.

#### 3.1.3 ViewModePopover (uso em Tarefas)
**Motivo**: Não há mais alternância entre lista e quadro.

**Nota**: O componente `ViewModePopover` em `src/components/shared/` deve ser mantido, pois é usado por outros módulos (Audiências, Expedientes, etc.).

### 3.2 Componentes a Modificar

#### 3.2.1 TarefasClient (`tarefas-client.tsx`)

**Antes**:
```tsx
export function TarefasClient({ data }: TarefasClientProps) {
  const { viewMode, setViewMode, ... } = useTarefaStore();
  
  return (
    <div>
      {viewMode === "lista" ? (
        <DataTable ... />
      ) : (
        <>
          <DataTableToolbar ... viewModeSlot={<ViewModePopover />} />
          <TaskBoard />
        </>
      )}
      <TaskDetailSheet />
      <TaskDialog />
    </div>
  );
}
```

**Depois**:
```tsx
export function TarefasClient({ data }: TarefasClientProps) {
  const { setTarefas, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();
  
  React.useEffect(() => {
    setTarefas(data);
  }, [data, setTarefas]);
  
  return (
    <>
      <DataTable data={data} columns={columns} />
      <TaskDetailSheet />
      <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
```

**Mudanças**:
- Remove lógica de `viewMode`
- Remove renderização condicional
- Renderiza apenas `DataTable`
- Mantém dialogs globais

#### 3.2.2 DataTable (`data-table.tsx`)

**Antes**:
```tsx
<DataTableToolbar
  ...
  viewModeSlot={
    <ViewModePopover
      value={viewMode}
      onValueChange={setViewMode}
      options={TASK_VIEW_OPTIONS}
    />
  }
/>
```

**Depois**:
```tsx
<DataTableToolbar
  table={table}
  title="Tarefas"
  actionButton={{
    label: "Nova tarefa",
    onClick: () => setCreateDialogOpen(true),
  }}
  filtersSlot={<>...</>}
/>
```

**Mudanças**:
- Remove `viewModeSlot`
- Remove `TASK_VIEW_OPTIONS`
- Remove imports de `ViewModePopover`, `List`, `LayoutGrid`
- Remove `viewMode` e `setViewMode` do store

#### 3.2.3 Store (`store.ts`)

**Antes**:
```typescript
interface TarefaStore {
  tarefas: TarefaDisplayItem[];
  selectedTarefaId: string | null;
  isTarefaSheetOpen: boolean;
  isCreateDialogOpen: boolean;
  viewMode: "lista" | "quadro"; // ❌ REMOVER
  
  setViewMode: (mode: "lista" | "quadro") => void; // ❌ REMOVER
  // ...
}
```

**Depois**:
```typescript
interface TarefaStore {
  tarefas: TarefaDisplayItem[];
  selectedTarefaId: string | null;
  isTarefaSheetOpen: boolean;
  isCreateDialogOpen: boolean;
  
  setTarefas: (tarefas: TarefaDisplayItem[]) => void;
  upsertTarefa: (tarefa: TarefaDisplayItem) => void;
  removeTarefa: (id: string) => void;
  setSelectedTarefaId: (id: string | null) => void;
  setTarefaSheetOpen: (isOpen: boolean) => void;
  setCreateDialogOpen: (isOpen: boolean) => void;
}
```

**Mudanças**:
- Remove `viewMode` do estado
- Remove `setViewMode` das actions
- Mantém todas as outras funcionalidades

#### 3.2.4 Domain (`domain.ts`)

**Antes**:
```typescript
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  label: taskLabelSchema,
  priority: taskPrioritySchema,
  // ...
  position: z.number().default(0), // ❌ Usado apenas em Kanban
});
```

**Depois**:
```typescript
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  label: taskLabelSchema,
  priority: taskPrioritySchema,
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  starred: z.boolean().default(false),
  assignees: z.array(taskAssigneeSchema).default([]),
  assignedTo: z.array(z.string()).default([]),
  subTasks: z.array(taskSubTaskSchema).default([]),
  comments: z.array(taskCommentSchema).default([]),
  files: z.array(taskFileSchema).default([]),
  source: z.string().optional().nullable(),
  sourceEntityId: z.string().optional().nullable(),
  // position removido
});
```

**Mudanças**:
- Remove campo `position` (usado apenas em Kanban)
- Remove `position` de `createTaskSchema`
- Remove `taskPositionsSchema` (usado para reordenação em Kanban)
- Remove `TaskPositionsInput` type

### 3.3 Componentes a Manter (Sem Alterações)

- `task-detail-sheet.tsx` - Detalhes completos da tarefa
- `task-dialog.tsx` - Dialog de criação
- `columns.tsx` - Definição de colunas da tabela
- `data-table-pagination.tsx` - Paginação (já corrigida com `py-4`)
- `data-table-faceted-filter.tsx` - Filtros
- `data-table-column-header.tsx` - Headers ordenáveis
- `data-table-row-actions.tsx` - Ações por linha
- `data-table-view-options.tsx` - Visibilidade de colunas

## 4. Service Layer

### 4.1 Service (`service.ts`)

**Modificações**:

#### 4.1.1 Remover função `reorderTasks`

**Antes**:
```typescript
export async function reorderTasks(
  usuarioId: number, 
  input: TaskPositionsInput
): Promise<Result<void>> {
  const val = validate<TaskPositionsInput>(taskPositionsSchema, input);
  if (!val.success) return err(val.error);
  return repo.reorderTasks(usuarioId, val.data);
}
```

**Depois**: Remover completamente (não é necessário sem Kanban).

#### 4.1.2 Ajustar `eventoToTarefaDisplay`

**Antes**:
```typescript
function eventoToTarefaDisplay(evento: UnifiedEventItem): TarefaDisplayItem {
  return {
    // ...
    position: 0, // ❌ REMOVER
    // ...
  };
}
```

**Depois**:
```typescript
function eventoToTarefaDisplay(evento: UnifiedEventItem): TarefaDisplayItem {
  return {
    id: evento.id,
    title: evento.titulo,
    status: mapSourceStatusToTarefaStatus(evento.source, evento.statusOrigem),
    label: SOURCE_TO_LABEL[evento.source],
    priority: calcularPrioridade(evento.dataVencimento, evento.prazoVencido),
    description: undefined,
    dueDate: evento.dataVencimento,
    reminderDate: null,
    starred: false,
    assignees: [],
    assignedTo: [],
    subTasks: [],
    comments: [],
    files: [],
    source: evento.source,
    sourceEntityId: String(evento.sourceEntityId),
    url: evento.url,
    isVirtual: true,
    prazoVencido: evento.prazoVencido,
    responsavelNome: evento.responsavelNome,
    date: evento.dataVencimento,
  };
}
```

### 4.2 Repository (`repository.ts`)

**Modificações**:

#### 4.2.1 Remover função `reorderTasks`

**Antes**:
```typescript
export async function reorderTasks(
  usuarioId: number,
  input: TaskPositionsInput
): Promise<Result<void>> {
  // ... implementação
}
```

**Depois**: Remover completamente.

#### 4.2.2 Ajustar `createTask`

**Antes**:
```typescript
export async function createTask(
  usuarioId: number,
  input: CreateTaskInput
): Promise<Result<Task>> {
  // Calcula position automaticamente
  const maxPosition = await getMaxPosition(usuarioId);
  const position = maxPosition + 1;
  
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, position, user_id: usuarioId })
    // ...
}
```

**Depois**:
```typescript
export async function createTask(
  usuarioId: number,
  input: CreateTaskInput
): Promise<Result<Task>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: usuarioId })
    .select()
    .single();
  
  if (error) {
    return err(appError("DATABASE_ERROR", error.message));
  }
  
  return ok(data);
}
```

**Mudanças**:
- Remove cálculo de `position`
- Remove chamada a `getMaxPosition`

## 5. Actions

### 5.1 Actions a Remover

#### 5.1.1 `actionReordenarTarefas`

**Arquivo**: `actions/tarefas-actions.ts`

**Antes**:
```typescript
export const actionReordenarTarefas = authenticatedAction(
  taskPositionsSchema,
  async (data, { user }) => {
    const result = await service.reorderTasks(user.id, data);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    revalidatePath("/tarefas");
    return { success: true };
  }
);
```

**Depois**: Remover completamente.

### 5.2 Actions a Manter

- `actionListarTarefas`
- `actionBuscarTarefa`
- `actionCriarTarefa` (ajustar para não passar `position`)
- `actionAtualizarTarefa`
- `actionRemoverTarefa`
- `actionCriarSubtarefa`
- `actionAtualizarSubtarefa`
- `actionRemoverSubtarefa`
- `actionAdicionarComentario`
- `actionRemoverComentario`
- `actionAdicionarAnexo`
- `actionRemoverAnexo`

## 6. MCP Tools

### 6.1 Ajustes em `tarefas-tools.ts`

**Modificações**:

#### 6.1.1 Tool `criar_tarefa`

**Antes**:
```typescript
const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
  title: args.title,
  status: args.status ?? 'todo',
  label: args.label ?? 'feature',
  priority: args.priority ?? 'medium',
  position: 0, // ❌ REMOVER
});
```

**Depois**:
```typescript
const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
  title: args.title,
  status: args.status ?? 'todo',
  label: args.label ?? 'feature',
  priority: args.priority ?? 'medium',
});
```

#### 6.1.2 Tool `agendar_reuniao_zoom`

**Antes**:
```typescript
const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
  title: descricaoCompleta,
  status: 'todo',
  label: 'feature',
  priority: 'high',
  position: 0, // ❌ REMOVER
});
```

**Depois**:
```typescript
const result = await criarTarefa(SYSTEM_AGENT_USER_ID, {
  title: descricaoCompleta,
  status: 'todo',
  label: 'feature',
  priority: 'high',
});
```

## 7. Database Schema

### 7.1 Migração (Opcional)

Se o campo `position` existe na tabela `tasks`, pode ser mantido para compatibilidade com o módulo Kanban (caso ele use a mesma tabela) ou removido se for exclusivo de Tarefas.

**Recomendação**: Manter o campo no banco, mas não usá-lo em Tarefas. Se o Kanban usar a mesma tabela, ele pode precisar desse campo.

**Verificar**:
```sql
-- Verificar se Kanban usa a mesma tabela
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'position' 
  AND table_schema = 'public';
```

**Se for seguro remover**:
```sql
-- Migration: remover coluna position de tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS position;
```

## 8. UI/UX

### 8.1 Layout Final

```
┌─────────────────────────────────────────────────────────────┐
│                         PageShell                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    DataTableToolbar                   │  │
│  │  [Tarefas] [Filtros...] [Nova Tarefa]               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      DataTable                        │  │
│  │  ┌─────────┬──────────┬──────────┬──────────┐        │  │
│  │  │ Título  │ Status   │ Prior.   │ Tipo     │        │  │
│  │  ├─────────┼──────────┼──────────┼──────────┤        │  │
│  │  │ Task 1  │ Todo     │ High     │ Feature  │        │  │
│  │  │ Task 2  │ Done     │ Medium   │ Bug      │        │  │
│  │  │ ...     │ ...      │ ...      │ ...      │        │  │
│  │  └─────────┴──────────┴──────────┴──────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  DataTablePagination                  │  │
│  │  [10 de 50 selecionadas] [< 1 2 3 >] [25 por pág]   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Espaçamento da Paginação

**Já corrigido em**: `data-table-pagination.tsx`

```tsx
<div className="flex items-center justify-between px-2 py-4">
  {/* ↑ py-4 adiciona espaçamento vertical adequado */}
  ...
</div>
```

## 9. Testes

### 9.1 Testes a Remover

- Testes de `TaskBoard`
- Testes de `TaskCard`
- Testes de reordenação (drag-and-drop)
- Testes de `actionReordenarTarefas`

### 9.2 Testes a Manter/Atualizar

- Testes de `DataTable`
- Testes de `TaskDetailSheet`
- Testes de `TaskDialog`
- Testes de service layer (remover testes de `reorderTasks`)
- Testes de repository (remover testes de `reorderTasks`)
- Testes de actions (remover testes de `actionReordenarTarefas`)

### 9.3 Novos Testes

Não são necessários novos testes, apenas ajustar os existentes para refletir a remoção de funcionalidades.

## 10. Documentação

### 10.1 Atualizar README (se existir)

Documentar claramente:
- Tarefas é uma visualização de **lista/tabela**
- Para quadro Kanban, usar o módulo `/kanban`
- Funcionalidades disponíveis (subtarefas, comentários, anexos)

### 10.2 Comentários no Código

Adicionar comentários explicativos:

```typescript
/**
 * Módulo de Tarefas - Visualização de Lista
 * 
 * Este módulo fornece uma visualização de lista/tabela para:
 * - Tarefas manuais criadas pelo usuário
 * - Eventos virtuais do sistema (audiências, expedientes, perícias, obrigações)
 * 
 * IMPORTANTE: Para visualização em quadro Kanban, use o módulo /kanban
 * 
 * Funcionalidades:
 * - Filtros por status, prioridade, tipo
 * - Ordenação por colunas
 * - Paginação
 * - Detalhes completos (subtarefas, comentários, anexos)
 * - Criação de tarefas manuais
 */
```

## 11. Plano de Rollout

### 11.1 Fase 1: Preparação
1. Criar branch `fix/tarefas-remove-kanban`
2. Revisar código atual
3. Identificar todas as dependências

### 11.2 Fase 2: Remoção
1. Remover `TaskBoard` e `TaskCard`
2. Remover lógica de `viewMode` do store
3. Remover `position` do domain
4. Remover `reorderTasks` do service/repository/actions

### 11.3 Fase 3: Simplificação
1. Simplificar `TarefasClient`
2. Simplificar `DataTable`
3. Ajustar MCP tools

### 11.4 Fase 4: Testes
1. Executar testes unitários
2. Executar testes de integração
3. Testar manualmente no navegador

### 11.5 Fase 5: Deploy
1. Code review
2. Merge para main
3. Deploy para produção
4. Monitorar erros

## 12. Riscos e Mitigações

### 12.1 Risco: Usuários esperando visualização Kanban

**Probabilidade**: Média  
**Impacto**: Baixo

**Mitigação**:
- Adicionar link/botão "Ver em Kanban" que redireciona para `/kanban`
- Documentar claramente na UI
- Adicionar tooltip explicativo

### 12.2 Risco: Quebra de funcionalidades existentes

**Probabilidade**: Baixa  
**Impacto**: Alto

**Mitigação**:
- Testes completos antes do deploy
- Code review rigoroso
- Deploy gradual (feature flag se necessário)

### 12.3 Risco: Confusão entre Tarefas e Kanban

**Probabilidade**: Média  
**Impacto**: Baixo

**Mitigação**:
- Nomes claros na sidebar
- Ícones diferentes
- Descrições explicativas

## 13. Métricas de Sucesso

- ✅ Código de Kanban removido de Tarefas
- ✅ Apenas visualização de lista funcional
- ✅ Paginação com espaçamento correto
- ✅ Todos os testes passando
- ✅ Sem erros de tipo TypeScript
- ✅ Build bem-sucedido
- ✅ Funcionalidades de To-Do preservadas (subtarefas, comentários, anexos)

## 14. Referências

- Módulo Kanban: `src/features/kanban/`
- Padrão DataShell: `src/components/shared/data-shell/`
- Event Aggregation: `src/lib/event-aggregation/`
- Design System: `.kiro/steering/design-system-protocols.md`
