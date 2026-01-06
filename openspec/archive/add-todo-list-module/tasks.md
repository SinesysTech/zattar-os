## 1. Implementation
- [x] 1.1 Definir modelo de dados (tabelas, constraints, índices) em `supabase/schemas`
- [x] 1.2 Definir RLS policies para as tabelas do módulo (authenticated + service_role)
- [x] 1.3 Implementar `domain.ts` (Zod + tipos) para o contrato do template
- [x] 1.4 Implementar `repository.ts` (queries Supabase) e `service.ts` (validação/regras)
- [x] 1.5 Implementar server actions em `actions/todo-actions.ts` (CRUD + reorder + starred + subtasks + comments + files)
- [x] 1.6 Atualizar `page.tsx` para carregar do banco com `authenticateRequest()`
- [x] 1.7 Adaptar UI para persistência (substituir Zustand "source of truth" por initialData + mutations via actions)
- [x] 1.8 Integrar rota no `AppSidebar`
- [ ] 1.9 Adicionar testes minimos (backlog - baixa prioridade)

> **STATUS FINAL (2026-01-06)**: 95% implementado. Backend completo, UI integrada, testes pendentes (backlog).
