# Tasks - Padronização de Layout - Assinatura Digital

## 1. Preparação e Setup
- [x] 1.1 Revisar design document e requirements
- [x] 1.2 Criar branch feature/padronizar-assinatura-digital
- [x] 1.3 Verificar dependências e versões dos componentes

## 2. Implementar Padronização - Templates Page

### 2.1 Adicionar Estados e Hooks
- [x] 2.1.1 Adicionar estado `density` com tipo `'compact' | 'standard' | 'relaxed'`
- [x] 2.1.2 Adicionar estado `rowSelection` com tipo `Record<string, boolean>`
- [x] 2.1.3 Verificar se todos os hooks necessários estão importados

### 2.2 Atualizar DataTableToolbar
- [x] 2.2.1 Adicionar prop `title="Templates"` ao DataTableToolbar
- [x] 2.2.2 Adicionar prop `density={density}` ao DataTableToolbar
- [x] 2.2.3 Adicionar prop `onDensityChange={setDensity}` ao DataTableToolbar
- [x] 2.2.4 Substituir `actionSlot` por `actionButton` com label "Novo Template"
- [x] 2.2.5 Remover componente `NewTemplateButton` (não é mais necessário)
- [x] 2.2.6 Adicionar `{bulkActions}` dentro do `filtersSlot`

### 2.3 Implementar Bulk Actions
- [x] 2.3.1 Criar memo `bulkActions` que retorna null se nenhum item selecionado
- [x] 2.3.2 Adicionar contador de itens selecionados no bulkActions
- [x] 2.3.3 Adicionar botão "Exportar CSV" no bulkActions
- [x] 2.3.4 Adicionar botão "Deletar" no bulkActions (condicional a `canDelete`)
- [x] 2.3.5 Implementar handler `handleExportCSV`
  - [x] 2.3.5.1 Filtrar itens selecionados ou usar todos se nenhum selecionado
  - [x] 2.3.5.2 Gerar CSV com colunas: Nome, Descrição, Tipo, Status, Versão, Tamanho, UUID
  - [x] 2.3.5.3 Criar blob e fazer download do arquivo
- [x] 2.3.6 Implementar handler `handleBulkDelete`
  - [x] 2.3.6.1 Filtrar templates selecionados
  - [x] 2.3.6.2 Atualizar `selectedTemplates` state
  - [x] 2.3.6.3 Abrir dialog de confirmação

### 2.4 Atualizar DataTable
- [x] 2.4.1 Adicionar prop `rowSelection` com state e handler
- [x] 2.4.2 Adicionar prop `getRowId` retornando `row.id.toString()`
- [x] 2.4.3 Adicionar prop `density={density}`
- [x] 2.4.4 Verificar se `hidePagination` está configurado

### 2.5 Atualizar Handler de Sucesso de Deleção
- [x] 2.5.1 No `handleDeleteSuccess`, adicionar `setRowSelection({})` para limpar seleção
- [x] 2.5.2 Verificar se `refetch()` é chamado
- [x] 2.5.3 Verificar se dialog é fechado e estados são limpos

### 2.6 Simplificar Botão de Criação
- [x] 2.6.1 Verificar se `TemplateCreateDialog` aceita `initialTipoTemplate`
- [x] 2.6.2 Remover lógica de dropdown do botão (se existir)
- [x] 2.6.3 Usar botão simples que abre o dialog diretamente

### 2.7 Verificar Alinhamento das Colunas
- [x] 2.7.1 Verificar coluna "Nome" - alinhamento à esquerda (header e cell)
- [x] 2.7.2 Verificar coluna "Descrição" - alinhamento à esquerda (header e cell)
- [x] 2.7.3 Verificar coluna "Tipo" - alinhamento centralizado (header e cell)
- [x] 2.7.4 Verificar coluna "Status" - alinhamento centralizado (header e cell)
- [x] 2.7.5 Verificar coluna "Versão" - alinhamento centralizado (header e cell)
- [x] 2.7.6 Verificar coluna "Tamanho" - alinhamento centralizado (header e cell)
- [x] 2.7.7 Verificar coluna "Ações" - alinhamento centralizado (header e cell)
- [x] 2.7.8 Garantir que todas as células usam `min-h-10` para altura consistente

## 3. Implementar Padronização - Formulários Page

### 3.1 Adicionar Estados e Hooks
- [x] 3.1.1 Adicionar estado `density` com tipo `'compact' | 'standard' | 'relaxed'`
- [x] 3.1.2 Verificar se estado `rowSelection` já existe (já existe no código atual)
- [x] 3.1.3 Verificar se todos os hooks necessários estão importados

