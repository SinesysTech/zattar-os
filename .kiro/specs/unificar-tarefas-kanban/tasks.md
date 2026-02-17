# Tasks: Unificação Tarefas + Kanban

## Status: Not Started

## 1. Preparação
- [x] 1.1 Criar branch `feat/unificar-tarefas-kanban`
- [x] 1.2 Revisar código de Tarefas e Kanban
- [x] 1.3 Documentar funcionalidades a preservar

## 2. Migração de Banco de Dados
- [-] 2.1 Criar migração para adicionar `position INTEGER` em `tasks`
- [~] 2.2 Criar migração para adicionar `quadro_id UUID` em `tasks`
- [~] 2.3 Criar tabela `quadros` com schema completo
- [~] 2.4 Executar migrações no ambiente de desenvolvimento

## 3. Domain Unificado
- [~] 3.1 Mesclar `taskSchema` + `kanbanTaskSchema` em `tarefaSchema`
- [~] 3.2 Adicionar campo `position` ao schema
- [~] 3.3 Adicionar campo `quadroId` ao schema
- [~] 3.4 Criar `quadroSchema` para quadros personalizados
- [~] 3.5 Definir constantes `QUADROS_SISTEMA`
- [~] 3.6 Atualizar `TarefaDisplayItem` interface
- [~] 3.7 Criar schemas de input para quadros (criar, excluir)

## 4. Store Unificado
- [ ] 4.1 Adicionar `viewMode: "lista" | "quadro"` ao store
- [ ] 4.2 Adicionar `setViewMode` action
- [ ] 4.3 Adicionar `quadros: Quadro[]` ao store
- [ ] 4.4 Adicionar `selectedQuadroId: string | null` ao store
- [ ] 4.5 Adicionar `setQuadros` action
- [ ] 4.6 Adicionar `setSelectedQuadroId` action
- [ ] 4.7 Manter todas as actions existentes de tarefas

## 5. Service Layer Unificado
- [ ] 5.1 Importar funções de quadros do Kanban service
- [ ] 5.2 Adaptar `listarQuadros()` para retornar quadros sistema + custom
- [ ] 5.3 Adicionar `criarQuadroCustom()`
- [ ] 5.4 Adicionar `excluirQuadroCustom()`
- [ ] 5.5 Adicionar `obterTarefasDoQuadro(quadroId)`
- [ ] 5.6 Adicionar `reorderTasks()` do Kanban
- [ ] 5.7 Manter todas as funções existentes de tarefas
- [ ] 5.8 Remover imports de `@/features/kanban`

## 6. Repository Layer Unificado
- [ ] 6.1 Adicionar `listQuadrosCustom(usuarioId)`
- [ ] 6.2 Adicionar `createQuadroCustom(usuarioId, titulo)`
- [ ] 6.3 Adicionar `deleteQuadroCustom(usuarioId, quadroId)`
- [ ] 6.4 Adicionar `listTarefasByQuadro(usuarioId, quadroId)`
- [ ] 6.5 Adicionar `updateTaskPosition(taskId, position)`
- [ ] 6.6 Adicionar `updateTaskQuadro(taskId, quadroId)`
- [ ] 6.7 Atualizar `createTask` para suportar `position` e `quadroId`
- [ ] 6.8 Atualizar queries para incluir novos campos

## 7. Importar Componentes do Kanban
- [ ] 7.1 Copiar `custom-board-view.tsx` para `src/app/app/tarefas/components/task-board.tsx`
- [ ] 7.2 Copiar `unified-kanban-card.tsx` para `src/app/app/tarefas/components/task-card.tsx`
- [ ] 7.3 Copiar `board-selector.tsx` para `src/app/app/tarefas/components/quadro-selector.tsx`
- [ ] 7.4 Adaptar imports para usar domain unificado
- [ ] 7.5 Adaptar TaskBoard para usar `TarefaDisplayItem`
- [ ] 7.6 Adaptar TaskCard para mostrar subtarefas, comentários, anexos
- [ ] 7.7 Adaptar QuadroSelector para usar store unificado

## 8. Atualizar TarefasClient
- [ ] 8.1 Adicionar `viewMode` do store
- [ ] 8.2 Adicionar renderização condicional (lista vs quadro)
- [ ] 8.3 Passar `quadros` como prop do page.tsx
- [ ] 8.4 Inicializar `setQuadros` no useEffect
- [ ] 8.5 Manter TaskDetailSheet e TaskDialog globais

## 9. Atualizar DataTable (Lista)
- [ ] 9.1 Adicionar `ViewModePopover` ao toolbar
- [ ] 9.2 Configurar opções: Lista e Quadro
- [ ] 9.3 Posicionar ao lado do botão de export
- [ ] 9.4 Manter todos os filtros e funcionalidades existentes

## 10. Atualizar TaskBoard (Quadro)
- [ ] 10.1 Adicionar toolbar com `ViewModePopover` + `QuadroSelector`
- [ ] 10.2 Implementar colunas por status (Backlog, To Do, In Progress, Done, Canceled)
- [ ] 10.3 Implementar drag-and-drop entre colunas (muda status)
- [ ] 10.4 Implementar drag-and-drop dentro da coluna (reordena)
- [ ] 10.5 Filtrar tarefas por `selectedQuadroId`
- [ ] 10.6 Marcar eventos virtuais como não arrastáveis
- [ ] 10.7 Clique no card abre TaskDetailSheet

