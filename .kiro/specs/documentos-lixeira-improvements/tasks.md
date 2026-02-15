# Tasks: Melhorias na Página de Lixeira de Documentos

## 1. Preparação e Análise
- [ ] 1.1 Revisar código atual de `page-client.tsx` e `page.tsx`
- [ ] 1.2 Verificar imports disponíveis de `FilterPopover` e `PageShell`
- [ ] 1.3 Identificar dependências e tipos necessários

## 2. Implementar Lógica de Filtros
- [ ] 2.1 Adicionar constante `PERIODO_OPTIONS` com opções de filtro
- [ ] 2.2 Criar tipo `PeriodoFiltro` para type safety
- [ ] 2.3 Implementar função `filtrarDocumentosPorPeriodo`
  - [ ] 2.3.1 Implementar lógica para filtro "hoje"
  - [ ] 2.3.2 Implementar lógica para filtro "7dias"
  - [ ] 2.3.3 Implementar lógica para filtro "30dias"
  - [ ] 2.3.4 Implementar lógica para filtro "todos"
- [ ] 2.4 Adicionar estado `periodo` no componente
- [ ] 2.5 Criar `useMemo` para `documentosFiltrados`

## 3. Atualizar Estrutura do Componente
- [ ] 3.1 Adicionar import de `PageShell` de `@/components/shared/page-shell`
- [ ] 3.2 Adicionar import de `FilterPopover` de `@/features/partes`
- [ ] 3.3 Substituir estrutura atual por `PageShell`
  - [ ] 3.3.1 Adicionar prop `title="Lixeira"`
  - [ ] 3.3.2 Adicionar prop `description` com texto sobre exclusão em 30 dias
- [ ] 3.4 Remover header customizado antigo (div com border-b)

## 4. Implementar Toolbar com Filtros
- [ ] 4.1 Criar div de toolbar com classes `flex items-center gap-2 mb-4`
- [ ] 4.2 Adicionar botão "Voltar" com ícone `ArrowLeft`
  - [ ] 4.2.1 Configurar `variant="ghost"` e `size="icon"`
  - [ ] 4.2.2 Adicionar `aria-label="Voltar para documentos"`
  - [ ] 4.2.3 Configurar `onClick` para navegar para `/app/documentos`
- [ ] 4.3 Adicionar `FilterPopover` para período
  - [ ] 4.3.1 Configurar prop `label="Período"`
  - [ ] 4.3.2 Configurar prop `options={PERIODO_OPTIONS}`
  - [ ] 4.3.3 Configurar prop `value={periodo}`
  - [ ] 4.3.4 Configurar prop `onValueChange` com cast para `PeriodoFiltro`
  - [ ] 4.3.5 Configurar prop `defaultValue="todos"`

## 5. Refatorar Componentes de UI
- [ ] 5.1 Extrair `LoadingState` como componente separado
  - [ ] 5.1.1 Manter estrutura de 3 Skeletons
- [ ] 5.2 Extrair `EmptyState` como componente separado
  - [ ] 5.2.1 Adicionar prop `onVoltar`
  - [ ] 5.2.2 Manter ícone, título e descrição
  - [ ] 5.2.3 Manter botão "Voltar para Documentos"
- [ ] 5.3 Extrair `AvisoExclusaoCard` como componente separado
  - [ ] 5.3.1 Manter Card com classes de cor laranja
  - [ ] 5.3.2 Manter ícone `AlertTriangle`
  - [ ] 5.3.3 Manter texto sobre exclusão em 30 dias
- [ ] 5.4 Extrair `DocumentoCard` como componente separado
  - [ ] 5.4.1 Adicionar props: documento, actionLoading, onRestaurar, onExcluir
  - [ ] 5.4.2 Manter estrutura de Card com CardHeader e CardContent
  - [ ] 5.4.3 Manter botões de Restaurar e Excluir
  - [ ] 5.4.4 Manter estados de loading
- [ ] 5.5 Extrair `DeleteConfirmDialog` como componente separado
  - [ ] 5.5.1 Adicionar props: open, onOpenChange, documento, onConfirm
  - [ ] 5.5.2 Manter AlertDialog com título e descrição
  - [ ] 5.5.3 Manter botões de Cancelar e Excluir

## 6. Atualizar Renderização Principal
- [ ] 6.1 Substituir uso de `documentos` por `documentosFiltrados` na renderização
- [ ] 6.2 Atualizar condição de empty state para usar `documentosFiltrados.length === 0`
- [ ] 6.3 Atualizar map de documentos para usar `documentosFiltrados`
- [ ] 6.4 Garantir que toolbar é renderizada antes do conteúdo