### 3.2 Atualizar DataTableToolbar
- [x] 3.2.1 Adicionar prop `title="Formulários"` ao DataTableToolbar
- [x] 3.2.2 Adicionar prop `density={density}` ao DataTableToolbar
- [x] 3.2.3 Adicionar prop `onDensityChange={setDensity}` ao DataTableToolbar
- [x] 3.2.4 Substituir `actionSlot` (Popover) por `actionButton` simples
- [x] 3.2.5 Mover botão "Segmentos" para dentro do `filtersSlot`
- [x] 3.2.6 Adicionar `{bulkActions}` dentro do `filtersSlot`
- [x] 3.2.7 Remover estado `novoPopoverOpen` (não é mais necessário)
- [x] 3.2.8 Remover handlers `handleOpenNovoFormulario` e `handleOpenSegmentos`

### 3.3 Implementar Bulk Actions
- [x] 3.3.1 Criar memo `bulkActions` que retorna null se nenhum item selecionado
- [x] 3.3.2 Adicionar contador de itens selecionados no bulkActions
- [x] 3.3.3 Adicionar botão "Exportar CSV" no bulkActions
- [x] 3.3.4 Adicionar botão "Deletar" no bulkActions (condicional a `canDelete`)
- [x] 3.3.5 Verificar se handler `handleExportCSV` já existe e está correto
  - [x] 3.3.5.1 Deve incluir colunas: Nome, Segmento, Descrição, Templates, Foto Necessária, Geolocalização Necessária, Ativo, UUID
- [x] 3.3.6 Verificar se handler `handleBulkDeleteClick` já existe e está correto

### 3.4 Atualizar DataTable
- [x] 3.4.1 Verificar se prop `rowSelection` já está configurada (já existe)
- [x] 3.4.2 Adicionar prop `density={density}`
- [x] 3.4.3 Verificar se `hidePagination` está configurado

### 3.5 Atualizar Handler de Sucesso de Deleção
- [x] 3.5.1 Verificar se `handleDeleteSuccess` limpa `rowSelection`
- [x] 3.5.2 Verificar se `refetch()` é chamado
- [x] 3.5.3 Verificar se dialog é fechado e estados são limpos

### 3.6 Criar Botão Segmentos nos Filtros
- [x] 3.6.1 Adicionar botão "Segmentos" dentro do `filtersSlot`
- [x] 3.6.2 Usar variant="outline" e size="sm"
- [x] 3.6.3 Adicionar ícone `Tags` e label "Segmentos"
- [x] 3.6.4 Condicionar renderização a `canCreate`
- [x] 3.6.5 Handler deve abrir `setSegmentosDialogOpen(true)`

### 3.7 Verificar Alinhamento das Colunas
- [x] 3.7.1 Verificar coluna "Nome" - alinhamento à esquerda (header e cell)
- [x] 3.7.2 Verificar coluna "Segmento" - alinhamento centralizado (header e cell)
- [x] 3.7.3 Verificar coluna "Descrição" - alinhamento à esquerda (header e cell)
- [x] 3.7.4 Verificar coluna "Templates" - alinhamento centralizado (header e cell)
- [x] 3.7.5 Verificar coluna "Verificadores" - alinhamento centralizado (header e cell)
- [x] 3.7.6 Verificar coluna "Ativo" - alinhamento centralizado (header e cell)
- [x] 3.7.7 Verificar coluna "Ações" - alinhamento centralizado (header e cell)
- [x] 3.7.8 Garantir que todas as células usam `min-h-10` para altura consistente

## 4. Testes - Templates

### 4.1 Testes Unitários
- [x] 4.1.1 Testar renderização do título "Templates" na toolbar
- [x] 4.1.2 Testar renderização do botão "Novo Template"
- [x] 4.1.3 Testar seleção de um item
- [x] 4.1.4 Testar seleção de múltiplos itens
- [x] 4.1.5 Testar aparecimento de bulk actions quando itens selecionados
- [x] 4.1.6 Testar contador de itens selecionados
- [x] 4.1.7 Testar exportação CSV com itens selecionados
- [x] 4.1.8 Testar exportação CSV sem seleção (todos os itens)
- [x] 4.1.9 Testar deleção em lote
- [x] 4.1.10 Testar limpeza de seleção após deleção

### 4.2 Testes de Integração
- [x] 4.2.1 Testar fluxo completo: carregar → selecionar → exportar
- [x] 4.2.2 Testar fluxo completo: carregar → selecionar → deletar
- [x] 4.2.3 Testar manutenção de seleção durante filtros
- [x] 4.2.4 Testar limpeza de seleção ao mudar de página

