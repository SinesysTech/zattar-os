## 1. Implementation
- [ ] 1.1 Definir modelo de dados (tabelas, constraints, índices) em `supabase/schemas`
- [ ] 1.2 Definir RLS policies para as tabelas do módulo (authenticated + service_role)
- [ ] 1.3 Implementar `domain.ts` (Zod + tipos) para o contrato do template
- [ ] 1.4 Implementar `repository.ts` (queries Supabase) e `service.ts` (validação/regras)
- [ ] 1.5 Implementar server actions em `actions/todo-actions.ts` (CRUD + reorder + starred + subtasks + comments + files)
- [ ] 1.6 Atualizar `page.tsx` para carregar do banco com `authenticateRequest()`
- [ ] 1.7 Adaptar UI para persistência (substituir Zustand “source of truth” por initialData + mutations via actions)
- [ ] 1.8 Integrar rota no `AppSidebar`
- [ ] 1.9 Adicionar testes mínimos (unit para service + smoke e2e opcional)


