'use client';

import { useState } from 'react';
import { AgendamentosList } from '../components/agendamentos/agendamentos-list';
import { AgendamentoDialog } from '../components/agendamento-dialog';

export default function AgendamentosPage() {
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [refreshAgendamentos, setRefreshAgendamentos] = useState(0);

  const handleAgendamentoSuccess = () => {
    setRefreshAgendamentos((prev) => prev + 1);
  };

  return (
    <>
      <AgendamentosList
        key={refreshAgendamentos}
        onNewClick={() => setAgendamentoDialogOpen(true)}
      />

      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={handleAgendamentoSuccess}
      />
    </>
  );
}
