# Design Document: Unificação Tarefas + Kanban

## 1. Visão Geral

Unificar os módulos Tarefas e Kanban em um único módulo com duas visualizações alternáveis.

### 1.1 Objetivos

1. Mesclar funcionalidades de Tarefas + Kanban
2. Alternância via `ViewModePopover` (lista/quadro)
3. Manter eventos virtuais (audiências, expedientes, etc.)
4. Suportar quadros personalizados
5. Código limpo, sem retrocompatibilidade

### 1.2 Arquitetura Final

```
src/app/app/tarefas/
├── components/
│   ├── data-table.tsx          # Lista (atual)
│   ├── task-board.tsx          # Quadro (do Kanban)
│   ├── task-card.tsx           # Card (do Kanban)
│   ├── task-detail-sheet.tsx  # Detalhes (atual)
│   ├── task-dialog.tsx         # Criação (atual)
│   ├── quadro-selector.tsx    # Seletor de quadro (do Kanban)
│   └── ...
├── tarefas-client.tsx          # Orquestrador
├── store.ts                    # Estado unificado
├── domain.ts                   # Schemas unificados
├── service.ts                  # Lógica unificada
├── repository.ts               # Data access unificado
└── actions/                    # Server actions
```


## 2. Domain Unificado

### 2.1 Schema Principal

Mesclar `taskSchema` (Tarefas) + `kanbanTaskSchema` (Kanban):

```typescript
export const tarefaSchema = z.object({
  // Core (de ambos)
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["backlog", "todo", "in progress", "done", "canceled"]),
  priority: z.enum(["low", "medium", "high"]),
  label: z.enum(["bug", "feature", "documentation", "audiencia", "expediente", "pericia", "obrigacao"]),
  
  // Detalhes (de Tarefas)
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  starred: z.boolean().default(false),
  
  // Responsáveis (unificado)
  assignees: z.array(taskAssigneeSchema).default([]),
  
  // Sub-entidades (de Tarefas)
  subTasks: z.array(taskSubTaskSchema).default([]),
  comments: z.array(taskCommentSchema).default([]),
  files: z.array(taskFileSchema).default([]),
  
  // Kanban
  position: z.number().default(0),
  quadroId: z.string().optional().nullable(), // null = quadro sistema
  
  // Eventos virtuais
  source: z.string().optional().nullable(),
  sourceEntityId: z.string().optional().nullable(),
});
```

### 2.2 Quadros

```typescript
export const quadroSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  tipo: z.enum(["sistema", "custom"]),
  source: z.enum(["expedientes", "audiencias", "obrigacoes"]).nullable(),
  icone: z.string().optional(),
  ordem: z.number(),
});

export type Quadro = z.infer<typeof quadroSchema>;
```

**Quadros Sistema** (constantes):
- Expedientes
- Audiências  
- Obrigações

**Quadros Custom**: Criados pelo usuário


## 3. Store Unificado

```typescript
interface TarefaStore {
  // Visualização
  viewMode: "lista" | "quadro";
  setViewMode: (mode: "lista" | "quadro") => void;
  
  // Quadros
  quadros: Quadro[];
  selectedQuadroId: string | null; // null = Sistema (todas as tarefas)
  setQuadros: (quadros: Quadro[]) => void;
  setSelectedQuadroId: (id: string | null) => void;
  
  // Tarefas
  tarefas: TarefaDisplayItem[];
  setTarefas: (tarefas: TarefaDisplayItem[]) => void;
  upsertTarefa: (tarefa: TarefaDisplayItem) => void;
  removeTarefa: (id: string) => void;
  
  // Dialogs
  selectedTarefaId: string | null;
  isTarefaSheetOpen: boolean;
  isCreateDialogOpen: boolean;
  setSelectedTarefaId: (id: string | null) => void;
  setTarefaSheetOpen: (isOpen: boolean) => void;
  setCreateDialogOpen: (isOpen: boolean) => void;
}
```

**Comportamento**:
- `viewMode` persiste durante a sessão
- `selectedQuadroId = null` → Quadro Sistema (todas as tarefas + eventos)
- `selectedQuadroId = "uuid"` → Quadro custom específico


## 4. Componentes

### 4.1 TarefasClient (Orquestrador)

