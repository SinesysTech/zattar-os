# Design: Correção da Visualização de Tarefas

## 1. Visão Geral

Este documento descreve o design técnico para corrigir dois problemas identificados na interface de tarefas após a unificação dos módulos To-Do e Tarefas:

1. **Espaçamento inadequado da paginação**: A paginação está muito próxima da tabela
2. **Troca de visualização não funciona**: O ViewModePopover não alterna corretamente entre lista e quadro

### 1.1 Contexto Técnico

**Módulo**: `src/app/app/tarefas/`

**Componentes Principais**:
- `tarefas-client.tsx` - Componente cliente que orquestra as visualizações
- `components/data-table.tsx` - Visualização de lista com tabela
- `components/task-board.tsx` - Visualização de quadro Kanban
- `store.ts` - Estado global com Zustand (inclui `viewMode`)

**Componentes Compartilhados**:
- `ViewModePopover` - Seletor de visualização (já implementado)
- `DataShell` - Container para tabelas (já implementado)
- `DataTableToolbar` - Toolbar com filtros e ações (já implementado)

### 1.2 Problema Identificado

**Problema 1 - Espaçamento da Paginação**:
- A paginação (`DataTablePagination`) está renderizada no `footer` do `DataShell`
- Não há margem superior entre a tabela e a paginação
- Outros módulos (ex: Audiências) têm espaçamento adequado

**Problema 2 - Alternância de Visualização**:
- O `ViewModePopover` está presente em ambas as visualizações
- O estado `viewMode` existe no store
- A renderização condicional em `TarefasClient` pode não estar funcionando corretamente
- Possível problema: ambas as visualizações sendo renderizadas simultaneamente

## 2. Arquitetura

### 2.1 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      page.tsx (Server)                      │
│  - Busca tarefas + eventos virtuais                        │
│  - Busca quadros                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              TarefasClient (Client Component)               │
│  - Recebe data e quadros como props                        │
│  - Sincroniza com store via useEffect                      │
│  - Renderiza condicionalmente baseado em viewMode          │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│   DataTable      │      │    TaskBoard     │
│  (viewMode =     │      │  (viewMode =     │
│   "lista")       │      │   "quadro")      │
└──────────────────┘      └──────────────────┘
```

### 2.2 Estado (Zustand Store)

```typescript
interface TarefaStore {
  // Visualização
  viewMode: "lista" | "quadro";
  setViewMode: (mode: "lista" | "quadro") => void;
  
  // ... outros estados
}
```

**Estado Atual**: O store já possui `viewMode` e `setViewMode` implementados corretamente.

### 2.3 Componentes Afetados

#### 2.3.1 TarefasClient

**Localização**: `src/app/app/tarefas/tarefas-client.tsx`

**Responsabilidade**:
- Sincronizar props com store
- Renderizar condicionalmente DataTable ou TaskBoard baseado em `viewMode`
- Renderizar dialogs compartilhados (TaskDetailSheet, TaskDialog)

**Problema Atual**:
```tsx
// Código atual
{viewMode === "lista" ? (
  <DataTable data={data} columns={columns} />
) : (
  <TaskBoard quadros={quadros} />
)}
```

**Análise**: A renderização condicional está correta. O problema pode estar na propagação do estado.

#### 2.3.2 DataTable

**Localização**: `src/app/app/tarefas/components/data-table.tsx`

**Responsabilidade**:
- Renderizar tabela com filtros, ordenação e paginação
- Incluir ViewModePopover no toolbar
- Gerenciar estado local da tabela (TanStack Table)

**Problema Atual**:
```tsx
<DataShell
  footer={<DataTablePagination table={table} />}
  header={<DataTableToolbar ... viewModeSlot={<ViewModePopover ... />} />}
>
  <div className="rounded-md border bg-card">
    <Table>...</Table>
  </div>
</DataShell>
```

**Análise**: 
- O `footer` não tem margem superior
- O `DataShell` não aplica espaçamento automático entre content e footer

#### 2.3.3 TaskBoard

**Localização**: `src/app/app/tarefas/components/task-board.tsx`

**Responsabilidade**:
- Renderizar quadro Kanban com drag-and-drop
- Incluir ViewModePopover no toolbar
- Filtrar tarefas por quadro selecionado

**Problema Atual**: Nenhum problema identificado no TaskBoard.

## 3. Componentes e Interfaces

### 3.1 DataShell (Componente Compartilhado)

**Localização**: `src/components/shared/data-shell/data-shell.tsx`

**Interface Atual**:
```typescript
export interface DataShellProps {
  header?: React.ReactNode;
  subHeader?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  actionButton?: DataShellActionButton;
  scrollableContent?: boolean;
}
```

**Estrutura de Renderização**:
```tsx
<div role="region" data-slot="data-shell">
  {header && <div data-slot="data-shell-header">{header}</div>}
  {subHeader && <div data-slot="data-shell-subheader" className="mb-4">{subHeader}</div>}
  <div data-slot="data-shell-content">{children}</div>
  {footer && <div data-slot="data-shell-footer">{footer}</div>}
