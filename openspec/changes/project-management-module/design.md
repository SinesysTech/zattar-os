## Context

O Zattar OS é um sistema jurídico que já possui 31 módulos, 103 tabelas no banco, e segue padrões consolidados: Feature-Sliced Design, Result<T> pattern, Server Components com data fetching paralelo, DataShell + DataTableToolbar para tabelas, e Supabase com RLS. O módulo de gestão de projetos é um novo módulo autocontido que deve seguir todos esses padrões.

Templates de UI já foram copiados para `src/app/app/project-management/` com 12 componentes de dashboard prontos (summary cards, charts, tables, reminders). Esses templates usam dados mock e imports do kit original que precisam ser adaptados.

O módulo deve ser **autocontido**: toda a lógica (services, repositories, actions, types, hooks, components) fica dentro da pasta do módulo, não em `src/features/`. Isso facilita migração independente futura.

## Goals / Non-Goals

**Goals:**

- Módulo autocontido completo para gestão de projetos com dashboard, CRUD de projetos, sistema de tarefas (Kanban + lista), gestão de equipe e lembretes
- Integração com entidades existentes (clientes, processos, contratos, usuários) via foreign keys opcionais
- Seguir todos os padrões do Zattar OS (DataShell, Result<T>, Server Actions, Zod, RLS)
- Reutilizar os templates de UI existentes como base, adaptando ao domínio e conectando a dados reais
- Suportar permissões granulares via sistema de permissões existente
- Dashboard analítico funcional com métricas reais do banco de dados

**Non-Goals:**

- Gantt chart interativo com edição inline (fase futura)
- Time tracking granular com timer em tempo real (fase futura)
- Integração com ferramentas externas (Jira, Trello, etc.)
- Sistema de faturamento baseado em projetos (usar módulo financeiro existente)
- Automações/workflows (ex: mover tarefa automaticamente quando PR é merged)
- Notificações em tempo real via WebSocket (usar polling com revalidação do Next.js)
- Relatórios PDF exportáveis (fase futura)

## Decisions

### D1: Estrutura autocontida vs Feature-Sliced centralizado

**Decisão**: Módulo autocontido dentro de `src/app/app/project-management/`.

**Alternativas consideradas**:
- **Feature-Sliced em `src/features/project-management/`**: Padrão usado nos módulos legados. Separa domínio do roteamento, mas acopla módulos indiretamente.
- **Autocontido (escolhido)**: Tudo dentro da pasta do módulo. Facilita migração, refactoring e entendimento. É o novo padrão para módulos do Zattar OS.

**Rationale**: O projeto está migrando para módulos autocontidos. Começar o módulo de projetos já no padrão novo evita refactoring futuro.

**Estrutura interna**:
```
project-management/
├── page.tsx                    # Dashboard (Server Component)
├── layout.tsx                  # Layout do módulo
├── projects/                   # Rotas de projetos
│   ├── page.tsx                # Lista
│   ├── new/page.tsx            # Criar
│   └── [id]/                   # Detalhe + sub-rotas
├── tasks/                      # Rotas de tarefas
├── components/                 # Componentes UI do módulo
│   ├── dashboard/              # Componentes do dashboard
│   ├── projects/               # Componentes de projetos
│   ├── tasks/                  # Componentes de tarefas
│   └── shared/                 # Compartilhados do módulo
├── lib/                        # Lógica de negócio
│   ├── domain.ts               # Types + Zod schemas
│   ├── services/               # Business logic
│   ├── repositories/           # Supabase queries
│   └── actions/                # Server Actions
└── hooks/                      # Hooks do módulo
```

### D2: Prefixo `pm_` nas tabelas do banco

**Decisão**: Todas as tabelas usam prefixo `pm_` (project management).

**Alternativas consideradas**:
- Sem prefixo (ex: `projetos`, `tarefas_projeto`): Pode conflitar com tabelas existentes.
- Com prefixo (escolhido): `pm_projetos`, `pm_tarefas`, `pm_membros`, etc.

**Rationale**: O sistema já tem 103 tabelas. O prefixo evita colisão de nomes (já existe conceito de "tarefas" no módulo de planner) e deixa claro o domínio no banco.

### D3: Kanban com @dnd-kit

