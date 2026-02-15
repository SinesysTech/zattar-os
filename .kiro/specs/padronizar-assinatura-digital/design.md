# Design - Padronização de Layout - Assinatura Digital

## 1. Visão Geral da Solução

Esta spec implementa padronização visual e funcional nas páginas de Templates e Formulários do módulo de Assinatura Digital, alinhando-as com o padrão estabelecido nas páginas do módulo Financeiro.

### 1.1 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                         PageShell                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     DataShell                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           DataTableToolbar                       │  │  │
│  │  │  ┌──────────────┬──────────────┬──────────────┐ │  │  │
│  │  │  │ Título       │ Search       │ Botão Ação   │ │  │  │
│  │  │  └──────────────┴──────────────┴──────────────┘ │  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │  │
│  │  │  │ Filtros + Bulk Actions                   │   │  │  │
│  │  │  └──────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              DataTable                           │  │  │
│  │  │  ┌───┬─────────┬─────────┬─────────┬────────┐  │  │  │
│  │  │  │ ☐ │ Nome    │ Desc    │ Status  │ Ações  │  │  │  │
│  │  │  ├───┼─────────┼─────────┼─────────┼────────┤  │  │  │
│  │  │  │ ☐ │ Item 1  │ ...     │ Badge   │ Menu   │  │  │  │
│  │  │  │ ☐ │ Item 2  │ ...     │ Badge   │ Menu   │  │  │  │
│  │  │  └───┴─────────┴─────────┴─────────┴────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           DataPagination                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Componentes e Estrutura

### 2.1 Templates Page (`client-page.tsx`)

#### 2.1.1 Mudanças no DataTableToolbar

**Antes:**
```tsx
<DataTableToolbar
  table={table}
  searchValue={busca}
  onSearchValueChange={...}
  searchPlaceholder="Buscar por nome, UUID ou descrição..."
  filtersSlot={<>...</>}
  actionSlot={NewTemplateButton}
/>
```

**Depois:**
```tsx
<DataTableToolbar
  table={table}
  title="Templates"  // ← Novo
  density={density}  // ← Novo
  onDensityChange={setDensity}  // ← Novo
  searchValue={busca}
  onSearchValueChange={...}
  searchPlaceholder="Buscar por nome, UUID ou descrição..."
  actionButton={{  // ← Mudança: de actionSlot para actionButton
    label: 'Novo Template',
    onClick: () => setCreateOpen(true),
  }}
  filtersSlot={
    <>
      {/* Filtros existentes */}
      {bulkActions}  // ← Novo
    </>
  }
/>
```

#### 2.1.2 Mudanças nas Colunas

**Coluna Nome - Antes:**
```tsx
{
  accessorKey: 'nome',
  header: ({ column }) => (
    <div className="flex items-center justify-start">
      <DataTableColumnHeader column={column} title="Nome" />
    </div>
  ),
  size: 250,
  meta: { align: 'left', headerLabel: 'Nome' },
  cell: ({ row }) => (
    <div className="min-h-10 flex items-center justify-start text-sm gap-2">
      {/* conteúdo */}
    </div>
  ),
}
```

**Coluna Nome - Depois (sem mudanças, já está correto):**
- Mantém alinhamento à esquerda
- Mantém `min-h-10` para altura consistente

**Colunas Centralizadas (Tipo, Status, Versão, Tamanho):**
- Já estão corretas com alinhamento centralizado

**Coluna Ações:**
- Já está correta com alinhamento centralizado

#### 2.1.3 Novo Estado para Seleção

```tsx
const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');
```

#### 2.1.4 Novo Componente: Bulk Actions

```tsx
const bulkActions = React.useMemo(() => {
  const selectedCount = Object.keys(rowSelection).length;
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-10"
        onClick={handleExportCSV}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      {canDelete && (
        <Button
          variant="destructive"
          size="sm"
          className="h-10"
          onClick={handleBulkDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar
        </Button>
      )}
    </div>
  );
}, [rowSelection, handleExportCSV, handleBulkDelete, canDelete]);
```

#### 2.1.5 Mudanças no DataTable