## 7. Atualizar page.tsx
- [ ] 7.1 Adicionar import de `Metadata` do Next.js
- [ ] 7.2 Adicionar export de `metadata` com título e descrição
  - [ ] 7.2.1 Configurar `title: 'Lixeira | Documentos'`
  - [ ] 7.2.2 Configurar `description` sobre exclusão em 30 dias
- [ ] 7.3 Verificar que `dynamic` e `revalidate` estão configurados

## 8. Testes Manuais
- [ ] 8.1 Testar carregamento inicial da página
- [ ] 8.2 Testar filtro "Hoje"
  - [ ] 8.2.1 Verificar que apenas documentos de hoje aparecem
  - [ ] 8.2.2 Verificar que badge aparece no botão de filtro
- [ ] 8.3 Testar filtro "Últimos 7 dias"
  - [ ] 8.3.1 Verificar que documentos dos últimos 7 dias aparecem
  - [ ] 8.3.2 Verificar que badge aparece no botão de filtro
- [ ] 8.4 Testar filtro "Últimos 30 dias"
  - [ ] 8.4.1 Verificar que documentos dos últimos 30 dias aparecem
  - [ ] 8.4.2 Verificar que badge aparece no botão de filtro
- [ ] 8.5 Testar filtro "Todos"
  - [ ] 8.5.1 Verificar que todos os documentos aparecem
  - [ ] 8.5.2 Verificar que badge não aparece
- [ ] 8.6 Testar opção "Limpar filtro"
  - [ ] 8.6.1 Aplicar um filtro
  - [ ] 8.6.2 Abrir popover novamente
  - [ ] 8.6.3 Clicar em "Limpar filtro"
  - [ ] 8.6.4 Verificar que todos os documentos aparecem
- [ ] 8.7 Testar restaurar documento com filtro ativo
  - [ ] 8.7.1 Aplicar filtro "Últimos 7 dias"
  - [ ] 8.7.2 Restaurar um documento
  - [ ] 8.7.3 Verificar que filtro permanece ativo
  - [ ] 8.7.4 Verificar que documento foi removido da lista
- [ ] 8.8 Testar excluir documento com filtro ativo
  - [ ] 8.8.1 Aplicar filtro "Últimos 7 dias"
  - [ ] 8.8.2 Excluir um documento
  - [ ] 8.8.3 Verificar que filtro permanece ativo
  - [ ] 8.8.4 Verificar que documento foi removido da lista
- [ ] 8.9 Testar botão "Voltar"
  - [ ] 8.9.1 Clicar no botão "Voltar" na toolbar
  - [ ] 8.9.2 Verificar navegação para `/app/documentos`
- [ ] 8.10 Testar empty state
  - [ ] 8.10.1 Aplicar filtro que não retorna resultados
  - [ ] 8.10.2 Verificar que empty state é exibido
  - [ ] 8.10.3 Verificar que botão "Voltar para Documentos" funciona
- [ ] 8.11 Testar loading state
  - [ ] 8.11.1 Verificar que skeletons aparecem durante carregamento

## 9. Testes de Estilo e Acessibilidade
- [ ] 9.1 Verificar que `FilterPopover` tem classe `border-dashed`
- [ ] 9.2 Verificar que `FilterPopover` tem classe `bg-card`
- [ ] 9.3 Verificar que `FilterPopover` tem ícone `PlusCircle`
- [ ] 9.4 Verificar que checkboxes aparecem no popover
- [ ] 9.5 Verificar que badge aparece quando filtro está ativo
- [ ] 9.6 Verificar que `PageShell` renderiza título "Lixeira"
- [ ] 9.7 Verificar que `PageShell` renderiza descrição
- [ ] 9.8 Verificar navegação por teclado
  - [ ] 9.8.1 Tab para botão "Voltar"
  - [ ] 9.8.2 Tab para `FilterPopover`
  - [ ] 9.8.3 Enter para abrir popover
  - [ ] 9.8.4 Setas para navegar opções
  - [ ] 9.8.5 Enter para selecionar opção
- [ ] 9.9 Verificar aria-labels
  - [ ] 9.9.1 Botão "Voltar" tem aria-label
  - [ ] 9.9.2 Botões de ação têm labels descritivos

## 10. Testes de Responsividade
- [ ] 10.1 Testar em mobile (375px)
  - [ ] 10.1.1 Verificar que toolbar não quebra
  - [ ] 10.1.2 Verificar que cards são legíveis
  - [ ] 10.1.3 Verificar que botões são clicáveis
