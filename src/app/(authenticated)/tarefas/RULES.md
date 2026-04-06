# Regras de Negocio - Tarefas

## Contexto
Modulo de tarefas que agrega tarefas manuais (todo_items) com eventos virtuais do sistema (audiencias, expedientes, pericias, obrigacoes). Suporta visualizacao em lista e quadro Kanban com drag-and-drop bidirecional.

## Entidades Principais
- **Task**: Tarefa manual com titulo, status, label, prioridade, subtarefas, comentarios e anexos
- **TarefaDisplayItem**: Unificacao de tarefa manual e evento virtual para exibicao
- **Quadro**: Quadro Kanban (sistema ou custom)
- **SystemBoardDefinition**: Definicao de quadro sistema com colunas especificas

## Status e Enums
- **TaskStatus**: `backlog`, `todo`, `in progress`, `done`, `canceled`
- **TaskLabel**: `bug`, `feature`, `documentation`, `audiencia`, `expediente`, `pericia`, `obrigacao`
- **TaskPriority**: `low`, `medium`, `high`
- **QuadroTipo**: `sistema`, `custom`
- **QuadroSource**: `expedientes`, `audiencias`, `pericias`, `obrigacoes`

## Regras de Validacao
- `title`: obrigatorio, min 1 caractere
- `status`, `label`, `priority`: obrigatorios (enums)
- `dueDate`: formato yyyy-mm-dd, opcional
- Anexos: limite ~2.5MB para data-urls

## Regras de Negocio
### Tarefas Manuais
- Criacao gera ID automatico (ex: TASK-0001)
- Subtarefas, comentarios e anexos sao sub-entidades da tarefa
- Tarefas sao isoladas por usuario

### Eventos Virtuais
- Eventos de audiencias, expedientes, pericias e obrigacoes aparecem como tarefas virtuais
- Status e prioridade sao mapeados automaticamente via `mapSourceStatusToTarefaStatus` e `calcularPrioridade`
- Admin (isSuperAdmin) ve todos os eventos; demais usuarios veem apenas os atribuidos a eles

### Materializacao
- Eventos virtuais podem ser materializados em registros reais (todo_items) com `source` + `sourceEntityId`
- Se ja foi materializado, retorna o existente (dedup)
- Na listagem, tarefas materializadas prevalecem sobre virtuais (enriquecidas com dados do evento)

### Quadros Kanban
- 4 quadros sistema fixos: Expedientes, Audiencias, Pericias, Obrigacoes
- Quadros custom criados pelo usuario; nao e possivel excluir quadros sistema (`sys-*`)
- DnD bidirecional em quadros sistema: atualiza status da entidade de origem via `atualizarStatusEntidadeOrigem`
- Quadro Obrigacoes nao suporta DnD (`dndEnabled: false`)
- Colunas especificas por quadro com `matchStatuses` e `targetStatus`

## Revalidacao de Cache
- `revalidatePath("/app/tarefas")` em todas as mutacoes