```tsx
<DataTable
  data={templates}
  columns={colunas}
  pagination={...}
  sorting={undefined}
  rowSelection={{  // ← Novo
    state: rowSelection,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id.toString(),
  }}
  density={density}  // ← Novo
  isLoading={isLoading}
  error={null}
  emptyMessage="Nenhum template encontrado."
  onRowClick={(row) => handleEdit(row)}
  onTableReady={(t) => setTable(t as TanstackTable<Template>)}
  hidePagination
/>
```

#### 2.1.6 Mudança no Botão de Ação

**Antes (usando DropdownMenu):**
```tsx
const NewTemplateButton = React.useMemo(() => {
  if (!canCreate) return null;
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Novo Template</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleNewTemplate('pdf')}>
          <FileUp className="mr-2 h-4 w-4" />
          Template PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNewTemplate('markdown')}>
          <FileText className="mr-2 h-4 w-4" />
          Template Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}, [canCreate, handleNewTemplate]);
```

**Depois (simplificado):**
```tsx
// Remover NewTemplateButton memo

// No DataTableToolbar, usar actionButton simples
actionButton={canCreate ? {
  label: 'Novo Template',
  onClick: () => setCreateOpen(true),
} : undefined}

// Manter o dialog com seleção de tipo
<TemplateCreateDialog
  open={createOpen}
  onOpenChange={setCreateOpen}
  onSuccess={handleCreateSuccess}
  initialTipoTemplate={initialTipoTemplate}
/>
```

**Nota:** O dialog `TemplateCreateDialog` já tem a lógica de escolher entre PDF e Markdown internamente, então não precisamos do dropdown no botão.

### 2.2 Formulários Page (`client-page.tsx`)

#### 2.2.1 Mudanças no DataTableToolbar

**Antes:**
```tsx
<DataTableToolbar
  table={table}
  searchValue={busca}
  onSearchValueChange={...}
  searchPlaceholder="Buscar por nome, slug ou descrição..."
  filtersSlot={<>...</>}
  actionSlot={
    <Popover>
      {/* Popover com opções: Novo formulário, Segmentos */}
    </Popover>
  }
/>
```

**Depois:**
```tsx
<DataTableToolbar
  table={table}
  title="Formulários"  // ← Novo
  density={density}  // ← Novo
  onDensityChange={setDensity}  // ← Novo
  searchValue={busca}
  onSearchValueChange={...}
  searchPlaceholder="Buscar por nome, slug ou descrição..."
  actionButton={{  // ← Mudança: botão principal
    label: 'Novo Formulário',
    onClick: () => setCreateOpen(true),
  }}
  filtersSlot={
    <>
      {/* Filtros existentes */}
      {bulkActions}  // ← Novo
      {/* Botão Segmentos movido para cá */}
      {canCreate && (
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => setSegmentosDialogOpen(true)}
        >
          <Tags className="h-4 w-4 mr-2" />
          Segmentos
        </Button>
      )}
    </>
  }
/>
```

**Nota:** O botão "Segmentos" é movido para dentro dos filtros, pois é uma ação secundária.

#### 2.2.2 Mudanças nas Colunas

**Coluna Nome:**
- Já está correta com alinhamento à esquerda

**Coluna Segmento:**
- Já está correta com alinhamento centralizado

**Coluna Descrição:**
- Já está correta com alinhamento à esquerda

**Coluna Templates:**
- Já está correta com alinhamento centralizado

**Coluna Verificadores:**
- Já está correta com alinhamento centralizado

**Coluna Ativo:**
- Já está correta com alinhamento centralizado

**Coluna Ações:**
- Já está correta com alinhamento centralizado

#### 2.2.3 Novo Estado para Seleção

```tsx
const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');
```

#### 2.2.4 Novo Componente: Bulk Actions

```tsx
const bulkActions = React.useMemo(() => {
  const selectedCount = Object.keys(rowSelection).length;
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-10"
        onClick={handleExportCSV}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      {canDelete && (
        <Button
          variant="destructive"
          size="sm"
          className="h-10"
          onClick={handleBulkDeleteClick}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar
        </Button>
      )}
    </div>
  );
}, [rowSelection, handleExportCSV, handleBulkDeleteClick, canDelete]);
```