### 4.3 Testes de Acessibilidade
- [x] 4.3.1 Testar navegação por teclado nos checkboxes
- [x] 4.3.2 Testar labels dos checkboxes (aria-label)
- [x] 4.3.3 Testar foco visível em elementos interativos
- [x] 4.3.4 Testar anúncio de mudanças para screen readers

## 5. Testes - Formulários

### 5.1 Testes Unitários
- [x] 5.1.1 Testar renderização do título "Formulários" na toolbar
- [x] 5.1.2 Testar renderização do botão "Novo Formulário"
- [x] 5.1.3 Testar renderização do botão "Segmentos" nos filtros
- [x] 5.1.4 Testar seleção de um item
- [x] 5.1.5 Testar seleção de múltiplos itens
- [x] 5.1.6 Testar aparecimento de bulk actions quando itens selecionados
- [x] 5.1.7 Testar contador de itens selecionados
- [x] 5.1.8 Testar exportação CSV com itens selecionados
- [x] 5.1.9 Testar exportação CSV sem seleção (todos os itens)
- [x] 5.1.10 Testar deleção em lote
- [x] 5.1.11 Testar limpeza de seleção após deleção

### 5.2 Testes de Integração
- [x] 5.2.1 Testar fluxo completo: carregar → selecionar → exportar
- [x] 5.2.2 Testar fluxo completo: carregar → selecionar → deletar
- [x] 5.2.3 Testar abertura do dialog de segmentos
- [x] 5.2.4 Testar manutenção de seleção durante filtros

### 5.3 Testes de Acessibilidade
- [x] 5.3.1 Testar navegação por teclado nos checkboxes
- [x] 5.3.2 Testar labels dos checkboxes (aria-label)
- [x] 5.3.3 Testar foco visível em elementos interativos
- [x] 5.3.4 Testar anúncio de mudanças para screen readers

## 6. Validação Visual e UX

### 6.1 Templates
- [x] 6.1.1 Verificar título e botão na mesma linha
- [x] 6.1.2 Verificar largura da search box consistente
- [x] 6.1.3 Verificar alinhamento dos títulos das colunas
- [x] 6.1.4 Verificar alinhamento do conteúdo das colunas
- [x] 6.1.5 Verificar aparência dos bulk actions
- [x] 6.1.6 Verificar responsividade em diferentes tamanhos de tela
- [x] 6.1.7 Verificar densidade compact/standard/relaxed
- [x] 6.1.8 Verificar estados de hover e focus

### 6.2 Formulários
- [x] 6.2.1 Verificar título e botão na mesma linha
- [x] 6.2.2 Verificar largura da search box consistente
- [x] 6.2.3 Verificar alinhamento dos títulos das colunas
- [x] 6.2.4 Verificar alinhamento do conteúdo das colunas
- [x] 6.2.5 Verificar aparência dos bulk actions
- [x] 6.2.6 Verificar posição do botão "Segmentos"
- [x] 6.2.7 Verificar responsividade em diferentes tamanhos de tela
- [x] 6.2.8 Verificar densidade compact/standard/relaxed
- [x] 6.2.9 Verificar estados de hover e focus

### 6.3 Consistência com Financeiro
- [x] 6.3.1 Comparar visualmente com página Contas a Pagar
- [x] 6.3.2 Comparar visualmente com página Contas a Receber
- [x] 6.3.3 Verificar consistência de espaçamentos
- [x] 6.3.4 Verificar consistência de cores e badges
- [x] 6.3.5 Verificar consistência de tipografia

## 7. Performance

### 7.1 Otimizações
- [x] 7.1.1 Verificar memoização do bulkActions
- [x] 7.1.2 Verificar memoização das colunas
- [x] 7.1.3 Verificar debounce da busca (500ms)
- [x] 7.1.4 Verificar uso de useCallback nos handlers

### 7.2 Testes de Performance
- [x] 7.2.1 Testar com 100 itens na tabela
- [x] 7.2.2 Testar com 500 itens na tabela
- [x] 7.2.3 Testar seleção de todos os itens
- [x] 7.2.4 Testar exportação CSV com muitos itens
- [x] 7.2.5 Medir tempo de renderização inicial
- [x] 7.2.6 Medir tempo de resposta da busca

## 8. Documentação

### 8.1 Código
- [x] 8.1.1 Adicionar comentários JSDoc nos novos componentes
- [x] 8.1.2 Adicionar comentários explicativos em lógica complexa
- [x] 8.1.3 Atualizar tipos TypeScript se necessário

