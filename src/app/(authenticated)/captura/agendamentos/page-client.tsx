'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/glass-panel';
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
      <GlassPanel depth={1} className="overflow-hidden">
        <AgendamentosList
          key={refreshAgendamentos}
          onNewClick={() => setAgendamentoDialogOpen(true)}
        />
      </GlassPanel>

      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={handleAgendamentoSuccess}
      />
    </>
  );
}