</div>
```

**Problema**: Não há espaçamento entre `data-shell-content` e `data-shell-footer`.

**Solução**: Adicionar `mt-4` ao `data-shell-footer` quando `footer` está presente.

### 3.2 ViewModePopover (Componente Compartilhado)

**Localização**: `src/components/shared/view-mode-popover.tsx`

**Interface**:
```typescript
export interface ViewModePopoverProps {
  value: ViewType;
  onValueChange: (value: ViewType) => void;
  options?: ViewModeOption[];
  className?: string;
}

export type ViewType = 'semana' | 'mes' | 'ano' | 'lista' | 'quadro';
```

**Comportamento**:
- Renderiza botão com ícone de olho
- Abre popover com opções de visualização
- Chama `onValueChange` quando usuário seleciona uma opção
- Fecha popover automaticamente após seleção

**Problema Potencial**: O componente está funcionando corretamente, mas pode haver problema na propagação do estado.

### 3.3 DataTablePagination

**Localização**: `src/app/app/tarefas/components/data-table-pagination.tsx`

**Estrutura Atual**:
```tsx
<div className="flex items-center justify-between px-2 py-4">
  {/* Conteúdo da paginação */}
</div>
```

**Análise**: O componente já tem `py-4` (padding vertical), mas isso não cria espaçamento visual adequado em relação à tabela acima.

## 4. Modelos de Dados

Não há alterações nos modelos de dados. Os tipos existentes são suficientes:

```typescript
// domain.ts
export type TaskStatus = "backlog" | "todo" | "in progress" | "done" | "canceled";

export interface TarefaDisplayItem {
  id: string;
  titulo: string;
  status: TaskStatus;
  priority: TaskPriority;
  isVirtual: boolean;
  quadroId: string | null;
  position: number | null;
  // ... outros campos
}

export interface Quadro {
  id: string;
  nome: string;
  // ... outros campos
}
```

## 5. Correções Necessárias

### 5.1 Correção 1: Espaçamento da Paginação

**Arquivo**: `src/components/shared/data-shell/data-shell.tsx`

**Mudança**:
```tsx
// Antes
{footer && (
  <div data-slot="data-shell-footer">
    {footer}
  </div>
)}

// Depois
{footer && (
  <div data-slot="data-shell-footer" className="mt-4">
    {footer}
  </div>
)}
```

**Justificativa**:
- Segue o grid de 4px do design system (mt-4 = 16px)
- Consistente com outros módulos (Audiências)
- Melhora a hierarquia visual

### 5.2 Correção 2: Opções do ViewModePopover

**Arquivo**: `src/app/app/tarefas/components/data-table.tsx`

**Mudança**: Passar opções customizadas para o ViewModePopover

```tsx
// Antes
<ViewModePopover
  value={viewMode}
  onValueChange={(v) => setViewMode(v as "lista" | "quadro")}
/>

// Depois
<ViewModePopover
  value={viewMode}
  onValueChange={(v) => setViewMode(v as "lista" | "quadro")}
  options={[
    { value: 'lista', label: 'Lista', icon: List },
    { value: 'quadro', label: 'Quadro', icon: LayoutGrid },
  ]}
/>
```

**Justificativa**:
- O ViewModePopover usa opções padrão (semana, mês, ano, lista) se não forem fornecidas
- Tarefas só precisa de "lista" e "quadro"
- Isso garante que apenas as opções relevantes sejam exibidas

### 5.3 Correção 3: Opções do ViewModePopover no TaskBoard

**Arquivo**: `src/app/app/tarefas/components/task-board.tsx`

**Mudança**: Mesma correção do DataTable

```tsx
// Antes
<ViewModePopover
  value={viewMode}
  onValueChange={(v) => setViewMode(v as "lista" | "quadro")}
/>

// Depois
<ViewModePopover
  value={viewMode}
  onValueChange={(v) => setViewMode(v as "lista" | "quadro")}
  options={[
    { value: 'lista', label: 'Lista', icon: List },
    { value: 'quadro', label: 'Quadro', icon: LayoutGrid },
  ]}
