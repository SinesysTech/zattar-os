# Tasks: Visualização Detalhada de Captura

Este arquivo lista todas as tarefas necessárias para implementar a visualização detalhada de captura em página dedicada.

## Phase 1: Criar estrutura de rota e página base

### Task 1.1: Criar diretório da rota
- **File**: `app/(dashboard)/captura/historico/[id]/`
- **Action**: Criar estrutura de diretórios
- **Validation**: Estrutura de pastas existe
- **Dependencies**: Nenhuma

### Task 1.2: Criar page.tsx (Server Component)
- **File**: `app/(dashboard)/captura/historico/[id]/page.tsx`
- **Action**:
  - Implementar Server Component
  - Adicionar validação de ID
  - Implementar generateMetadata dinâmica
  - Buscar dados da captura via API
- **Validation**:
  - Página carrega com ID válido
  - Metadata dinâmica funciona
  - ID inválido mostra erro apropriado
- **Dependencies**: Task 1.1
- **Reference**: `app/(dashboard)/processos/[id]/page.tsx`

## Phase 2: Criar componente de visualização

### Task 2.1: Criar captura-visualizacao.tsx (Client Component)
- **File**: `app/(dashboard)/captura/historico/[id]/captura-visualizacao.tsx`
- **Action**:
  - Migrar conteúdo do `CapturaDetailsDialog`
  - Adaptar layout para página completa
  - Adicionar botão de voltar
  - Implementar busca de dados com loading/error states
  - Manter funcionalidade de deletar
- **Validation**:
  - Componente renderiza todos os dados corretamente
  - Estados de loading e erro funcionam
  - Botão de deletar funciona e redireciona após sucesso
- **Dependencies**: Task 1.2
- **Reference**:
  - `app/(dashboard)/captura/components/captura-details-dialog.tsx` (conteúdo)
  - `app/(dashboard)/processos/[id]/processo-visualizacao.tsx` (estrutura)

## Phase 3: Modificar tabela de histórico

### Task 3.1: Atualizar HistoricoCapturas para navegação
- **File**: `app/(dashboard)/captura/components/historico-capturas.tsx`
- **Action**:
  - Modificar handler do botão de visualização para usar `useRouter().push()`
  - Remover estado do dialog (`detailsDialogOpen`, `selectedCaptura`)
  - Remover importação e uso do `CapturaDetailsDialog`
- **Validation**:
  - Clique no botão de visualização navega para página correta
  - Nenhum erro de console
- **Dependencies**: Task 2.1

## Phase 4: Limpeza

### Task 4.1: Remover CapturaDetailsDialog
- **File**: `app/(dashboard)/captura/components/captura-details-dialog.tsx`
- **Action**: Deletar arquivo (não é mais usado)
- **Validation**:
  - Buscar referências no código (deve retornar vazio)
  - Build não quebra
- **Dependencies**: Task 3.1
- **Verification**: `rg "CapturaDetailsDialog" app/`

### Task 4.2: Atualizar imports em outros componentes
- **Files**: Qualquer arquivo que importe `CapturaDetailsDialog`
- **Action**: Remover imports não utilizados
- **Validation**: TypeScript não reporta erros
- **Dependencies**: Task 4.1

## Phase 5: Validação e testes

### Task 5.1: Teste manual end-to-end
- **Action**:
  - [ ] Navegar para `/captura`
  - [ ] Clicar em visualizar (olho) em uma captura
  - [ ] Verificar que página de detalhes carrega
  - [ ] Verificar que todos os dados são exibidos corretamente
  - [ ] Testar botão de voltar
  - [ ] Testar compartilhamento de URL
  - [ ] Testar deletar captura (deve redirecionar)
  - [ ] Testar ID inválido (deve mostrar erro)
- **Dependencies**: Tasks 1-4

### Task 5.2: Verificar TypeScript
- **Action**: Rodar `npm run type-check`
- **Validation**: Sem erros de tipos
- **Dependencies**: Tasks 1-4

### Task 5.3: Verificar build
- **Action**: Rodar `npm run build`
- **Validation**: Build completa sem erros
- **Dependencies**: Tasks 1-4

## Parallelization Opportunities

- Tasks 1.1, 1.2 podem ser feitas juntas
- Task 2.1 pode começar após 1.2
- Tasks 4.1 e 4.2 podem ser feitas juntas
- Tasks 5.1, 5.2, 5.3 podem ser feitas em paralelo

## Rollback Plan

Se necessário reverter:
1. Restaurar `CapturaDetailsDialog`
2. Reverter mudanças em `HistoricoCapturas`
3. Deletar nova rota `[id]`
4. Commit de rollback com referência ao original
