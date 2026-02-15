'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Assistente } from '../../domain';
import { useAssistentes } from '../../hooks/use-assistentes';
import { GridView } from '../list/grid-view';
import { CreateDialog } from '../dialogs/create-dialog';
import { EditDialog } from '../dialogs/edit-dialog';
import { DeleteDialog } from '../dialogs/delete-dialog';
import { DataShell } from '@/components/shared/data-shell';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';

interface AssistentesListWrapperProps {
  initialData: Assistente[];
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

export function AssistentesListWrapper({ initialData, permissions }: AssistentesListWrapperProps) {
  const router = useRouter();

  const {
    assistentes,
    setBusca,
    refetch
  } = useAssistentes({
    initialData,
  });

  // Search state
  const [busca, setBuscaState] = React.useState('');

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

  const handleSearchChange = (value: string) => {
    setBuscaState(value);
    setBusca(value);
  };

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Assistentes"
            searchValue={busca}
            onSearchValueChange={handleSearchChange}
            searchPlaceholder="Buscar assistentes..."
            actionButton={
              permissions.canCreate
                ? {
                    label: 'Novo Assistente',
                    onClick: () => setCreateOpen(true),
                  }
                : undefined
            }
          />
        }
      >
        <GridView
          assistentes={assistentes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
        />
      </DataShell>
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
    </>
  );
}