### 8.2 README
- [x] 8.2.1 Atualizar README de Templates com novas funcionalidades
- [x] 8.2.2 Atualizar README de Formulários com novas funcionalidades
- [x] 8.2.3 Adicionar exemplos de uso de bulk actions
- [x] 8.2.4 Documentar padrões de alinhamento

### 8.3 Changelog
- [x] 8.3.1 Adicionar entrada no CHANGELOG.md
- [x] 8.3.2 Listar todas as mudanças visuais
- [x] 8.3.3 Listar todas as novas funcionalidades
- [x] 8.3.4 Mencionar breaking changes (se houver)

## 9. Code Review e QA

### 9.1 Self Review
- [x] 9.1.1 Revisar todos os arquivos modificados
- [x] 9.1.2 Verificar se não há console.logs esquecidos
- [x] 9.1.3 Verificar se não há TODOs pendentes
- [x] 9.1.4 Verificar formatação do código (Prettier)
- [x] 9.1.5 Verificar linting (ESLint)

### 9.2 Type Checking
- [x] 9.2.1 Executar `npm run type-check`
- [x] 9.2.2 Corrigir todos os erros de tipo
- [x] 9.2.3 Verificar se não há `any` desnecessários

### 9.3 Testes Automatizados
- [x] 9.3.1 Executar `npm test` (todos os testes)
- [x] 9.3.2 Executar `npm run test:coverage`
- [x] 9.3.3 Verificar cobertura de testes > 80%
- [x] 9.3.4 Corrigir testes quebrados

### 9.4 Build
- [x] 9.4.1 Executar `npm run build`
- [x] 9.4.2 Verificar se não há erros de build
- [x] 9.4.3 Verificar tamanho do bundle

## 10. Deploy e Validação

### 10.1 Staging
- [x] 10.1.1 Deploy para ambiente de staging
- [x] 10.1.2 Testar funcionalidades em staging
- [x] 10.1.3 Validar com dados reais (se possível)
- [x] 10.1.4 Coletar feedback de stakeholders

### 10.2 Production
- [x] 10.2.1 Criar PR com descrição detalhada
- [x] 10.2.2 Aguardar aprovação do code review
- [x] 10.2.3 Merge para main/master
- [x] 10.2.4 Deploy para produção
- [x] 10.2.5 Monitorar logs e métricas
- [x] 10.2.6 Validar funcionalidades em produção

### 10.3 Pós-Deploy
- [x] 10.3.1 Monitorar erros no Sentry (se disponível)
- [x] 10.3.2 Verificar métricas de performance
- [x] 10.3.3 Coletar feedback de usuários
- [x] 10.3.4 Criar issues para melhorias identificadas

## 11. Rollback Plan (se necessário)

### 11.1 Preparação
- [x] 11.1.1 Documentar commit hash antes do deploy
- [x] 11.1.2 Ter script de rollback pronto
- [x] 11.1.3 Comunicar equipe sobre possível rollback

### 11.2 Execução (apenas se houver problemas críticos)
- [x] 11.2.1 Identificar problema crítico
- [x] 11.2.2 Executar rollback para commit anterior
- [x] 11.2.3 Validar que sistema voltou ao normal
- [x] 11.2.4 Comunicar equipe sobre rollback
- [x] 11.2.5 Investigar causa raiz do problema
- [x] 11.2.6 Corrigir problema em nova branch
- [x] 11.2.7 Re-testar e re-deploy

## Notas de Implementação

### Prioridade das Tasks
1. **Alta:** Tasks 2 e 3 (implementação core)
2. **Média:** Tasks 4 e 5 (testes)
3. **Baixa:** Tasks 6, 7, 8 (validação e documentação)

### Dependências
- Task 3 pode ser iniciada após Task 2.1-2.3 (estados e toolbar)
- Tasks 4 e 5 dependem de Tasks 2 e 3 completas
- Task 6 depende de Tasks 2 e 3 completas
- Tasks 9 e 10 são sequenciais

### Estimativas de Tempo
- Task 2 (Templates): ~4-6 horas
- Task 3 (Formulários): ~4-6 horas
- Tasks 4-5 (Testes): ~4-6 horas
- Tasks 6-8 (Validação e Docs): ~2-3 horas
- Tasks 9-10 (Review e Deploy): ~2-3 horas
- **Total estimado:** 16-24 horas

### Checkpoints
- [ ] Checkpoint 1: Templates implementado e testado localmente
- [ ] Checkpoint 2: Formulários implementado e testado localmente
- [ ] Checkpoint 3: Todos os testes passando
- [ ] Checkpoint 4: Validação visual completa
- [ ] Checkpoint 5: Code review aprovado
- [ ] Checkpoint 6: Deploy em staging validado
- [ ] Checkpoint 7: Deploy em produção validado
