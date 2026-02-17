# Plano de Implementação: Correção da Visualização de Tarefas

## Visão Geral

Este plano implementa as correções para dois problemas na interface de tarefas:
1. Espaçamento inadequado entre tabela e paginação
2. Alternância de visualização entre lista e quadro não funcionando corretamente

As correções são simples e focadas em UI/UX, sem alterações na lógica de negócio.

## Tarefas

- [x] 1. Corrigir espaçamento da paginação no DataShell
  - Adicionar margem superior (mt-4) ao footer do DataShell
  - Adicionar comentário explicativo sobre o espaçamento
  - Arquivo: `src/components/shared/data-shell/data-shell.tsx`
  - _Requisitos: 3.1_

- [x] 2. Configurar opções do ViewModePopover no DataTable
  - Importar ícones List e LayoutGrid do lucide-react
  - Passar array de opções customizadas para ViewModePopover
  - Incluir apenas opções "lista" e "quadro"
  - Arquivo: `src/app/app/tarefas/components/data-table.tsx`
  - _Requisitos: 3.2_

- [x] 3. Configurar opções do ViewModePopover no TaskBoard
  - Importar ícones List e LayoutGrid do lucide-react
  - Passar array de opções customizadas para ViewModePopover
  - Incluir apenas opções "lista" e "quadro"
  - Arquivo: `src/app/app/tarefas/components/task-board.tsx`
  - _Requisitos: 3.2_

- [x] 4. Checkpoint - Testes manuais e validação
  - Verificar espaçamento visual da paginação (16px)
  - Testar alternância Lista → Quadro
  - Testar alternância Quadro → Lista
  - Confirmar que apenas 2 opções aparecem no ViewModePopover
  - Verificar que drag-and-drop continua funcionando
  - Verificar que filtros e paginação continuam funcionando
  - Testar em diferentes breakpoints (mobile, tablet, desktop)
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Todas as tarefas são de correção de UI/UX
- Não há alterações em domain, service ou repository
- Não há novos testes unitários necessários (mudanças visuais)
- Estimativa total: 30 minutos
- Build deve passar sem erros TypeScript
