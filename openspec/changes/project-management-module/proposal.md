## Why

O escritório necessita de um módulo centralizado para gerenciar projetos internos e de clientes, acompanhar tarefas, prazos e equipes de forma visual e integrada ao ecossistema existente. Atualmente, o controle de projetos é feito de forma fragmentada entre tarefas avulsas, contratos e processos, sem uma visão consolidada de progresso, orçamento e alocação de recursos. O módulo de gestão de projetos preenche essa lacuna, oferecendo dashboard analítico, Kanban de tarefas, gestão de equipes e cronogramas — tudo autocontido dentro do módulo.

## What Changes

- Novo módulo autocontido em `src/app/app/project-management/` com frontend, backend (services, repositories, actions) e tipos, tudo dentro da própria pasta do módulo
- Dashboard analítico com KPIs (projetos ativos, tarefas pendentes, horas registradas, taxa de conclusão), gráficos de visão geral e eficiência, tabela de projetos recentes, lembretes e métricas de equipe
- CRUD completo de projetos com visualizações em tabela (DataShell + DataTableToolbar) e cards (grid visual com progress e equipe)
- Sistema de tarefas vinculadas a projetos com board Kanban (drag & drop) e vista lista, suportando subtarefas e estimativas de horas
- Gestão de membros por projeto com papéis (gerente, membro, observador)
- Sistema de lembretes vinculados a projetos e tarefas com prioridades
- Visão global de tarefas cross-projeto para gestores
- Detalhe do projeto com tabs: Visão Geral, Tarefas, Equipe, Arquivos, Cronograma, Configurações
- Novas tabelas no banco de dados: `pm_projetos`, `pm_tarefas`, `pm_membros_projeto`, `pm_lembretes`, `pm_comentarios`, `pm_anexos`
- Integração com entidades existentes: clientes (partes), processos (acervo), contratos, usuários
- Novo item na sidebar de navegação na seção "Serviços"
- Permissões: `projetos.listar`, `projetos.criar`, `projetos.editar`, `projetos.excluir`

## Capabilities

### New Capabilities

- `pm-projects`: CRUD de projetos com campos (nome, descrição, cliente, processo, contrato, status, prioridade, datas, orçamento, responsável, tags). Visualizações em tabela e cards. Filtros por status, responsável, cliente, período. Export CSV/JSON.
- `pm-tasks`: Tarefas vinculadas a projetos com status Kanban (a_fazer, em_progresso, em_revisao, concluido, cancelado). Drag & drop no board. Subtarefas. Atribuição de responsável. Estimativa e registro de horas. Prioridade (baixa, media, alta, urgente). Visão global cross-projeto.
- `pm-team`: Gestão de membros por projeto com papéis (gerente, membro, observador). Vinculação com usuários existentes do sistema.
- `pm-dashboard`: Dashboard analítico com summary cards, gráfico de visão geral (projetos criados vs concluídos ao longo do tempo), gráfico de eficiência (distribuição por status), tabela de projetos recentes, comparativo por período, métricas de equipe.
- `pm-reminders`: Lembretes vinculados a projetos e/ou tarefas com prioridade, data/hora e status de conclusão.
- `pm-database`: Schema do banco de dados com tabelas prefixadas `pm_`, ENUMs, RLS policies, indexes e triggers para o módulo de gestão de projetos.

### Modified Capabilities

- `notifications`: Novos tipos de notificação para eventos de projetos (atribuição de tarefa, mudança de status, prazo próximo, novo membro adicionado)

## Impact

- **Banco de dados**: 6+ novas tabelas com prefixo `pm_`, novos ENUMs (`pm_status_projeto`, `pm_status_tarefa`, `pm_prioridade`, `pm_papel_projeto`), RLS policies, indexes e triggers
- **Navegação**: Novo item "Projetos" na seção `navServicos` do sidebar com subitens (Dashboard, Projetos, Tarefas)
- **Permissões**: Novo recurso `projetos` com operações `listar`, `criar`, `editar`, `excluir` na tabela de permissões
- **Dependências**: Possível adição de lib de drag & drop para Kanban (ex: `@dnd-kit/core`)
- **Código**: Módulo autocontido — impacto externo limitado a sidebar config, permissões e notificações
- **APIs**: Server Actions autocontidas dentro do módulo (`lib/actions/`). Sem novas API routes externas.