#### 2.2.5 Mudanças no DataTable

```tsx
<DataTable
  data={formularios}
  columns={colunas}
  pagination={...}
  sorting={undefined}
  rowSelection={{  // ← Novo
    state: rowSelection,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id.toString(),
  }}
  density={density}  // ← Novo
  isLoading={isLoading}
  error={null}
  emptyMessage="Nenhum formulário encontrado."
  onRowClick={(row) => handleEditSchema(row)}
  onTableReady={(t) => {
    const tableInstance = t as TanstackTable<AssinaturaDigitalFormulario>;
    tableInstance.getColumn('ativo')?.toggleVisibility(false);
    setTable(tableInstance);
  }}
  hidePagination
/>
```

## 3. Fluxos de Dados

### 3.1 Fluxo de Seleção Múltipla

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário clica em checkbox                                │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DataTable atualiza rowSelection state                    │
│    setRowSelection({ ...prev, [id]: checked })              │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. bulkActions memo recalcula                                │
│    - Conta itens selecionados                                │
│    - Renderiza barra de ações se count > 0                   │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Usuário clica em ação (Exportar ou Deletar)              │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Handler executa ação                                      │
│    - Filtra itens selecionados                               │
│    - Executa operação                                        │
│    - Limpa seleção: setRowSelection({})                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Exportação CSV

```typescript
const handleExportCSV = React.useCallback(() => {
  // 1. Determinar itens a exportar
  const selected = Object.keys(rowSelection).length > 0
    ? Object.keys(rowSelection)
        .map(id => items.find(t => t.id.toString() === id))
        .filter(Boolean) as Item[]
    : items;

  // 2. Gerar CSV
  const csv = [
    ['Coluna1', 'Coluna2', 'Coluna3'].join(','),
    ...selected.map(item => [
      `"${item.campo1}"`,
      `"${item.campo2}"`,
      item.campo3,
    ].join(',')),
  ].join('\n');

  // 3. Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
  URL.revokeObjectURL(url);
}, [rowSelection, items]);
```

### 3.3 Fluxo de Deleção em Lote

```typescript
const handleBulkDelete = React.useCallback(() => {
  // 1. Filtrar itens selecionados
  const selected = Object.keys(rowSelection)
    .map(id => items.find(t => t.id.toString() === id))
    .filter(Boolean) as Item[];

  // 2. Atualizar estado para abrir dialog
  setSelectedItems(selected);
  setDeleteOpen(true);
}, [rowSelection, items]);

const handleDeleteSuccess = React.useCallback(() => {
  // 3. Após confirmação e deleção bem-sucedida
  refetch();  // Recarregar lista
  setDeleteOpen(false);
  setSelectedItems([]);
  setRowSelection({});  // Limpar seleção
}, [refetch]);
```

## 4. Estrutura de Arquivos

```
src/app/app/assinatura-digital/
├── templates/
│   ├── page.tsx                    # Sem mudanças
│   ├── client-loader.tsx           # Sem mudanças
│   ├── client-page.tsx             # ✏️ Modificar
│   └── components/
│       ├── template-duplicate-dialog.tsx  # Sem mudanças
│       └── template-delete-dialog.tsx     # Sem mudanças
│
└── formularios/
    ├── page.tsx                    # Sem mudanças
    ├── client-loader.tsx           # Sem mudanças
    ├── client-page.tsx             # ✏️ Modificar
    └── components/
        ├── formulario-create-dialog.tsx   # Sem mudanças
        ├── formulario-duplicate-dialog.tsx # Sem mudanças
        └── formulario-delete-dialog.tsx    # Sem mudanças
```

## 5. Decisões de Design

### 5.1 Título na Toolbar vs PageShell

**Decisão:** Usar `title` prop no `DataTableToolbar` em vez de no `PageShell`.

**Razão:**
- Padrão estabelecido nas páginas do financeiro
- Mantém título, busca e ação na mesma linha
- Melhor uso do espaço vertical
- Mais consistente com outras páginas do sistema

### 5.2 Botão de Ação Simplificado (Templates)

**Decisão:** Remover dropdown do botão "Novo Template" e usar botão simples.

