# Regras de Negócio — Project Management

## Contexto

Módulo de gestão de projetos internos do escritório com quadro Kanban, tarefas, equipes e lembretes. Pode vincular projetos a clientes, processos e contratos.

## Estrutura FSD

```
project-management/
├── domain.ts          # Zod schemas, tipos TS, enums, helpers de conversão
├── service.ts         # Re-exports dos serviços (project, task, team, reminder, dashboard)
├── repository.ts      # Re-exports dos repositórios Supabase
├── actions/           # Server Actions com barrel export
│   ├── index.ts
│   ├── project.actions.ts
│   ├── task.actions.ts
│   ├── team.actions.ts
│   ├── reminder.actions.ts
│   └── file.actions.ts
├── components/        # UI organizada em: dashboard, projects, tasks, team, shared
├── hooks/             # Hooks de cliente (use-task-board)
├── lib/               # Implementações internas (services/, repositories/)
├── index.ts           # Barrel export — API pública do módulo
├── layout.tsx         # PageShell wrapper
├── page.tsx           # Dashboard principal
└── RULES.md           # Este arquivo
```

## Entidades

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Projeto | `pm_projetos` | Projeto com status, prioridade, orçamento, progresso |
| Tarefa | `pm_tarefas` | Tarefa vinculada a projeto, com Kanban e subtarefas |
| MembroProjeto | `pm_membros_projeto` | Vínculo usuário-projeto com papel |
| Lembrete | `pm_lembretes` | Lembrete com data/hora e prioridade |
| Comentário | `pm_comentarios` | Comentário em projeto ou tarefa |
| Anexo | `pm_anexos` | Arquivo vinculado a projeto ou tarefa |

## Regras de Validação

- **Nome do projeto**: obrigatório, máx 255 caracteres
- **Descrição**: máx 5000 caracteres
- **Responsável**: obrigatório (ID de usuário válido)
- **Orçamento**: >= 0 quando informado
- **Progresso manual**: 0-100 quando informado
- **Título da tarefa**: obrigatório, máx 255 caracteres
- **Estimativa de horas**: >= 0 quando informada

## Regras de Negócio

- **Status de projeto**: planejamento → ativo → pausado → concluído | cancelado
- **Status de tarefa (Kanban)**: a_fazer, em_progresso, em_revisao, concluido (cancelado excluído do Kanban)
- **Prioridades**: baixa, media, alta, urgente
- **Papéis no projeto**: gerente, membro, observador
- **Subtarefas**: Tarefas suportam hierarquia via `tarefaPaiId`
- **Vinculação**: Projetos podem ser vinculados a `clienteId`, `processoId` e `contratoId`
- **Progresso**: Calculado automaticamente por tarefas concluídas, com override manual via `progressoManual`
- **Orçamento**: Controle de `orcamento` vs `valorGasto` e `estimativaHoras` vs `horasRegistradas` por tarefa
- **Ordem Kanban**: Campo `ordemKanban` para drag-and-drop no quadro
- **Auto-adição**: Criador do projeto é automaticamente adicionado como gerente
- **Proteção de gerente**: Não é possível remover o único gerente de um projeto
- **Validação de membro**: Responsável de tarefa deve ser membro do projeto

## Filtros

- Projetos: busca (nome/descrição), status, prioridade, responsável, cliente, data início
- Tarefas: busca (título/descrição), projeto, status, prioridade, responsável, data prazo

## Integrações

- `clientes` — vínculo opcional via `clienteId`
- `processos` — vínculo opcional via `processoId`
- `contratos` — vínculo opcional via `contratoId`
- `usuarios` — responsável, membros da equipe

## Revalidação de Cache

- Todas as mutations revalidam `/app/project-management` e sub-rotas relevantes
