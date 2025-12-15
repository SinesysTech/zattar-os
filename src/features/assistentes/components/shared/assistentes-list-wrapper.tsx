'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Assistente, ViewMode, PaginacaoResult } from '../../types';
import { useAssistentes } from '../../hooks/use-assistentes';
import { GridView } from '../list/grid-view';
import { ViewToggle } from '../list/view-toggle';
import { CreateDialog } from '../dialogs/create-dialog';
import { EditDialog } from '../dialogs/edit-dialog';
import { DeleteDialog } from '../dialogs/delete-dialog';
import { buildAssistentesFilterOptions, buildAssistentesFilterGroups, parseAssistentesFilters } from './toolbar-filters';

interface AssistentesListWrapperProps {
  initialData: PaginacaoResult<Assistente>;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

export function AssistentesListWrapper({ initialData, permissions }: AssistentesListWrapperProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<ViewMode>('cards');
  
  const { data, ...initialPagination } = initialData;
  
  const { 
    assistentes, 
    paginacao, 
    setPagina, 
    setBusca, 
    setFiltros, 
    refetch 
  } = useAssistentes({
    initialParams: {
      pagina: initialData.pagina,
      limite: initialData.limite,
    },
    initialData: data,
    initialPagination,
  });

  // Dialog states
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedAssistente, setSelectedAssistente] = React.useState<Assistente | null>(null);

  const handleEdit = (assistente: Assistente) => {
    setSelectedAssistente(assistente);
    setEditOpen(true);
  };

  const handleDelete = (assistente: Assistente) => {
    setSelectedAssistente(assistente);
    setDeleteOpen(true);
  };

  const handleView = (assistente: Assistente) => {
    router.push(`/assistentes/${assistente.id}`);
  };

  const handleFilterChange = (selectedFilters: string[]) => {
    const filters = parseAssistentesFilters(selectedFilters);
    setFiltros(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
         <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
         
         <TableToolbar
            searchPlaceholder="Buscar assistentes..."
            onSearch={setBusca}
            filterOptions={buildAssistentesFilterOptions()} // This expects {label, value}[]
            filterGroups={buildAssistentesFilterGroups()}
            onFilterChange={handleFilterChange}
            newButtonLabel={permissions.canCreate ? "Novo Assistente" : undefined}
            onNewClick={permissions.canCreate ? () => setCreateOpen(true) : undefined}
         />
      </div>

      {viewMode === 'cards' ? (
        <GridView 
          assistentes={assistentes}
          paginacao={paginacao}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={(idx) => setPagina(idx + 1)}
          onPageSizeChange={(size) => setFiltros({ limite: size })}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
        />
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
           Tabela não implementada (FSD Migration Placeholder)
        </div>
      )}

      <CreateDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        onSuccess={refetch}
      />

      {selectedAssistente && (
        <>
          <EditDialog 
            open={editOpen} 
            onOpenChange={setEditOpen} 
            assistente={selectedAssistente} 
            onSuccess={refetch}
          />
          <DeleteDialog 
            open={deleteOpen} 
            onOpenChange={setDeleteOpen} 
            assistente={selectedAssistente} 
            onSuccess={refetch}
          />
        </>
      )}
    </div>
  );
}
