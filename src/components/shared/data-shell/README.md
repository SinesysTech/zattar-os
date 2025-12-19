# DataShell - Padrão de Visualização de Dados

## ⚠️ PADRÃO OBRIGATÓRIO

Este é o **padrão oficial e obrigatório** para todas as visualizações de dados (tabelas/listas) no Sinesys.

## 📋 Estrutura

O padrão DataShell consiste em três componentes principais:

1. **`DataShell`** - Container visual que une header, conteúdo e footer
2. **`DataTable`** - Tabela baseada em TanStack Table
3. **`DataTableToolbar`** - Barra de ferramentas (busca, filtros)
4. **`DataPagination`** - Paginação integrada

## ✅ Uso Correto (OBRIGATÓRIO)

```tsx
import { DataShell, DataTable, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';

export function MinhaListagem() {
  return (
    <DataShell
      header={<DataTableToolbar table={table} />}
      footer={<DataPagination {...paginationProps} />}
    >
      <DataTable
        data={data}
        columns={columns}
        hideTableBorder={true} // Border é gerenciado pelo DataShell
      />
    </DataShell>
  );
}
```

## ❌ Uso Incorreto (PROIBIDO)

```tsx
// ❌ NUNCA use DataTable sem DataShell
<DataTable data={data} columns={columns} />

// ❌ NUNCA use componentes de tabela diretamente
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

## 🎯 Alinhamento de Colunas

O alinhamento é controlado via `meta.align` na definição da coluna:

```tsx
const columns: ColumnDef<MeuTipo>[] = [
  {
    accessorKey: 'nome',
    meta: { align: 'left' }, // ou 'center' (padrão) ou 'right'
  },
  {
    accessorKey: 'valor',
    meta: { align: 'right' },
  },
];
```

## ☑️ Coluna de Seleção (Checkbox)

A coluna de seleção é automaticamente criada quando `rowSelection` é fornecido:

```tsx
<DataTable
  data={data}
  columns={columns}
  rowSelection={{
    state: rowSelection,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id.toString(),
  }}
/>
```

**Características da coluna de seleção:**
- ✅ Sempre centralizada (`meta.align = 'center'`)
- ✅ Tamanho fixo de 44px
- ✅ Checkbox centralizado horizontal e verticalmente
- ✅ Não pode ser ordenada ou ocultada

## 📚 Componentes Disponíveis

### DataShell
Container principal que une header, conteúdo e footer.

**Props:**
- `header?: React.ReactNode` - Toolbar/filtros
- `footer?: React.ReactNode` - Paginação/summary
- `actionButton?: DataShellActionButton` - Botão de ação primária
- `ariaLabel?: string` - Label para acessibilidade
- `scrollableContent?: boolean` - Se `true`, aplica `overflow-auto` ao conteúdo para rolagem local (útil em diálogos ou contêineres de altura fixa)

### DataTable
Tabela baseada em TanStack Table.

**Props principais:**
- `data: TData[]` - Dados da tabela
- `columns: ColumnDef<TData, TValue>[]` - Definição das colunas
- `rowSelection?: {...}` - Configuração de seleção de linhas
- `hideTableBorder?: boolean` - Ocultar borda (use `true` dentro do DataShell)
- `pagination?: {...}` - Configuração de paginação server-side

### DataTableToolbar
Barra de ferramentas com busca e filtros.

### DataPagination
Componente de paginação integrado.

## 🔍 Exemplos de Uso

### Listagem Simples

```tsx
<DataShell
  header={<DataTableToolbar table={table} />}
  footer={<DataPagination {...paginationProps} />}
>
  <DataTable
    data={items}
    columns={columns}
    hideTableBorder={true}
  />
</DataShell>
```

### Com Botão de Ação

```tsx
<DataShell
  actionButton={{
    label: 'Novo Item',
    onClick: () => setDialogOpen(true),
    icon: <Plus />,
  }}
  header={<DataTableToolbar table={table} />}
  footer={<DataPagination {...paginationProps} />}
>
  <DataTable
    data={items}
    columns={columns}
    hideTableBorder={true}
  />
</DataShell>
```

## 📝 Notas Importantes

1. **SEMPRE use `hideTableBorder={true}` no DataTable quando dentro do DataShell**
2. **O alinhamento padrão é `center`** - defina `meta.align` para alterar
3. **A coluna de seleção é sempre centralizada** - não é necessário configurar
4. **Use `scrollableContent={true}` em diálogos ou contêineres de altura fixa** - quando o layout principal não prover scroll, ative rolagem local no conteúdo
4. **Nunca use componentes de tabela diretamente** - sempre use DataTable dentro de DataShell

## 🎨 Design System

O DataShell segue o design system do Sinesys:
- Bordas arredondadas
- Sombras consistentes
- Espaçamento padronizado
- Responsividade automática

---

## 📊 Props Completas

### DataTableToolbar Props

```tsx
interface DataTableToolbarProps<TData> {
  // Instância do TanStack Table (obrigatório)
  table: Table<TData>;