**Razão:**
- O `TemplateCreateDialog` já tem a lógica de escolher tipo internamente
- Simplifica a interface
- Reduz cliques do usuário
- Mantém consistência com outras páginas

**Alternativa considerada:** Manter dropdown
- Rejeitada por adicionar complexidade desnecessária

### 5.3 Botão Segmentos nos Filtros (Formulários)

**Decisão:** Mover botão "Segmentos" para dentro do `filtersSlot`.

**Razão:**
- É uma ação secundária, não a ação principal
- Libera espaço para o botão principal "Novo Formulário"
- Mantém todas as ações relacionadas a filtros/gerenciamento juntas

### 5.4 Exportação CSV: Selecionados vs Todos

**Decisão:** Se nenhum item estiver selecionado, exportar todos os itens visíveis.

**Razão:**
- Comportamento intuitivo
- Permite exportação rápida sem precisar selecionar tudo
- Padrão em outras aplicações

### 5.5 Densidade da Tabela

**Decisão:** Adicionar controle de densidade (compact, standard, relaxed).

**Razão:**
- Padrão estabelecido nas páginas do financeiro
- Permite ao usuário ajustar conforme preferência
- Melhora usabilidade em diferentes contextos

## 6. Considerações de Performance

### 6.1 Memoização

```typescript
// Bulk actions - recalcula apenas quando rowSelection muda
const bulkActions = React.useMemo(() => {
  // ...
}, [rowSelection, canDelete]);

// Colunas - recalcula apenas quando handlers mudam
const colunas = React.useMemo(
  () => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete),
  [handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete]
);
```

### 6.2 Debounce na Busca

```typescript
const buscaDebounced = useDebounce(busca, 500);
```

- Evita requisições excessivas durante digitação
- Melhora performance da API

### 6.3 Seleção de Linhas

```typescript
getRowId: (row) => row.id.toString()
```

- Usa ID único para rastreamento eficiente
- Evita re-renders desnecessários

## 7. Acessibilidade

### 7.1 Checkboxes

- Todos os checkboxes têm labels apropriados (via TanStack Table)
- Checkbox do header tem label "Selecionar todos"
- Checkboxes de linha têm label "Selecionar item {nome}"

### 7.2 Botões

```tsx
<Button aria-label="Novo Template">
  <Plus className="h-4 w-4" />
</Button>
```

- Todos os botões icon-only têm `aria-label`
- Tooltips fornecem contexto adicional

### 7.3 Navegação por Teclado

- Tabela suporta navegação por teclado (via TanStack Table)
- Checkboxes são focáveis e acionáveis via teclado
- Dropdowns de ações são acessíveis via teclado

## 8. Testes

### 8.1 Testes Unitários

```typescript
describe('TemplatesClient - Bulk Actions', () => {
  it('deve mostrar bulk actions quando itens estão selecionados', () => {
    // Arrange
    const { getByText, getByRole } = render(<TemplatesClient />);
    
    // Act
    const checkbox = getByRole('checkbox', { name: /selecionar item/i });
    fireEvent.click(checkbox);
    
    // Assert
    expect(getByText(/1 selecionado/i)).toBeInTheDocument();
    expect(getByText(/exportar csv/i)).toBeInTheDocument();
  });

  it('deve exportar CSV com itens selecionados', () => {
    // Test implementation
  });

  it('deve deletar múltiplos itens', () => {
    // Test implementation
  });
});
```

### 8.2 Testes de Integração

```typescript
describe('TemplatesClient - Integration', () => {
  it('deve carregar templates e permitir seleção', async () => {
    // Test implementation
  });

  it('deve manter seleção após paginação', async () => {
    // Test implementation
  });
});
```

### 8.3 Testes E2E

```typescript
test('deve permitir seleção múltipla e exportação CSV', async ({ page }) => {
  await page.goto('/app/assinatura-digital/templates');
  
  // Selecionar múltiplos itens
  await page.click('[data-testid="checkbox-1"]');
  await page.click('[data-testid="checkbox-2"]');
  
  // Verificar bulk actions
  await expect(page.locator('text=2 selecionados')).toBeVisible();
  
  // Exportar CSV
  const downloadPromise = page.waitForEvent('download');
  await page.click('text=Exportar CSV');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toBe('templates.csv');
});
```

