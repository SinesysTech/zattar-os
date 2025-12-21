'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Assistente } from '../../domain';
import { useAssistentes } from '../../hooks/use-assistentes';
import { GridView } from '../list/grid-view';
import { CreateDialog } from '../dialogs/create-dialog';
import { EditDialog } from '../dialogs/edit-dialog';
import { DeleteDialog } from '../dialogs/delete-dialog';

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


  return (
    <div className="space-y-4">
      <TableToolbar
        variant="integrated"
        searchPlaceholder="Buscar assistentes..."
        onSearch={setBusca}
        newButtonLabel={permissions.canCreate ? "Novo Assistente" : undefined}
        onNewClick={permissions.canCreate ? () => setCreateOpen(true) : undefined}
      />

      <GridView
        assistentes={assistentes}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
      />

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
