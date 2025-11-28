'use client';

import { useState } from 'react';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { AgendamentosList } from '../components/agendamentos/agendamentos-list';
import { AgendamentoDialog } from '../components/agendamento-dialog';

export default function AgendamentosPage() {
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [refreshAgendamentos, setRefreshAgendamentos] = useState(0);
  const [buscaAgendamentos, setBuscaAgendamentos] = useState('');
  const [selectedFilterIdsAgendamentos, setSelectedFilterIdsAgendamentos] = useState<string[]>([]);

  const handleAgendamentoSuccess = () => {
    setRefreshAgendamentos((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={buscaAgendamentos}
        onSearchChange={setBuscaAgendamentos}
        searchPlaceholder="Buscar agendamentos..."
        filterOptions={[]}
        selectedFilters={selectedFilterIdsAgendamentos}
        onFiltersChange={setSelectedFilterIdsAgendamentos}
        onNewClick={() => setAgendamentoDialogOpen(true)}
        newButtonTooltip="Novo Agendamento"
        showFilterButton={false}
      />
      <AgendamentosList key={refreshAgendamentos} />

      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={handleAgendamentoSuccess}
      />
    </div>
  );
}