**Decisão**: Usar `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop do Kanban.

**Alternativas consideradas**:
- `react-beautiful-dnd`: Descontinuado, sem suporte para React 19.
- `@hello-pangea/dnd`: Fork do react-beautiful-dnd, mas sem suporte oficial React 19.
- `@dnd-kit` (escolhido): Modular, leve, suporte React 19, acessível (WAI-ARIA).

**Rationale**: É a lib de drag & drop mais moderna e compatível com React 19 + Next.js 16. Modular permite importar apenas o necessário.

### D4: Server Components para data fetching, Client Components para interatividade

**Decisão**: Seguir o padrão do Zattar OS — pages são Server Components que fazem fetch paralelo e passam dados para Client Components.

**Estrutura**:
```tsx
// page.tsx (Server Component)
async function ProjectsPage() {
  const [projects, users, clients] = await Promise.all([
    projectService.list({ ... }),
    userService.listActive(),
    clientService.listActive()
  ])
  return <ProjectsTableWrapper initialData={projects} users={users} clients={clients} />
}

// components/projects/project-table-wrapper.tsx (Client Component)
"use client"
function ProjectsTableWrapper({ initialData, users, clients }) {
  // TanStack Table, filtros, interatividade
}
```

### D5: Integração com entidades existentes via foreign keys opcionais

**Decisão**: Campos `cliente_id`, `processo_id` e `contrato_id` em `pm_projetos` são nullable foreign keys.

**Rationale**: Um projeto pode existir independentemente, mas opcionalmente se vincular a um cliente, processo ou contrato existente. Isso mantém o módulo independente mas integrável.

### D6: Cálculo de progresso do projeto

**Decisão**: Progresso calculado automaticamente com base nas tarefas (% tarefas concluídas), com override manual opcional.

**Alternativas**:
- Somente manual: Requer atualização constante pelo usuário.
- Somente automático: Nem sempre reflete a realidade.
- Híbrido (escolhido): Auto-calculado por padrão, com campo `progresso_manual` que sobrescreve quando preenchido.

### D7: Dashboard com métricas reais via dashboard.service

**Decisão**: Um service dedicado (`dashboard.service.ts`) agrega dados via queries otimizadas no Supabase (views ou functions SQL), não em runtime no JavaScript.

**Rationale**: Agregar dados de milhares de projetos/tarefas em JS seria lento. Views/functions SQL são mais eficientes e podem ser cacheadas.

## Risks / Trade-offs

- **[Complexidade do Kanban]** → Drag & drop cross-column com persistência requer cuidado com race conditions. **Mitigation**: Optimistic updates com rollback em caso de erro. Debounce nas atualizações de ordem.

- **[Performance do Dashboard]** → Queries de agregação podem ser lentas em volumes grandes. **Mitigation**: Materializar métricas com views SQL ou functions. Cache via `revalidatePath` do Next.js com revalidação temporal.

- **[Conflito de nomes com módulo de tarefas existente]** → Já existe `/app/tarefas` no sistema. **Mitigation**: O módulo PM tem suas próprias tarefas (`pm_tarefas`) separadas do planner existente. Futuramente pode haver unificação, mas por ora são independentes.

- **[Volume de migração SQL]** → 6+ tabelas novas com ENUMs, RLS, indexes e triggers é uma migração significativa. **Mitigation**: Migração incremental — criar tabelas base primeiro, adicionar RLS e triggers depois. Rollback limpo (DROP TABLE IF EXISTS).

- **[Dependência de @dnd-kit]** → Nova dependência externa para o Kanban. **Mitigation**: Lib é modular (importar só core + sortable), bem mantida, e o Kanban é um feature isolado que pode funcionar sem drag & drop (fallback para dropdown de status).

## Migration Plan

1. **Fase 1 - Schema**: Criar migração SQL com tabelas, ENUMs, RLS policies e indexes
2. **Fase 2 - Core**: Implementar domain, repositories e services para projetos e tarefas
3. **Fase 3 - UI Dashboard**: Adaptar templates existentes, conectar a dados reais
4. **Fase 4 - CRUD Projetos**: Lista, criação, edição, detalhe do projeto
5. **Fase 5 - Tarefas + Kanban**: Sistema de tarefas com board e lista
6. **Fase 6 - Equipe + Lembretes**: Gestão de membros e lembretes
7. **Fase 7 - Integrações**: Sidebar, permissões, notificações

**Rollback**: Remover entrada do sidebar, dropar tabelas `pm_*`, remover pasta do módulo. Sem impacto em outros módulos por ser autocontido.

## Open Questions

- Unificar futuramente as tarefas do PM com o módulo `/app/tarefas` existente, ou mantê-los independentes?
- Incluir campo de horas registradas nesta primeira versão ou postergar time tracking?
- O cronograma/timeline deve ser uma visualização simples (lista cronológica) ou um Gantt básico?