/>
```

### 5.4 Verificação: Renderização Condicional

**Arquivo**: `src/app/app/tarefas/tarefas-client.tsx`

**Verificação**: Confirmar que a renderização condicional está correta

```tsx
{viewMode === "lista" ? (
  <DataTable data={data} columns={columns} />
) : (
  <TaskBoard quadros={quadros} />
)}
```

**Análise**: O código está correto. A alternância deve funcionar após corrigir as opções do ViewModePopover.

## 6. Tratamento de Erros

Não há novos cenários de erro. As correções são puramente visuais e de UX.

**Cenários Existentes**:
- Erro ao carregar tarefas: Tratado em `page.tsx`
- Erro ao reordenar tarefas: Tratado em `TaskBoard` com toast
- Erro ao criar/editar tarefa: Tratado nos dialogs

## 7. Estratégia de Testes

### 7.1 Testes Manuais

**Teste 1: Espaçamento da Paginação**
1. Acessar `/app/tarefas`
2. Verificar visualização de lista
3. Confirmar que há espaçamento visual adequado (16px) entre tabela e paginação
4. Comparar com módulo de Audiências para consistência

**Teste 2: Alternância para Quadro**
1. Acessar `/app/tarefas`
2. Clicar no ViewModePopover (ícone de olho)
3. Selecionar "Quadro"
4. Confirmar que a visualização muda para quadro Kanban
5. Confirmar que apenas 2 opções aparecem (Lista e Quadro)

**Teste 3: Alternância para Lista**
1. Estar na visualização de quadro
2. Clicar no ViewModePopover
3. Selecionar "Lista"
4. Confirmar que a visualização muda para tabela
5. Confirmar que filtros e paginação funcionam

**Teste 4: Persistência do Estado**
1. Alternar para visualização de quadro
2. Criar uma nova tarefa
3. Confirmar que permanece na visualização de quadro
4. Alternar para lista
5. Editar uma tarefa
6. Confirmar que permanece na visualização de lista

### 7.2 Testes de Regressão

**Áreas a Verificar**:
- Drag-and-drop no quadro continua funcionando
- Filtros na tabela continuam funcionando
- Paginação continua funcionando
- Criação de tarefas funciona em ambas visualizações
- Detalhes de tarefa abrem corretamente
- Eventos virtuais aparecem em ambas visualizações

### 7.3 Testes de Acessibilidade

**Verificações**:
- ViewModePopover tem aria-label adequado
- Transição entre visualizações não causa perda de foco
- Navegação por teclado funciona em ambas visualizações
- Screen readers anunciam mudança de visualização

### 7.4 Testes de Responsividade

**Breakpoints a Testar**:
- Mobile (375px): Verificar que ViewModePopover é acessível
- Tablet (768px): Verificar layout do quadro
- Desktop (1024px+): Verificar todas as colunas do quadro visíveis

## 8. Considerações de Performance

**Impacto**: Mínimo

**Análise**:
- Adicionar `mt-4` não tem impacto de performance
- Passar opções customizadas para ViewModePopover reduz ligeiramente o tamanho do popover (menos opções)
- Renderização condicional já existe, não há mudança

**Otimizações Existentes**:
- `React.useMemo` para filtrar tarefas por quadro
- `React.useMemo` para agrupar tarefas por status
- `React.useCallback` para handlers de eventos

## 9. Considerações de Segurança

Não há implicações de segurança. As mudanças são puramente de UI/UX.

## 10. Documentação

### 10.1 Comentários no Código

Adicionar comentário no DataShell explicando o espaçamento:

```tsx
{/* Footer com margem superior para espaçamento visual adequado (grid 4px) */}
{footer && (
  <div data-slot="data-shell-footer" className="mt-4">
    {footer}
  </div>
)}
```

### 10.2 Atualização do AGENTS.md

Não é necessário atualizar o AGENTS.md, pois as mudanças seguem os padrões existentes.

## 11. Cronograma de Implementação

**Estimativa Total**: 30 minutos

**Tarefas**:
1. Adicionar `mt-4` ao footer do DataShell (5 min)
2. Adicionar opções customizadas ao ViewModePopover no DataTable (10 min)
3. Adicionar opções customizadas ao ViewModePopover no TaskBoard (10 min)
4. Testes manuais (5 min)

## 12. Critérios de Aceitação

- ✅ Paginação tem margem superior de 16px (mt-4)
- ✅ ViewModePopover mostra apenas opções "Lista" e "Quadro"
- ✅ Clicar em "Lista" mostra DataTable
- ✅ Clicar em "Quadro" mostra TaskBoard
- ✅ Transição entre visualizações é instantânea
- ✅ Estado persiste durante operações (criar, editar)
- ✅ Drag-and-drop funciona no quadro
- ✅ Filtros e paginação funcionam na lista
- ✅ Build sem erros TypeScript
- ✅ Consistência visual com outros módulos

## 13. Referências

**Componentes Relacionados**:
- `src/components/shared/data-shell/data-shell.tsx`
- `src/components/shared/view-mode-popover.tsx`
- `src/app/app/audiencias/` (referência de implementação correta)

**Design System**:
- Grid de 4px: Todos os espaçamentos devem ser múltiplos de 4px
- Tailwind classes: `mt-4` = 16px (4 * 4px)

**Documentação**:
- Feature-Sliced Design (FSD)
- Zattar Design Patterns (PageShell, DataShell, DialogFormShell)