```typescript
export function TarefasClient({ data, quadros }: Props) {
  const { viewMode, selectedQuadroId, setQuadros, setTarefas } = useTarefaStore();
  
  React.useEffect(() => {
    setTarefas(data);
    setQuadros(quadros);
  }, [data, quadros]);
  
  return (
    <>
      {viewMode === "lista" ? (
        <DataTable data={data} columns={columns} />
      ) : (
        <TaskBoard quadroId={selectedQuadroId} />
      )}
      
      <TaskDetailSheet />
      <TaskDialog />
    </>
  );
}
```

### 4.2 DataTable (Lista)

**Mantido do módulo Tarefas atual**:
- Toolbar com filtros
- `ViewModePopover` (lista/quadro)
- Sem `QuadroSelector` (só aparece em modo quadro)
- Paginação
- Clique na linha → `TaskDetailSheet`

### 4.3 TaskBoard (Quadro)

**Adaptado do módulo Kanban**:
- Toolbar com `ViewModePopover` + `QuadroSelector`
- Colunas por status (Backlog, To Do, In Progress, Done, Canceled)
- Drag-and-drop entre colunas (muda status)
- Drag-and-drop dentro da coluna (reordena)
- Eventos virtuais aparecem mas não são arrastáveis

```typescript
export function TaskBoard({ quadroId }: { quadroId: string | null }) {
  const { tarefas } = useTarefaStore();
  
  // Filtrar tarefas do quadro selecionado
  const tarefasFiltradas = quadroId 
    ? tarefas.filter(t => t.quadroId === quadroId)
    : tarefas; // null = todas
  
  // Agrupar por status
  const tarefasByStatus = groupByStatus(tarefasFiltradas);
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* Toolbar */}
      <DataTableToolbar
        viewModeSlot={<ViewModePopover />}
        quadroSlot={<QuadroSelector />}
      />
      
      {/* Colunas */}
      {STATUSES.map(status => (
        <Column key={status} status={status}>
          {tarefasByStatus[status].map(tarefa => (
            <TaskCard key={tarefa.id} tarefa={tarefa} />
          ))}
        </Column>
      ))}
    </DndContext>
  );
}
```


### 4.4 TaskCard (Card do Kanban)

**Adaptado do módulo Kanban**:

