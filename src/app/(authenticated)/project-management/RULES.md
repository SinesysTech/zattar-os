# Regras de Negocio - Project Management

## Contexto
Modulo de gestao de projetos internos do escritorio com quadro Kanban, tarefas, equipes e lembretes. Pode vincular projetos a clientes, processos e contratos.

## Estrutura
- `lib/domain.ts` — Tipos e schemas para projetos, tarefas, membros, lembretes, comentarios, anexos
- `lib/actions/` — Server Actions: project, task, team, reminder, file
- `lib/repositories/` — Repositorios Supabase: project, task, team, reminder, dashboard
- `lib/services/` — Services: project, task, team, reminder, dashboard
- `components/` — UI organizada em: projects, tasks, team, dashboard, shared

## Regras Principais
- **Status de projeto**: planejamento, ativo, pausado, concluido, cancelado
- **Status de tarefa (Kanban)**: a_fazer, em_progresso, em_revisao, concluido (cancelado excluido do Kanban)
- **Prioridades**: baixa, media, alta, urgente
- **Papeis no projeto**: gerente, membro, observador
- **Subtarefas**: Tarefas suportam hierarquia via `tarefaPaiId`
- **Vinculacao**: Projetos podem ser vinculados a `clienteId`, `processoId` e `contratoId`
- **Progresso**: Calculado automaticamente por tarefas concluidas, com override manual via `progressoManual`
- **Orcamento**: Controle de `orcamento` vs `valorGasto` e `estimativaHoras` vs `horasRegistradas` por tarefa
- **Ordem Kanban**: Campo `ordemKanban` para drag-and-drop no quadro