## 9. Migração e Rollout

### 9.1 Estratégia de Implementação

1. **Fase 1:** Implementar mudanças em Templates
   - Adicionar título na toolbar
   - Adicionar densidade
   - Implementar seleção múltipla
   - Implementar bulk actions
   - Testar extensivamente

2. **Fase 2:** Implementar mudanças em Formulários
   - Aplicar mesmas mudanças
   - Ajustar botão Segmentos
   - Testar extensivamente

3. **Fase 3:** Validação
   - Testes E2E
   - Revisão de código
   - Deploy em staging
   - Validação com usuários

### 9.2 Rollback Plan

Se houver problemas críticos:
1. Reverter commits específicos
2. Manter funcionalidade existente
3. Investigar e corrigir issues
4. Re-deploy quando estável

### 9.3 Compatibilidade

- Sem breaking changes em APIs
- Sem mudanças em schemas de banco
- Apenas mudanças visuais e de UX
- Totalmente compatível com versão anterior

## 10. Documentação

### 10.1 Comentários no Código

```typescript
/**
 * Bulk actions para seleção múltipla
 * Exibe contador de itens selecionados e botões de ação
 * Só renderiza quando há itens selecionados
 */
const bulkActions = React.useMemo(() => {
  // ...
}, [rowSelection, canDelete]);
```

### 10.2 README Updates

Atualizar documentação em:
- `src/app/app/assinatura-digital/templates/README.md`
- `src/app/app/assinatura-digital/formularios/README.md`

Incluir:
- Novas funcionalidades (bulk actions)
- Padrões de uso
- Exemplos de código

## 11. Métricas de Sucesso

### 11.1 Métricas Técnicas

- [ ] Tempo de carregamento da página < 2s
- [ ] Tempo de resposta da busca < 500ms
- [ ] Sem erros de console
- [ ] Cobertura de testes > 80%

### 11.2 Métricas de UX

- [ ] Usuários conseguem selecionar múltiplos itens
- [ ] Usuários conseguem exportar CSV
- [ ] Usuários conseguem deletar em lote
- [ ] Layout consistente com outras páginas

### 11.3 Métricas de Qualidade

- [ ] Sem regressões em funcionalidades existentes
- [ ] Código segue padrões do projeto
- [ ] Acessibilidade mantida (WCAG 2.1 AA)
- [ ] Performance mantida ou melhorada

## 12. Riscos e Mitigações

### 12.1 Risco: Quebra de Funcionalidade Existente

**Probabilidade:** Baixa  
**Impacto:** Alto

**Mitigação:**
- Testes extensivos antes do deploy
- Revisão de código cuidadosa
- Deploy gradual (staging → production)
- Monitoramento pós-deploy

### 12.2 Risco: Performance Degradada

**Probabilidade:** Baixa  
**Impacto:** Médio

**Mitigação:**
- Usar memoização adequada
- Testar com grandes volumes de dados
- Monitorar métricas de performance

### 12.3 Risco: Confusão de Usuários

**Probabilidade:** Baixa  
**Impacto:** Baixo

**Mitigação:**
- Manter padrões consistentes
- Tooltips e labels claros
- Documentação atualizada
- Feedback visual claro

## 13. Próximos Passos

Após implementação desta spec:

1. **Aplicar padrão em outras páginas**
   - Documentos
   - Segmentos
   - Outras páginas de listagem

2. **Melhorias Futuras**
   - Filtros avançados salvos
   - Exportação em outros formatos (Excel, PDF)
   - Ações em lote customizadas

3. **Otimizações**
   - Virtualização de tabela para grandes volumes
   - Paginação server-side
   - Cache de resultados

## 14. Referências

- [TanStack Table - Row Selection](https://tanstack.com/table/v8/docs/guide/row-selection)
- [Shadcn/ui - Data Table](https://ui.shadcn.com/docs/components/data-table)
- [React - useMemo](https://react.dev/reference/react/useMemo)
- Páginas de referência:
  - `src/app/app/financeiro/contas-pagar/page.tsx`
  - `src/app/app/financeiro/contas-receber/page-client.tsx`
