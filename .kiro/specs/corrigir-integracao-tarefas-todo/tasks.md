# Tasks: Correção da Integração Tarefas + To-Do

## Status: Not Started

## 1. Preparação e Setup
- [x] 1.1 Criar branch `fix/tarefas-remove-kanban`
- [x] 1.2 Revisar código atual e identificar todas as dependências
- [x] 1.3 Fazer backup dos arquivos que serão modificados

## 2. Remover Componentes de Kanban
- [x] 2.1 Remover arquivo `src/app/app/tarefas/components/task-board.tsx`
- [x] 2.2 Remover arquivo `src/app/app/tarefas/components/task-card.tsx`
- [x] 2.3 Remover imports de `@dnd-kit/*` não utilizados

## 3. Simplificar Store
- [x] 3.1 Remover `viewMode: "lista" | "quadro"` do `TarefaStore` interface
- [x] 3.2 Remover `setViewMode` do `TarefaStore` interface
- [x] 3.3 Remover implementação de `setViewMode` do store
- [x] 3.4 Remover valor inicial `viewMode: "lista"` do estado

## 4. Atualizar Domain
- [x] 4.1 Remover campo `position: z.number().default(0)` do `taskSchema`
- [x] 4.2 Remover `position: true` do partial em `createTaskSchema`
- [x] 4.3 Remover `taskPositionsSchema` e `TaskPositionsInput` type
- [x] 4.4 Verificar se `TarefaDisplayItem` interface precisa de ajustes

## 5. Simplificar TarefasClient
- [x] 5.1 Remover imports: `TaskBoard`, `DataTableToolbar`, `ViewModePopover`, `ViewModeOption`, `List`, `LayoutGrid`
- [x] 5.2 Remover `TASK_VIEW_OPTIONS` constant
- [x] 5.3 Remover `viewMode` e `setViewMode` do destructuring do store
- [x] 5.4 Remover renderização condicional (if viewMode === "lista")
- [x] 5.5 Remover toolbar separado para visualização em quadro
- [x] 5.6 Manter apenas: `<DataTable />`, `<TaskDetailSheet />`, `<TaskDialog />`
- [x] 5.7 Remover `space-y-4` do container (não é mais necessário)

## 6. Atualizar DataTable
- [x] 6.1 Remover imports: `ViewModePopover`, `ViewModeOption`, `List`, `LayoutGrid`
- [x] 6.2 Remover `TASK_VIEW_OPTIONS` constant
- [x] 6.3 Remover `viewMode` e `setViewMode` do destructuring do store
- [x] 6.4 Remover `viewModeSlot` do `DataTableToolbar`
- [x] 6.5 Verificar se paginação está com `py-4` (já deve estar corrigido)

## 7. Atualizar Service Layer
- [x] 7.1 Remover função `reorderTasks` de `service.ts`
- [x] 7.2 Remover import de `taskPositionsSchema` e `TaskPositionsInput`
- [x] 7.3 Atualizar `eventoToTarefaDisplay` para remover `position: 0`
- [x] 7.4 Verificar se há outras referências a `position` no service

## 8. Atualizar Repository
- [x] 8.1 Remover função `reorderTasks` de `repository.ts`
- [x] 8.2 Remover função auxiliar `getMaxPosition` (se existir)
- [x] 8.3 Atualizar `createTask` para não calcular/inserir `position`
- [x] 8.4 Verificar se há outras referências a `position` no repository

## 9. Atualizar Actions
- [x] 9.1 Remover `actionReordenarTarefas` de `actions/tarefas-actions.ts`
- [x] 9.2 Remover import de `taskPositionsSchema`
- [x] 9.3 Verificar se `actionCriarTarefa` não passa `position`
- [x] 9.4 Verificar exports no arquivo de actions

## 10. Atualizar MCP Tools
- [x] 10.1 Remover `position: 0` do tool `criar_tarefa` em `tarefas-tools.ts`
- [x] 10.2 Remover `position: 0` do tool `agendar_reuniao_zoom`
- [x] 10.3 Verificar se há outros tools que usam `position`

