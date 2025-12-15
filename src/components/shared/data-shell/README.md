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
4. **Nunca use componentes de tabela diretamente** - sempre use DataTable dentro de DataShell

## 🎨 Design System

O DataShell segue o design system do Sinesys:
- Bordas arredondadas
- Sombras consistentes
- Espaçamento padronizado
- Responsividade automática

