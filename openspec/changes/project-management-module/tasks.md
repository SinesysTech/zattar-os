## 1. Database Schema

- [x] 1.1 Criar migração SQL com ENUMs: `pm_status_projeto`, `pm_status_tarefa`, `pm_prioridade`, `pm_papel_projeto`
- [x] 1.2 Criar tabela `pm_projetos` com todas as colunas, constraints e foreign keys (clientes, acervo, contratos, usuarios)
- [x] 1.3 Criar tabela `pm_tarefas` com foreign key para pm_projetos e self-reference para subtarefas
- [x] 1.4 Criar tabela `pm_membros_projeto` com constraint UNIQUE(projeto_id, usuario_id)
- [x] 1.5 Criar tabela `pm_lembretes` com foreign keys para pm_projetos e pm_tarefas
- [x] 1.6 Criar tabela `pm_comentarios` com CHECK constraint (pelo menos projeto_id ou tarefa_id NOT NULL)
- [x] 1.7 Criar tabela `pm_anexos` com campos de arquivo (nome, url, tamanho, tipo_mime)
- [x] 1.8 Criar indexes de performance conforme spec pm-database
- [x] 1.9 Criar RLS policies para todas as tabelas pm_* (acesso por membro/responsável/criador/superadmin)
- [x] 1.10 Criar triggers de `atualizado_em` para pm_projetos, pm_tarefas e pm_comentarios
- [x] 1.11 Criar registros de permissão na tabela de permissões: `projetos.listar`, `projetos.criar`, `projetos.editar`, `projetos.excluir`

## 2. Domain e Types

- [x] 2.1 Criar `lib/domain.ts` com interfaces TypeScript para todas as entidades (Projeto, Tarefa, MembroProjeto, Lembrete, Comentario, Anexo)
- [x] 2.2 Criar Zod schemas de validação para criação e edição de projetos
- [x] 2.3 Criar Zod schemas de validação para criação e edição de tarefas
- [x] 2.4 Criar Zod schemas de validação para membros, lembretes e comentários
- [x] 2.5 Criar tipos auxiliares (StatusProjeto, StatusTarefa, Prioridade, PapelProjeto) e constantes de labels/cores

## 3. Repository Layer

- [x] 3.1 Criar `lib/repositories/project.repository.ts` com queries: list (paginado + filtros), getById, create, update, delete
- [x] 3.2 Criar `lib/repositories/task.repository.ts` com queries: listByProject, listGlobal, getById, create, update, delete, updateKanbanOrder (batch)
- [x] 3.3 Criar `lib/repositories/team.repository.ts` com queries: listByProject, addMember, removeMember, updateRole, countByRole
- [x] 3.4 Criar `lib/repositories/reminder.repository.ts` com queries: listByUser, create, update, toggleComplete, delete
- [x] 3.5 Criar `lib/repositories/dashboard.repository.ts` com queries de agregação: countByStatus, taskMetrics, hoursMetrics, completionRate, projectsByPeriod, topMembers

## 4. Service Layer

- [x] 4.1 Criar `lib/services/project.service.ts` com lógica de negócio: validação, criação (auto-add criador como gerente), edição, exclusão, cálculo de progresso
- [x] 4.2 Criar `lib/services/task.service.ts` com lógica: validação, CRUD, reordenação Kanban, validação de responsável como membro
- [x] 4.3 Criar `lib/services/team.service.ts` com lógica: add/remove membro, impedir duplicata, impedir remover último gerente
- [x] 4.4 Criar `lib/services/reminder.service.ts` com lógica: CRUD, toggle concluído
- [x] 4.5 Criar `lib/services/dashboard.service.ts` com lógica: agregação de métricas, cálculo de variações percentuais

## 5. Server Actions

- [x] 5.1 Criar `lib/actions/project.actions.ts` com actions: listar, criar, editar, excluir projetos
- [x] 5.2 Criar `lib/actions/task.actions.ts` com actions: listar, criar, editar, excluir, reordenar tarefas
- [x] 5.3 Criar `lib/actions/team.actions.ts` com actions: listar membros, adicionar, remover, alterar papel
- [x] 5.4 Criar `lib/actions/reminder.actions.ts` com actions: listar, criar, concluir, excluir lembretes
- [x] 5.5 Criar `lib/actions/index.ts` como barrel export de todas as actions

## 6. Componentes Compartilhados

- [x] 6.1 Criar `components/shared/member-avatar-group.tsx` para exibir grupo de avatars com tooltip (+N)
- [x] 6.2 Criar `components/shared/progress-indicator.tsx` para barra de progresso com percentual
- [x] 6.3 Criar `components/shared/project-status-badge.tsx` para badge de status com cores do domínio
- [x] 6.4 Criar `components/shared/priority-indicator.tsx` para indicador visual de prioridade

## 7. Dashboard (Adaptar Templates)