  // ID da tabela para acessibilidade (aria-controls)
  tableId?: string;

  // Callback customizado de exportação
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;

  // Densidade da tabela
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;

  // Busca (controlled)
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Slots para extensão
  filtersSlot?: React.ReactNode;  // Filtros customizados (Selects, etc.)
  actionSlot?: React.ReactNode;   // Ações adicionais
}
```

### Usando filtersSlot

O `filtersSlot` é onde você coloca filtros customizados (Select, DatePicker, etc.):

```tsx
<DataTableToolbar
  table={table}
  searchValue={busca}
  onSearchValueChange={(value) => {
    setBusca(value);
    setPageIndex(0);  // IMPORTANTE: Reset página
  }}
  filtersSlot={
    <>
      <Select
        value={status}
        onValueChange={(val) => {
          setStatus(val);
          setPageIndex(0);  // IMPORTANTE: Reset página
        }}
      >
        <SelectTrigger className="h-10 w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ativo">Ativo</SelectItem>
          <SelectItem value="inativo">Inativo</SelectItem>
        </SelectContent>
      </Select>
    </>
  }
/>
```

**Regra importante:** Todos os elementos no toolbar devem ter altura `h-10` (40px).

---

## 🔄 Padrão de Estado com useDebounce

Para evitar requisições excessivas durante a digitação:

```tsx
import { useDebounce } from '@/hooks/use-debounce';

// Estado de busca
const [globalFilter, setGlobalFilter] = useState('');
const buscaDebounced = useDebounce(globalFilter, 500);

// Ref para evitar refetch na montagem
const isFirstRender = useRef(true);

// Effect que refaz a busca
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  refetch();
}, [buscaDebounced, refetch]);
```

---

## 📄 Padrão de Paginação Server-Side

```tsx
// Estado
const [pageIndex, setPageIndex] = useState(0);  // 0-based para UI
const [pageSize, setPageSize] = useState(50);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(0);

// Refetch function
const refetch = useCallback(async () => {
  const result = await actionListar({
    pagina: pageIndex + 1,  // API usa 1-based
    limite: pageSize,
    busca: buscaDebounced || undefined,
  });

  if (result.success) {
    setDados(result.data.data);
    setTotal(result.data.pagination.total);
    setTotalPages(result.data.pagination.totalPages);
  }
}, [pageIndex, pageSize, buscaDebounced]);

// No DataPagination
<DataPagination
  pageIndex={pageIndex}
  pageSize={pageSize}
  total={total}
  totalPages={totalPages}
  onPageChange={setPageIndex}
  onPageSizeChange={setPageSize}
  isLoading={isLoading}
/>
```

---

## 🔁 Padrão de Reset de Paginação

**SEMPRE** resete `pageIndex` para 0 quando:
- Mudar o valor de busca
- Mudar qualquer filtro
- Mudar o `pageSize`

```tsx
// No handler de busca
onSearchValueChange={(value) => {
  setGlobalFilter(value);
  setPageIndex(0);  // Reset para primeira página
}}

// No handler de filtro
onValueChange={(val) => {
  setStatus(val);
  setPageIndex(0);  // Reset para primeira página
}}
```

---

## 🎯 Padrão de Colunas com Factory Function

Use factory functions para injetar callbacks:

```tsx
// columns.tsx
export function getColumns(
  onEdit: (item: Item) => void,
  onDelete: (item: Item) => void
): ColumnDef<Item>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Nome',  // Para dropdown de visibilidade
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Ações',
      meta: { align: 'center' },
      cell: ({ row }) => (
        <Actions item={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

// No wrapper
const columns = useMemo(
  () => getColumns(handleEdit, handleDelete),
  [handleEdit, handleDelete]
);
```

---

## ⚠️ Componentes Deprecados

**NÃO USE estes componentes:**

| Componente | Localização | Substituição |
|------------|-------------|--------------|
| `TableToolbar` | `@/components/ui/table-toolbar` | `DataTableToolbar` |
| `TableWithToolbar` | `@/components/ui/table-with-toolbar` | `DataShell` + `DataTable` |
| `ResponsiveTable` | `@/components/ui/responsive-table` | `DataTable` |

---

## 📚 Referência de Implementação

**Arquivo gold standard:**
```
src/features/partes/components/clientes/clientes-table-wrapper.tsx
```

Este arquivo demonstra o padrão completo de implementação com:
- Server component + Client wrapper
- Estado gerenciado corretamente
- useDebounce para busca
- Filtros com reset de página
- Dialogs de create/edit
- Columns como factory function