## 11. Actions
- [ ] 11.1 Adicionar `actionListarQuadros`
- [ ] 11.2 Adicionar `actionCriarQuadroCustom`
- [ ] 11.3 Adicionar `actionExcluirQuadroCustom`
- [ ] 11.4 Adicionar `actionReordenarTarefas`
- [ ] 11.5 Adicionar `actionMoverTarefaParaQuadro`
- [ ] 11.6 Atualizar `actionCriarTarefa` para suportar `quadroId`
- [ ] 11.7 Manter todas as actions existentes de tarefas

## 12. Atualizar page.tsx
- [ ] 12.1 Buscar quadros: `await tarefasService.listarQuadros(user.id)`
- [ ] 12.2 Passar `quadros` como prop para `TarefasClient`
- [ ] 12.3 Manter busca de tarefas + eventos virtuais

## 13. MCP Tools
- [ ] 13.1 Adicionar tool `listar_quadros`
- [ ] 13.2 Adicionar tool `criar_quadro_custom`
- [ ] 13.3 Adicionar tool `excluir_quadro_custom`
- [ ] 13.4 Atualizar tool `criar_tarefa` para suportar `quadroId`

## 14. Remover Módulo Kanban
- [ ] 14.1 Remover pasta `src/features/kanban/`
- [ ] 14.2 Remover rota `/app/kanban/page.tsx`
- [ ] 14.3 Remover entrada "Kanban" da sidebar
- [ ] 14.4 Verificar e remover todos os imports de `@/features/kanban`
- [ ] 14.5 Verificar e remover referências a `/kanban` no código

## 15. Testes
- [ ] 15.1 Executar `npm run type-check` e corrigir erros
- [ ] 15.2 Executar `npm run build` e verificar build
- [ ] 15.3 Testar visualização de lista:
  - [ ] 15.3.1 Listar tarefas
  - [ ] 15.3.2 Filtrar por status, prioridade, tipo
  - [ ] 15.3.3 Ordenar colunas
  - [ ] 15.3.4 Paginação
  - [ ] 15.3.5 Criar nova tarefa
  - [ ] 15.3.6 Editar tarefa
  - [ ] 15.3.7 Eventos virtuais aparecem
- [ ] 15.4 Testar visualização de quadro:
  - [ ] 15.4.1 Alternar para modo quadro
  - [ ] 15.4.2 Ver colunas por status
  - [ ] 15.4.3 Arrastar card entre colunas (muda status)
  - [ ] 15.4.4 Arrastar card dentro da coluna (reordena)
  - [ ] 15.4.5 Eventos virtuais não são arrastáveis
  - [ ] 15.4.6 Clique no card abre detalhes
- [ ] 15.5 Testar quadros personalizados:
  - [ ] 15.5.1 Criar quadro custom
  - [ ] 15.5.2 Selecionar quadro no dropdown
  - [ ] 15.5.3 Ver apenas tarefas do quadro
  - [ ] 15.5.4 Excluir quadro custom
- [ ] 15.6 Testar alternância de visualização:
  - [ ] 15.6.1 Alternar lista → quadro
  - [ ] 15.6.2 Alternar quadro → lista
  - [ ] 15.6.3 Estado persiste durante sessão

## 16. Documentação
- [ ] 16.1 Adicionar comentário explicando visualizações em `tarefas-client.tsx`
- [ ] 16.2 Documentar uso de quadros personalizados
- [ ] 16.3 Atualizar README.md do módulo (se existir)

## 17. Code Review e Deploy
- [ ] 17.1 Revisar todas as mudanças
- [ ] 17.2 Criar Pull Request
- [ ] 17.3 Solicitar code review
- [ ] 17.4 Fazer merge após aprovação
- [ ] 17.5 Monitorar erros após deploy

## Notas de Implementação

### Ordem Recomendada
1. Migração de banco (seção 2)
2. Domain e Store (seções 3-4)
3. Service e Repository (seções 5-6)
4. Importar componentes do Kanban (seção 7)
5. Atualizar componentes existentes (seções 8-10)
6. Actions e page.tsx (seções 11-12)
7. MCP tools (seção 13)
8. Remover Kanban (seção 14)
9. Testes (seção 15)

### Arquivos Principais
- `src/app/app/tarefas/domain.ts`
- `src/app/app/tarefas/store.ts`
- `src/app/app/tarefas/service.ts`
- `src/app/app/tarefas/repository.ts`
- `src/app/app/tarefas/tarefas-client.tsx`
- `src/app/app/tarefas/components/data-table.tsx`
- `src/app/app/tarefas/components/task-board.tsx`
- `src/app/app/tarefas/components/task-card.tsx`
- `src/app/app/tarefas/components/quadro-selector.tsx`
- `src/app/app/tarefas/page.tsx`

### Arquivos a Remover
- `src/features/kanban/` (pasta inteira)
- `src/app/app/kanban/` (se existir)

### Verificações Importantes
- [ ] Nenhum import de `@/features/kanban`
- [ ] Nenhuma referência a `/kanban` nas rotas
- [ ] ViewModePopover posicionado corretamente
- [ ] Drag-and-drop funcional
- [ ] Eventos virtuais não arrastáveis
- [ ] Quadros custom funcionais
- [ ] Build bem-sucedido
- [ ] Sem erros de TypeScript

## Estimativa de Tempo
- Preparação: 30 min
- Migração de banco: 1h
- Domain e Store: 1h
- Service e Repository: 2h
- Componentes: 3h
- Actions e integração: 2h
- Remoção do Kanban: 1h
- Testes: 2h
- Documentação: 30 min
- Code review: 1h

**Total estimado**: ~14 horas
