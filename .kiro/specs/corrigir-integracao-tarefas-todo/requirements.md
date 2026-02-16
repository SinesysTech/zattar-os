# Correção da Integração Tarefas + To-Do

## Contexto

Durante a integração dos módulos To-Do e Tarefas, houve um mal-entendido sobre o objetivo:

- **O que foi feito (ERRADO)**: Transformou o módulo Tarefas em um quadro Kanban
- **O que deveria ter sido feito**: Unificar as funcionalidades de To-Do (gerenciamento de tarefas pessoais) com Tarefas (visualização de tarefas do sistema)

**Importante**: Já existe um módulo Kanban separado em `src/features/kanban/` que é o quadro Kanban oficial do sistema.

## Objetivo

Corrigir a integração para que o módulo Tarefas seja uma visualização de lista/tabela de tarefas (manuais + eventos virtuais do sistema), incorporando as funcionalidades úteis do To-Do (subtarefas, comentários, anexos, etc.), mas **SEM** criar um novo quadro Kanban.

## User Stories

### US-1: Visualização de Lista de Tarefas
**Como** usuário do sistema  
**Quero** ver uma lista/tabela de todas as minhas tarefas e eventos  
**Para** ter uma visão geral organizada em formato de lista

**Critérios de Aceitação:**
- A visualização padrão é uma tabela (DataTable)
- Mostra tarefas manuais + eventos virtuais (audiências, expedientes, perícias, obrigações)
- Permite filtrar por status, prioridade, tipo
- Permite ordenar por colunas
- Tem paginação adequada
- Não há visualização de quadro Kanban (isso é responsabilidade do módulo `src/features/kanban/`)

### US-2: Detalhes Enriquecidos de Tarefa
**Como** usuário  
**Quero** ver e gerenciar detalhes completos de uma tarefa  
**Para** ter todas as informações e funcionalidades em um só lugar

**Critérios de Aceitação:**
- Ao clicar em uma tarefa, abre um Sheet lateral com detalhes
- Permite adicionar/editar:
  - Subtarefas (checklist)
  - Comentários
  - Anexos
  - Data de vencimento
  - Lembrete
  - Responsáveis
  - Estrelar/favoritar
- Eventos virtuais (audiências, etc.) são somente leitura

### US-3: Criação de Tarefas Manuais
**Como** usuário  
**Quero** criar tarefas manuais  
**Para** organizar meu trabalho além dos eventos automáticos do sistema

**Critérios de Aceitação:**
- Botão "Nova Tarefa" abre dialog de criação
- Campos obrigatórios: título, status, prioridade, tipo
- Campos opcionais: descrição, data de vencimento, responsáveis
- Após criar, tarefa aparece na lista

### US-4: Separação Clara de Responsabilidades
**Como** desenvolvedor  
**Quero** que cada módulo tenha responsabilidade única  
**Para** manter o código organizado e evitar duplicação

**Critérios de Aceitação:**
- **Tarefas** (`src/app/app/tarefas/`): Lista/tabela de tarefas + eventos virtuais
- **Kanban** (`src/features/kanban/`): Quadro Kanban com drag-and-drop
- Não há sobreposição de funcionalidades
- Se o usuário quer Kanban, vai para `/kanban`
- Se o usuário quer lista de tarefas, vai para `/tarefas`

## Requisitos Técnicos

### RT-1: Remover Visualização de Quadro
- Remover `TaskBoard` component de tarefas
- Remover `ViewModePopover` (troca lista/quadro)
- Remover lógica de drag-and-drop de tarefas
- Manter apenas visualização de lista (DataTable)

### RT-2: Manter Funcionalidades do To-Do
- Subtarefas (TaskSubTask)
- Comentários (TaskComment)
- Anexos (TaskFile)
- Responsáveis (TaskAssignee)
- Estrelar/favoritar
- Data de vencimento
- Lembretes

### RT-3: Estrutura de Dados
- Manter schema atual em `domain.ts`
- Remover campo `position` (usado apenas em Kanban)
- Manter agregação de eventos virtuais

### RT-4: UI/UX
- Usar `DataShell` + `DataTable` (padrão do sistema)
- `TaskDetailSheet` para detalhes/edição
- `TaskDialog` para criação
- Paginação com espaçamento adequado (`py-4`)

## Fora do Escopo

- Modificar o módulo Kanban existente
- Criar nova visualização de quadro
- Integrar Tarefas com Kanban (são módulos independentes)

## Dependências

- `src/features/kanban/` - Módulo Kanban existente (não modificar)
- `src/lib/event-aggregation/` - Agregação de eventos virtuais
- `src/components/shared/data-shell/` - Componentes de tabela

## Riscos

- **Risco**: Usuários podem esperar visualização Kanban em Tarefas
  - **Mitigação**: Documentar claramente que Kanban está em `/kanban`
  
- **Risco**: Confusão entre Tarefas e Kanban
  - **Mitigação**: Nomes claros na sidebar e documentação

## Notas

- O módulo To-Do foi removido, mas suas funcionalidades foram incorporadas em Tarefas
- A visualização de lista é mais adequada para tarefas + eventos misturados
- Kanban é melhor para workflows específicos (já existe em `/kanban`)
