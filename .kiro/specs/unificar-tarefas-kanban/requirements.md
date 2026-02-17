# Unificação Tarefas + Kanban

## Contexto

Atualmente temos dois módulos separados:
- **Tarefas** (`/app/tarefas`): Lista/tabela de tarefas + eventos virtuais
- **Kanban** (`/features/kanban`): Quadro Kanban com drag-and-drop

A proposta é unificar ambos em um único módulo **Tarefas** com duas visualizações:
- **Lista**: Tabela com filtros, ordenação, paginação (atual de Tarefas)
- **Quadro**: Kanban com drag-and-drop (atual de Kanban)

Alternância via `ViewModePopover` (igual Audiências, Expedientes, Perícias).

## Objetivo

Criar um módulo unificado que:
1. Mantém todas as funcionalidades de Tarefas (lista, eventos virtuais, subtarefas, comentários, anexos)
2. Adiciona visualização em quadro Kanban com drag-and-drop
3. Permite alternar entre lista e quadro via popover
4. Remove o módulo Kanban antigo (`/features/kanban/`)
5. Código limpo, sem retrocompatibilidade ou adaptadores

## User Stories

### US-1: Alternância de Visualização
**Como** usuário  
**Quero** alternar entre visualização de lista e quadro  
**Para** escolher a forma que prefiro trabalhar

**Critérios de Aceitação:**
- Botão `ViewModePopover` ao lado do botão de export (igual Audiências)
- Opções: "Lista" (ícone List) e "Quadro" (ícone LayoutGrid)
- Estado persiste durante a sessão
- Transição suave entre visualizações

### US-2: Visualização de Lista (Mantida)
**Como** usuário  
**Quero** ver tarefas em formato de tabela  
**Para** ter visão detalhada com filtros e ordenação

**Critérios de Aceitação:**
- Tabela com colunas: Título, Status, Prioridade, Tipo, Data, Responsável
- Filtros por status, prioridade, tipo
- Ordenação por qualquer coluna
- Paginação
- Inclui eventos virtuais (audiências, expedientes, etc.)
- Clique na linha abre `TaskDetailSheet`

### US-3: Visualização de Quadro Kanban
**Como** usuário  
**Quero** ver tarefas em quadro Kanban  
**Para** gerenciar workflow visualmente

**Critérios de Aceitação:**
- Colunas por status: Backlog, To Do, In Progress, Done, Canceled
- Drag-and-drop entre colunas (muda status)
- Drag-and-drop dentro da coluna (reordena)
- Cards mostram: título, prioridade, tipo, data, subtarefas, comentários, anexos
- Clique no card abre `TaskDetailSheet`
- Eventos virtuais aparecem mas não são arrastáveis

### US-4: Quadros Personalizados (do Kanban)
**Como** usuário  
**Quero** criar quadros personalizados  
**Para** organizar tarefas por projeto/contexto

**Critérios de Aceitação:**
- Seletor de quadro no toolbar (dropdown)
- Opções: "Sistema" (padrão) + quadros personalizados
- Quadro "Sistema" mostra todas as tarefas + eventos virtuais
- Quadros personalizados mostram apenas tarefas associadas
- Criar/editar/deletar quadros personalizados

### US-5: Funcionalidades Enriquecidas (Mantidas)
**Como** usuário  
**Quero** gerenciar detalhes completos das tarefas  
**Para** ter todas as informações em um só lugar

**Critérios de Aceitação:**
- Subtarefas (checklist)
- Comentários
- Anexos
- Responsáveis
- Data de vencimento
- Lembretes
- Estrelar/favoritar
- Funciona em ambas as visualizações

## Requisitos Técnicos

### RT-1: Estrutura Unificada
- Manter estrutura em `src/app/app/tarefas/`
- Importar componentes úteis de `src/features/kanban/`
- Remover `src/features/kanban/` após migração

### RT-2: Domain Unificado
- Mesclar schemas de Tarefas + Kanban
- Adicionar campo `position` (para ordenação no Kanban)
- Adicionar campo `quadro_id` (para quadros personalizados)
- Manter compatibilidade com eventos virtuais

### RT-3: Store Unificado
- `viewMode: "lista" | "quadro"`
- `selectedQuadroId: string | null` (null = Sistema)
- `quadros: Quadro[]` (lista de quadros personalizados)
- Todas as outras funcionalidades atuais

### RT-4: Componentes
- `TarefasClient`: Renderiza lista OU quadro baseado em `viewMode`
- `DataTable`: Visualização de lista (atual)
- `TaskBoard`: Visualização de quadro (do Kanban, adaptado)
- `TaskCard`: Card do Kanban (adaptado)
- `TaskDetailSheet`: Detalhes (atual, funciona para ambos)
- `TaskDialog`: Criação (atual, funciona para ambos)
- `QuadroSelector`: Dropdown para selecionar quadro

### RT-5: Service/Repository
- Mesclar lógicas de Tarefas + Kanban
- Funções de CRUD de tarefas (atual)
- Funções de CRUD de quadros (do Kanban)
- Função de reordenação (do Kanban)
- Agregação de eventos virtuais (atual)

### RT-6: UI/UX
- `ViewModePopover` ao lado do botão de export
- `QuadroSelector` visível apenas em modo quadro
- Toolbar consistente em ambas as visualizações
- Transições suaves

## Fora do Escopo

- Migração de dados de quadros existentes (usuários podem recriar)
- Sincronização com módulos externos
- Notificações em tempo real

## Dependências

- `@dnd-kit/core`, `@dnd-kit/sortable` (drag-and-drop)
- `src/components/shared/view-mode-popover` (alternância)
- `src/lib/event-aggregation/` (eventos virtuais)

## Riscos

- **Risco**: Perda de funcionalidades do Kanban durante migração
  - **Mitigação**: Revisar todas as features do Kanban antes de remover

- **Risco**: Complexidade do código unificado
  - **Mitigação**: Manter separação clara entre visualizações

- **Risco**: Performance com muitas tarefas no quadro
  - **Mitigação**: Virtualização se necessário

## Notas

- Inspiração: Audiências, Expedientes, Perícias (já têm alternância de visualização)
- Código limpo: sem retrocompatibilidade, sem adaptadores
- Melhor dos dois mundos: lista detalhada + quadro visual