- [x] 7.1 Adaptar `components/dashboard/summary-cards.tsx`: trocar dados mock por props, traduzir para PT-BR (Projetos Ativos, Tarefas Pendentes, Horas Registradas, Taxa de Conclusão)
- [x] 7.2 Adaptar `components/dashboard/chart-project-overview.tsx`: conectar a dados reais (projetos criados vs concluídos), traduzir labels
- [x] 7.3 Adaptar `components/dashboard/chart-project-efficiency.tsx`: mostrar distribuição por status do domínio, traduzir
- [x] 7.4 Adaptar `components/dashboard/table-recent-projects.tsx`: conectar a dados reais via props, usar componentes compartilhados (status badge, avatar group, progress)
- [x] 7.5 Adaptar `components/dashboard/reminders.tsx`: conectar a dados reais, corrigir import do AddReminderDialog
- [x] 7.6 Adaptar `components/dashboard/add-reminder-dialog.tsx`: conectar a server action de criar lembrete, traduzir
- [x] 7.7 Adaptar `components/dashboard/success-metrics.tsx`: conectar a métricas reais, traduzir
- [x] 7.8 Adaptar `components/dashboard/achievement-by-year.tsx`: conectar a dados reais de comparativo por ano, traduzir
- [x] 7.9 Criar `page.tsx` (dashboard principal) como Server Component com fetch paralelo de métricas via dashboard.service
- [x] 7.10 Adaptar `components/reports.tsx` (tab Relatórios): conectar a dados reais, usar DataShell pattern

## 8. CRUD de Projetos (UI)

- [x] 8.1 Criar `components/projects/project-table.tsx` usando DataShell + DataTableToolbar com colunas: nome, cliente, status, responsável, progresso, prazo, orçamento
- [x] 8.2 Criar `components/projects/project-card.tsx` baseado no template project-list com progress, avatar group e status badge
- [x] 8.3 Criar `components/projects/project-form.tsx` com React Hook Form + Zod: campos de nome, descrição, cliente (combobox), processo, contrato, status, prioridade, responsável, datas, orçamento, tags
- [x] 8.4 Criar `projects/page.tsx` como Server Component com toggle tabela/cards e botão "Novo Projeto"
- [x] 8.5 Criar `projects/new/page.tsx` com formulário de criação de projeto
- [x] 8.6 Criar `projects/[id]/page.tsx` com detalhe do projeto e tabs internas (Visão Geral, Tarefas, Equipe, Arquivos, Cronograma, Config)
- [x] 8.7 Criar `projects/[id]/settings/page.tsx` com formulário de edição e opção de exclusão

## 9. Tarefas e Kanban (UI)

- [x] 9.1 Instalar dependência `@dnd-kit/core` e `@dnd-kit/sortable`
- [x] 9.2 Criar `hooks/use-task-board.ts` com estado do Kanban (colunas, drag state, optimistic updates)
- [x] 9.3 Criar `components/tasks/task-card.tsx` para card de tarefa no Kanban (título, prioridade, responsável, prazo, subtarefas count)
- [x] 9.4 Criar `components/tasks/task-board.tsx` com colunas por status, drag & drop via @dnd-kit, contagem por coluna
- [x] 9.5 Criar `components/tasks/task-list.tsx` com DataTable para vista lista de tarefas
- [x] 9.6 Criar `components/tasks/task-form.tsx` com formulário de criação/edição de tarefa (React Hook Form + Zod)
- [x] 9.7 Criar `projects/[id]/tasks/page.tsx` com toggle Kanban/Lista e botão "Nova Tarefa"
- [x] 9.8 Criar `tasks/page.tsx` para visão global cross-projeto com filtros por projeto, responsável, status, prioridade

## 10. Equipe e Lembretes (UI)

- [x] 10.1 Criar `projects/[id]/team/page.tsx` com lista de membros agrupados por papel, botão "Adicionar Membro"
- [x] 10.2 Criar dialog de adicionar membro com combobox de usuários e seleção de papel
- [x] 10.3 Criar `projects/[id]/files/page.tsx` com lista de anexos e upload (integrar com Supabase Storage)

## 11. Hooks do Módulo

- [x] 11.1 Criar `hooks/use-projects.ts` com fetch, filtros e paginação de projetos
- [x] 11.2 Criar `hooks/use-tasks.ts` com fetch de tarefas por projeto e global
- [x] 11.3 Criar `hooks/use-project-filters.ts` com estado de filtros (status, responsável, cliente, período)

## 12. Layout e Navegação

- [x] 12.1 Criar `layout.tsx` do módulo com estrutura adequada
- [x] 12.2 Adicionar item "Projetos" na sidebar (navServicos) com ícone FolderKanban e subitens: Dashboard, Projetos, Tarefas
- [x] 12.3 Filtrar visibilidade na sidebar com `temPermissao('projetos', 'listar')`

## 13. Notificações

- [x] 13.1 Criar triggers ou functions SQL para gerar notificações em eventos: tarefa atribuída, status do projeto alterado, novo membro adicionado
- [x] 13.2 Criar job ou trigger para notificação de prazo próximo (tarefas com data_prazo nos próximos 3 dias)
