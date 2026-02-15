# Padronização de Layout - Assinatura Digital

## 1. Visão Geral

Padronizar o layout das páginas de Assinatura Digital (Templates e Formulários) seguindo o padrão estabelecido nas páginas do módulo Financeiro (Contas a Pagar e Contas a Receber).

## 2. Objetivos

- Aplicar layout consistente com título e botão de ação na mesma linha
- Padronizar largura e comportamento da search box
- Alinhar títulos das colunas à esquerda
- Alinhar conteúdo das colunas com os títulos
- Implementar bulk actions funcionais (seleção múltipla e ações em lote)
- Melhorar UX com padrões visuais consistentes

## 3. User Stories

### 3.1 Como usuário, quero ver o título da página e o botão de ação na mesma linha
**Critérios de Aceitação:**
- O título da página deve aparecer no DataTableToolbar usando a prop `title`
- O botão de ação deve estar posicionado à direita na mesma linha do título
- O layout deve ser responsivo e adaptar-se em telas menores

### 3.2 Como usuário, quero uma search box padronizada
**Critérios de Aceitação:**
- A search box deve ter largura consistente com outras páginas
- O placeholder deve ser descritivo e específico para cada página
- Deve ter debounce de 500ms para evitar requisições excessivas

### 3.3 Como usuário, quero títulos de colunas alinhados à esquerda
**Critérios de Aceitação:**
- Colunas de texto (Nome, Descrição) devem ter títulos alinhados à esquerda
- Colunas numéricas (Valor, Tamanho) devem ter títulos alinhados à direita
- Colunas de status/badges devem ter títulos centralizados
- O conteúdo das células deve seguir o mesmo alinhamento dos títulos

### 3.4 Como usuário, quero selecionar múltiplos itens e executar ações em lote
**Critérios de Aceitação:**
- Deve haver checkbox de seleção em cada linha da tabela
- Deve haver checkbox no header para selecionar/desselecionar todos
- Quando itens estiverem selecionados, deve aparecer barra de bulk actions
- Bulk actions devem incluir: Exportar CSV e Deletar (se tiver permissão)
- Contador de itens selecionados deve ser exibido
- Após executar ação em lote, seleção deve ser limpa

### 3.5 Como usuário, quero exportar dados selecionados para CSV
**Critérios de Aceitação:**
- Botão "Exportar CSV" deve aparecer quando houver itens selecionados
- Se nenhum item estiver selecionado, deve exportar todos os itens visíveis
- CSV deve incluir todas as colunas relevantes
- Nome do arquivo deve ser descritivo (templates.csv, formularios.csv)

### 3.6 Como usuário, quero deletar múltiplos itens de uma vez
**Critérios de Aceitação:**
- Botão "Deletar" deve aparecer quando houver itens selecionados
- Deve abrir dialog de confirmação antes de deletar
- Dialog deve mostrar quantos itens serão deletados
- Após deletar, deve recarregar a lista e limpar seleção
- Deve mostrar toast de sucesso ou erro

## 4. Páginas Afetadas

### 4.1 Templates (`/app/assinatura-digital/templates`)
- Arquivo: `src/app/app/assinatura-digital/templates/client-page.tsx`
- Componentes relacionados: `TemplateCreateDialog`, `TemplateDuplicateDialog`, `TemplateDeleteDialog`

### 4.2 Formulários (`/app/assinatura-digital/formularios`)
- Arquivo: `src/app/app/assinatura-digital/formularios/client-page.tsx`
- Componentes relacionados: `FormularioCreateDialog`, `FormularioDuplicateDialog`, `FormularioDeleteDialog`

## 5. Padrão de Referência

As páginas devem seguir o padrão estabelecido em:
- `src/app/app/financeiro/contas-pagar/page.tsx`
- `src/app/app/financeiro/contas-receber/page-client.tsx`

### 5.1 Estrutura do DataTableToolbar
```tsx
<DataTableToolbar
  table={table}
  title="Título da Página"  // ← Novo: título na toolbar
  density={density}
  onDensityChange={setDensity}
  searchValue={busca}
  onSearchValueChange={(value) => {
    setBusca(value);
    setPagina(0);
  }}
  searchPlaceholder="Buscar por..."
  actionButton={{  // ← Botão de ação principal
    label: 'Novo Item',
    onClick: handleNovo,
  }}
  filtersSlot={
    <>
      {/* Filtros */}
      {bulkActions}  // ← Bulk actions aparecem aqui
    </>
  }
/>
```

### 5.2 Estrutura das Colunas
```tsx
{
  accessorKey: 'nome',
  header: ({ column }) => (
    <div className="flex items-center justify-start">  // ← Alinhamento
      <DataTableColumnHeader column={column} title="Nome" />
    </div>
  ),
  meta: { align: 'left' },  // ← Meta para alinhamento
  cell: ({ row }) => (
    <div className="min-h-10 flex items-center justify-start">  // ← Mesmo alinhamento
      {/* Conteúdo */}
    </div>
  ),
}
```

### 5.3 Bulk Actions
```tsx
const bulkActions = React.useMemo(() => {
  const selectedCount = Object.keys(rowSelection).length;
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      {canDelete && (
        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar
        </Button>
      )}
    </div>
  );
}, [rowSelection, canDelete]);
```

## 6. Requisitos Técnicos

### 6.1 Componentes Utilizados
- `DataShell` - Container principal da tabela
- `DataTableToolbar` - Barra de ferramentas com título, busca, filtros e ações
- `DataTable` - Tabela com suporte a seleção múltipla
- `DataPagination` - Paginação
- `DataTableColumnHeader` - Header de coluna com ordenação

### 6.2 Estados Necessários
```tsx
const [table, setTable] = useState<TanstackTable<T> | null>(null);
const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');
```

### 6.3 Props do DataTable
```tsx
<DataTable
  rowSelection={{
    state: rowSelection,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id.toString(),
  }}
  density={density}
  // ... outras props
/>
```

## 7. Regras de Negócio

### 7.1 Permissões
- Bulk delete só deve aparecer se usuário tiver permissão de deletar
- Verificar permissões usando `useMinhasPermissoes('assinatura_digital')`

### 7.2 Exportação CSV
- Incluir todas as colunas relevantes (exceto ações)
- Formatar datas no padrão brasileiro (dd/MM/yyyy)
- Usar aspas duplas para campos de texto que podem conter vírgulas

### 7.3 Deleção em Lote
- Confirmar antes de deletar
- Mostrar quantidade de itens que serão deletados
- Recarregar lista após deleção bem-sucedida
- Limpar seleção após deleção

## 8. Critérios de Aceitação Gerais

- [ ] Layout visual consistente com páginas do financeiro
- [ ] Título e botão de ação na mesma linha
- [ ] Search box com largura padronizada
- [ ] Alinhamento de colunas correto (esquerda para texto, centro para badges, direita para números)
- [ ] Bulk actions funcionando (seleção múltipla, exportar CSV, deletar)
- [ ] Responsividade mantida em diferentes tamanhos de tela
- [ ] Sem regressões em funcionalidades existentes
- [ ] Código limpo e seguindo padrões do projeto

## 9. Fora do Escopo

- Mudanças na lógica de negócio
- Novos filtros ou funcionalidades
- Alterações em componentes compartilhados (DataShell, DataTable, etc.)
- Mudanças em outras páginas além de Templates e Formulários
