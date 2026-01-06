# Change: adicionar módulo Todo List (baseado no template `todo-list-app`)

## Why
Hoje o template `src/app/(dashboard)/todo-list-app` funciona apenas com dados locais (`data/tasks.json` + Zustand), então não persiste tarefas do usuário e não integra com autenticação/RLS do Supabase.

## What Changes
- Criar persistência no Supabase para o módulo **Todo List**, alinhada ao contrato do template (status, prioridade, due date, lembrete, favoritos, ordenação).
- Adicionar **service/repository/server actions** no mesmo padrão de `tarefas`, `kanban`, `notas`.
- Trocar o carregamento do `tasks.json` por leitura via service (Supabase) usando usuário autenticado.
- Integrar o módulo no menu lateral (`AppSidebar`) para navegação no dashboard.
- Ajustar o template para não depender de classes de cor hardcoded em badges (aderir ao design system).

## Impact
- **Affected specs**:
  - `todo-list` (nova capability)
  - (potencial) `dashboard` (nova entrada de navegação)
- **Affected code**:
  - `src/app/(dashboard)/todo-list-app/*` (backend + ajustes de UI para persistência)
  - `src/components/layout/app-sidebar.tsx` (menu)
  - `supabase/schemas/*` (novas tabelas + RLS + índices)

## Open Questions (para aprovação)
- O módulo **Todo List** é **novo e independente** do módulo `Tarefas` (TanStack Table), ou deve **substituir** `Tarefas`?
- O campo **Assigned To** deve:
  - **A)** permitir texto livre (como no template), ou
  - **B)** integrar com `public.usuarios` (seleção de usuários reais do sistema)?
- URL final:
  - manter `/todo-list-app` (rota existente), ou renomear para algo mais curto (ex.: `/todo`)?