```typescript
export function TaskCard({ tarefa }: { tarefa: TarefaDisplayItem }) {
  const { setSelectedTarefaId, setTarefaSheetOpen } = useTarefaStore();
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: tarefa.id,
    disabled: tarefa.isVirtual, // Eventos virtuais não são arrastáveis
  });
  
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <Card onClick={() => {
        setSelectedTarefaId(tarefa.id);
        setTarefaSheetOpen(true);
      }}>
        <CardContent>
          <h4>{tarefa.title}</h4>
          <Badge>{tarefa.priority}</Badge>
          <Badge>{tarefa.label}</Badge>
          {tarefa.dueDate && <span>{tarefa.dueDate}</span>}
          {tarefa.subTasks.length > 0 && (
            <span>{completedSubtasks}/{totalSubtasks}</span>
          )}
          {tarefa.comments.length > 0 && <span>{tarefa.comments.length}</span>}
          {tarefa.files.length > 0 && <span>{tarefa.files.length}</span>}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.5 QuadroSelector

**Do módulo Kanban**:

```typescript
export function QuadroSelector() {
  const { quadros, selectedQuadroId, setSelectedQuadroId } = useTarefaStore();
  
  return (
    <Select value={selectedQuadroId ?? "sistema"} onValueChange={setSelectedQuadroId}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sistema">Sistema (Todas)</SelectItem>
        {quadros.filter(q => q.tipo === "custom").map(q => (
          <SelectItem key={q.id} value={q.id}>{q.titulo}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```


## 5. Service Layer

### 5.1 Funções Unificadas

**De Tarefas**:
- `listarTarefas()` - Lista tarefas manuais
- `listarTarefasComEventos()` - Lista tarefas + eventos virtuais
- `criarTarefa()`, `atualizarTarefa()`, `removerTarefa()`
- `criarSubtarefa()`, `atualizarSubtarefa()`, `removerSubtarefa()`
- `adicionarComentario()`, `removerComentario()`
- `adicionarAnexo()`, `removerAnexo()`

**De Kanban**:
- `listarQuadros()` - Lista quadros sistema + custom
- `criarQuadroCustom()`, `excluirQuadroCustom()`
- `reorderTasks()` - Reordena tarefas no quadro

**Novo**:
- `obterTarefasDoQuadro(quadroId)` - Filtra tarefas por quadro

### 5.2 Lógica de Quadros

```typescript
export async function listarQuadros(usuarioId: number): Promise<Result<Quadro[]>> {
  // Quadros sistema (constantes)
  const sistemQuadros: Quadro[] = [
    { id: "sys-expedientes", titulo: "Expedientes", tipo: "sistema", source: "expedientes", ordem: 0 },
    { id: "sys-audiencias", titulo: "Audiências", tipo: "sistema", source: "audiencias", ordem: 1 },
    { id: "sys-obrigacoes", titulo: "Obrigações", tipo: "sistema", source: "obrigacoes", ordem: 2 },
  ];
  
  // Quadros custom do DB
  const customResult = await repo.listQuadrosCustom(usuarioId);
  if (!customResult.success) return err(customResult.error);
  
  return ok([...sistemQuadros, ...customResult.data]);
}

export async function obterTarefasDoQuadro(
  usuarioId: number,
  quadroId: string | null
): Promise<Result<TarefaDisplayItem[]>> {
  if (!quadroId) {
    // Quadro Sistema = todas as tarefas + eventos virtuais
    return listarTarefasComEventos(usuarioId, false);
  }
  
  // Quadro custom = apenas tarefas associadas
  const result = await repo.listTarefasByQuadro(usuarioId, quadroId);
  if (!result.success) return err(result.error);
  
  return ok(result.data);
}
```


## 6. Repository Layer

### 6.1 Tabelas

**tasks** (existente, adicionar colunas):
```sql
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN quadro_id UUID REFERENCES quadros(id);
```

**quadros** (nova):
```sql
CREATE TABLE quadros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sistema', 'custom')),
  source TEXT CHECK (source IN ('expedientes', 'audiencias', 'obrigacoes')),
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Funções

**Quadros**:
- `listQuadrosCustom(usuarioId)` - Lista quadros custom do usuário
- `createQuadroCustom(usuarioId, titulo)` - Cria quadro custom
- `deleteQuadroCustom(usuarioId, quadroId)` - Remove quadro custom

**Tarefas**:
- `listTarefasByQuadro(usuarioId, quadroId)` - Lista tarefas de um quadro
- `updateTaskPosition(taskId, position)` - Atualiza posição
- `updateTaskQuadro(taskId, quadroId)` - Move tarefa para outro quadro

## 7. Actions

### 7.1 Actions de Tarefas (mantidas)

- `actionListarTarefas`
- `actionCriarTarefa`
- `actionAtualizarTarefa`
- `actionRemoverTarefa`
- `actionCriarSubtarefa`, `actionAtualizarSubtarefa`, `actionRemoverSubtarefa`
- `actionAdicionarComentario`, `actionRemoverComentario`
- `actionAdicionarAnexo`, `actionRemoverAnexo`

### 7.2 Actions de Kanban (novas)

- `actionListarQuadros`
- `actionCriarQuadroCustom`
- `actionExcluirQuadroCustom`
- `actionReordenarTarefas`
- `actionMoverTarefaParaQuadro`


## 8. Migração do Kanban

### 8.1 Componentes a Importar

**De `src/features/kanban/components/`**:
- `custom-board-view.tsx` → Adaptar para `TaskBoard`
- `unified-kanban-card.tsx` → Adaptar para `TaskCard`
- `board-selector.tsx` → Adaptar para `QuadroSelector`

### 8.2 Lógica a Importar

**De `src/features/kanban/service.ts`**:
- `listarQuadros()` - Gestão de quadros
- `criarQuadroCustom()`, `excluirQuadroCustom()`
- Lógica de drag-and-drop

**De `src/features/kanban/repository.ts`**:
- CRUD de quadros
- Reordenação de tarefas

### 8.3 Não Importar

**Quadros Sistema de Eventos** (Expedientes, Audiências, Obrigações):
- Esses quadros já existem no Kanban
- No módulo unificado, eventos virtuais aparecem no "Quadro Sistema" (todas as tarefas)
- Não precisamos de quadros separados por tipo de evento

**Motivo**: Simplificação. Usuário vê:
- **Quadro Sistema**: Todas as tarefas + todos os eventos virtuais
- **Quadros Custom**: Apenas tarefas manuais associadas

## 9. Fluxo de Dados

### 9.1 Carregar Dados (page.tsx)

```typescript
export default async function TarefasPage() {
  const user = await getCurrentUser();
  
  // Buscar tarefas + eventos virtuais
  const tarefasResult = await tarefasService.listarTarefasComEventos(user.id, false);
  
  // Buscar quadros
  const quadrosResult = await tarefasService.listarQuadros(user.id);
  
  return (
    <PageShell>
      <TarefasClient 
        data={tarefasResult.data} 
        quadros={quadrosResult.data}
      />
    </PageShell>
  );
}
```

### 9.2 Alternar Visualização

```
User clica ViewModePopover
  → setViewMode("quadro")
  → TarefasClient re-renderiza
  → Mostra TaskBoard ao invés de DataTable
```

### 9.3 Drag-and-Drop

```
User arrasta card para nova coluna
  → handleDragEnd()
  → Atualiza status local (otimistic update)
  → actionAtualizarTarefa({ id, status })
  → Persiste no DB
  → Revalida dados
```


## 10. UI/UX

### 10.1 Toolbar Unificado

**Modo Lista**:
```
[Tarefas] [Filtros...] [ViewModePopover] [Export] [Nova Tarefa]
```

**Modo Quadro**:
```
[Tarefas] [QuadroSelector] [ViewModePopover] [Export] [Nova Tarefa]
```

### 10.2 ViewModePopover

Posicionamento: Ao lado do botão de export (igual Audiências)

```typescript
<ViewModePopover
  value={viewMode}
  onValueChange={setViewMode}
  options={[
    { value: 'lista', label: 'Lista', icon: List },
    { value: 'quadro', label: 'Quadro', icon: LayoutGrid }
  ]}
/>
```

### 10.3 QuadroSelector

Visível apenas em modo quadro:

```typescript
{viewMode === "quadro" && (
  <QuadroSelector />
)}
```

## 11. Remoção do Módulo Kanban

### 11.1 Arquivos a Remover

```
src/features/kanban/
├── components/
├── actions/
├── domain.ts
├── service.ts
├── repository.ts
└── index.ts
```

### 11.2 Rotas a Remover

- `/app/kanban/page.tsx`
- Entrada na sidebar

### 11.3 Verificações

- [ ] Nenhum import de `@/features/kanban` no código
- [ ] Nenhuma referência a `/kanban` nas rotas
- [ ] Sidebar atualizada (remover link Kanban)

## 12. Plano de Implementação

### Fase 1: Preparação
1. Criar branch `feat/unificar-tarefas-kanban`
2. Revisar código de ambos os módulos
3. Criar migração de banco (adicionar colunas, criar tabela quadros)

### Fase 2: Domain & Store
1. Unificar schemas em `domain.ts`
2. Atualizar `store.ts` com viewMode e quadros
3. Criar types unificados

### Fase 3: Service & Repository
1. Mesclar lógicas de service
2. Adicionar funções de quadros
3. Atualizar repository com novas queries

### Fase 4: Componentes
1. Importar TaskBoard e TaskCard do Kanban
2. Adaptar para usar domain unificado
3. Criar QuadroSelector
4. Atualizar TarefasClient com alternância

### Fase 5: Actions
1. Adicionar actions de quadros
2. Adicionar action de reordenação
3. Atualizar MCP tools

### Fase 6: Limpeza
1. Remover `src/features/kanban/`
2. Remover rota `/app/kanban/`
3. Atualizar sidebar
4. Limpar imports

### Fase 7: Testes
1. Testar visualização de lista
2. Testar visualização de quadro
3. Testar alternância
4. Testar drag-and-drop
5. Testar quadros custom
6. Testar eventos virtuais

## 13. Métricas de Sucesso

- ✅ Alternância lista/quadro funcional
- ✅ Drag-and-drop no quadro
- ✅ Eventos virtuais aparecem em ambas visualizações
- ✅ Quadros custom funcionais
- ✅ Módulo Kanban removido
- ✅ Sem erros de tipo
- ✅ Build bem-sucedido
- ✅ Todos os testes passando