- [ ] 10.2 Testar em tablet (768px)
  - [ ] 10.2.1 Verificar layout adequado
- [ ] 10.3 Testar em desktop (1024px+)
  - [ ] 10.3.1 Verificar espaçamento adequado

## 11. Testes Unitários
- [ ] 11.1 Criar arquivo de teste `page-client.test.tsx`
- [ ] 11.2 Testar função `filtrarDocumentosPorPeriodo`
  - [ ] 11.2.1 Teste: retorna todos quando periodo = "todos"
  - [ ] 11.2.2 Teste: filtra documentos de hoje
  - [ ] 11.2.3 Teste: filtra documentos dos últimos 7 dias
  - [ ] 11.2.4 Teste: filtra documentos dos últimos 30 dias
  - [ ] 11.2.5 Teste: ignora documentos sem deleted_at
- [ ] 11.3 Testar renderização de componentes
  - [ ] 11.3.1 Teste: renderiza PageShell com título
  - [ ] 11.3.2 Teste: renderiza FilterPopover
  - [ ] 11.3.3 Teste: renderiza botão Voltar
  - [ ] 11.3.4 Teste: renderiza loading state
  - [ ] 11.3.5 Teste: renderiza empty state
  - [ ] 11.3.6 Teste: renderiza lista de documentos

## 12. Testes de Integração
- [ ] 12.1 Testar fluxo completo de filtro
  - [ ] 12.1.1 Montar componente
  - [ ] 12.1.2 Abrir FilterPopover
  - [ ] 12.1.3 Selecionar período
  - [ ] 12.1.4 Verificar documentos filtrados
- [ ] 12.2 Testar fluxo de restaurar com filtro
  - [ ] 12.2.1 Aplicar filtro
  - [ ] 12.2.2 Restaurar documento
  - [ ] 12.2.3 Verificar que filtro permanece
- [ ] 12.3 Testar fluxo de excluir com filtro
  - [ ] 12.3.1 Aplicar filtro
  - [ ] 12.3.2 Excluir documento
  - [ ] 12.3.3 Verificar que filtro permanece

## 13. Validação e Documentação
- [ ] 13.1 Executar `npm run type-check` e corrigir erros
- [ ] 13.2 Executar `npm run lint` e corrigir warnings
- [ ] 13.3 Executar testes unitários e garantir 100% de cobertura
- [ ] 13.4 Executar testes de integração
- [ ] 13.5 Verificar que não há regressões em outras páginas
- [ ] 13.6 Atualizar comentários no código se necessário
- [ ] 13.7 Verificar que imports estão organizados

## 14. Code Review e Deploy
- [ ] 14.1 Revisar código implementado
- [ ] 14.2 Verificar que segue padrões do projeto
- [ ] 14.3 Verificar que não há código duplicado
- [ ] 14.4 Verificar performance (sem re-renders desnecessários)
- [ ] 14.5 Criar PR com descrição detalhada
- [ ] 14.6 Aguardar aprovação
- [ ] 14.7 Merge para branch principal

## Notas de Implementação

### Prioridade das Tarefas
- **Alta**: Tarefas 2, 3, 4, 6 (funcionalidade core)
- **Média**: Tarefas 5, 7, 8 (refatoração e testes manuais)
- **Baixa**: Tarefas 11, 12 (testes automatizados)

### Dependências
- Tarefa 3 depende de Tarefa 2 (lógica de filtros)
- Tarefa 4 depende de Tarefa 3 (estrutura do componente)
- Tarefa 6 depende de Tarefas 2, 3, 4 (renderização)
- Tarefa 8 depende de Tarefas 2-6 (testes manuais)
- Tarefas 11-12 dependem de Tarefas 2-6 (testes automatizados)

### Estimativa de Tempo
- Tarefas 1-7: ~3-4 horas
- Tarefas 8-10: ~2 horas
- Tarefas 11-12: ~2-3 horas
- Tarefas 13-14: ~1 hora
- **Total**: ~8-10 horas

### Pontos de Atenção
1. **Type Safety**: Garantir que `PeriodoFiltro` é usado consistentemente
2. **Performance**: `useMemo` para evitar recalcular filtros desnecessariamente
3. **Acessibilidade**: Manter aria-labels e navegação por teclado
4. **Responsividade**: Testar em diferentes tamanhos de tela
5. **Consistência**: Seguir padrão de outras páginas (contas-pagar)