## 11. Limpeza de Imports e Dependências
- [x] 11.1 Verificar e remover imports não utilizados em todos os arquivos modificados
- [x] 11.2 Verificar se `@dnd-kit/*` ainda é necessário (pode ser usado por outros módulos)
- [x] 11.3 Executar linter para identificar código morto

## 12. Testes
- [x] 12.1 Executar `npm run type-check` e corrigir erros de tipo
- [x] 12.2 Executar testes unitários: `npm run test:unit`
- [x] 12.3 Executar testes de integração relacionados a tarefas
- [~] 12.4 Testar manualmente no navegador:
  - [ ] 12.4.1 Listar tarefas
  - [ ] 12.4.2 Criar nova tarefa
  - [ ] 12.4.3 Editar tarefa existente
  - [ ] 12.4.4 Adicionar subtarefa
  - [ ] 12.4.5 Adicionar comentário
  - [ ] 12.4.6 Adicionar anexo
  - [ ] 12.4.7 Filtrar tarefas
  - [ ] 12.4.8 Ordenar colunas
  - [ ] 12.4.9 Paginação
  - [ ] 12.4.10 Verificar espaçamento da paginação

## 13. Documentação
- [x] 13.1 Adicionar comentário no topo de `tarefas-client.tsx` explicando que é visualização de lista
- [x] 13.2 Adicionar comentário mencionando que Kanban está em `/kanban`
- [x] 13.3 Atualizar README.md do módulo (se existir)

## 14. Melhorias Opcionais
- [ ] 14.1* Adicionar link/botão "Ver em Kanban" que redireciona para `/kanban`
- [ ] 14.2* Adicionar tooltip explicativo sobre a diferença entre Tarefas e Kanban
- [ ] 14.3* Verificar se sidebar tem ícones/descrições claras para Tarefas vs Kanban

## 15. Code Review e Deploy
- [~] 15.1 Executar `npm run build` para verificar build de produção
- [x] 15.2 Revisar todas as mudanças no Git
- [~] 15.3 Criar Pull Request com descrição detalhada
- [~] 15.4 Solicitar code review
- [~] 15.5 Fazer merge após aprovação
- [~] 15.6 Monitorar erros após deploy

## Notas de Implementação

### Ordem Recomendada
1. Começar pelos componentes (remover TaskBoard, TaskCard)
2. Atualizar store e domain (remover viewMode e position)
3. Simplificar TarefasClient e DataTable
4. Atualizar service/repository/actions
5. Ajustar MCP tools
6. Testes e validação

### Arquivos Principais a Modificar
- `src/app/app/tarefas/tarefas-client.tsx`
- `src/app/app/tarefas/components/data-table.tsx`
- `src/app/app/tarefas/store.ts`
- `src/app/app/tarefas/domain.ts`
- `src/app/app/tarefas/service.ts`
- `src/app/app/tarefas/repository.ts`
- `src/app/app/tarefas/actions/tarefas-actions.ts`
- `src/lib/mcp/registries/tarefas-tools.ts`

### Arquivos a Remover
- `src/app/app/tarefas/components/task-board.tsx`
- `src/app/app/tarefas/components/task-card.tsx`

### Verificações Importantes
- [ ] Nenhum erro de TypeScript
- [ ] Build de produção bem-sucedido
- [ ] Todos os testes passando
- [ ] Paginação com espaçamento correto (`py-4`)
- [ ] Funcionalidades de To-Do preservadas (subtarefas, comentários, anexos)
- [ ] Eventos virtuais ainda aparecem na lista

### Riscos a Monitorar
- Quebra de funcionalidades existentes
- Erros de tipo relacionados a `position`
- Imports não resolvidos após remoção de componentes
- Testes falhando após mudanças

## Estimativa de Tempo
- Preparação: 15 min
- Remoção de componentes: 30 min
- Atualização de store/domain: 30 min
- Simplificação de componentes: 45 min
- Atualização de service/repository/actions: 45 min
- MCP tools: 15 min
- Testes: 1h
- Documentação: 30 min
- Code review e deploy: 30 min

**Total estimado**: ~4-5 horas
