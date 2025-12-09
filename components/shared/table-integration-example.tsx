'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/page-shell';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { TableToolbar, type FilterGroup } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/shared/table-pagination';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DetailSheet } from '@/components/shared/detail-sheet';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- Mock Data and Types ---
interface ExampleData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

const mockData: ExampleData[] = Array.from({ length: 100 }, (_, i) => ({
  id: `USR-00${i + 1}`,
  name: `User Name ${i + 1}`,
  status: ['active', 'inactive', 'pending'][i % 3] as 'active' | 'inactive' | 'pending',
  createdAt: new Date(new Date().setDate(new Date().getDate() - i)),
}));

const statusMap: Record<ExampleData['status'], { label: string; variant: 'success' | 'destructive' | 'warning' }> = {
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'destructive' },
  pending: { label: 'Pendente', variant: 'warning' },
};

const columns: ColumnDef<ExampleData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { label, variant } = statusMap[row.original.status];
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => new Intl.DateTimeFormat('pt-BR').format(row.original.createdAt),
  },
];

const filterGroups: FilterGroup[] = [
    {
        label: "Status",
        options: [
            { value: "active", label: "Ativo" },
            { value: "inactive", label: "Inativo" },
            { value: "pending", label: "Pendente" },
        ]
    }
]

// --- Component ---
export function TableIntegrationExample() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedRow, setSelectedRow] = React.useState<ExampleData | null>(null);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  // --- Data Filtering and Pagination Logic ---
  const filteredData = React.useMemo(() => {
    let data = mockData;

    if (search) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filters.length > 0) {
      data = data.filter(item => filters.includes(item.status));
    }

    return data;
  }, [search, filters]);

  const paginatedData = React.useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <PageShell
      title="Exemplo de Tabela Integrada"
      description="Demonstração da integração de PageShell, DataTableShell, Toolbar, Pagination e DetailSheet."
      actions={<Button onClick={() => setDialogOpen(true)}>Nova Ação</Button>}
    >
      <DataTableShell
        toolbar={
          <TableToolbar
            variant="integrated"
            searchValue={search}
            onSearchChange={setSearch}
            filterGroups={filterGroups}
            selectedFilters={filters}
            onFiltersChange={setFilters}
            onNewClick={() => setDialogOpen(true)}
            newButtonTooltip='Criar novo item'
            filterButtonsMode='buttons'
          />
        }
        pagination={
          <TablePagination
            variant="integrated"
            pageIndex={page}
            pageSize={pageSize}
            total={filteredData.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        }
      >
        <DataTable
          data={paginatedData}
          columns={columns}
          onRowClick={(row) => setSelectedRow(row)}
          hideTableBorder={true} // The border is handled by DataTableShell
        />
      </DataTableShell>

      <DetailSheet
        open={!!selectedRow}
        onOpenChange={(isOpen) => !isOpen && setSelectedRow(null)}
        title="Detalhes do Item"
        description={`Visualizando detalhes para ${selectedRow?.id}`}
      >
        <div className="space-y-4">
            {selectedRow && Object.entries(selectedRow).map(([key, value]) => (
                <div key={key}>
                    <p className='text-sm font-medium text-muted-foreground'>{key}</p>
                    <p className='text-sm'>{String(value)}</p>
                </div>
            ))}
        </div>
      </DetailSheet>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Ação Rápida</DialogTitle>
                  <DialogDescription>
                    Exemplo de formulário em um Dialog para ações rápidas.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nome</Label>
                      <Input id="name" value="Novo item" className="col-span-3" />
                  </div>
              </div>
              <DialogFooter>
                  <Button type="submit" onClick={() => setDialogOpen(false)}>Salvar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </PageShell>
  );
}
