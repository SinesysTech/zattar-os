'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HistoricoCapturas } from '@/components/captura/historico-capturas';
import { AgendamentosList } from '@/components/captura/agendamentos/agendamentos-list';
import { CapturaDialog } from '@/components/captura/captura-dialog';
import { AgendamentoDialog } from '@/components/captura/agendamento-dialog';
import { History, Clock, Plus } from 'lucide-react';

export default function CapturaPage() {
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [refreshAgendamentos, setRefreshAgendamentos] = useState(0);

  const handleAgendamentoSuccess = () => {
    // Forçar refresh da lista de agendamentos
    setRefreshAgendamentos((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="historico" className="w-full">
        {/* Abas principais */}
        <TabsList className="grid grid-cols-2 w-fit">
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Agendamentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Histórico */}
        <TabsContent value="historico" className="mt-6">
          <HistoricoCapturas
            actionButton={
              <Button onClick={() => setCapturaDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Captura
              </Button>
            }
          />
        </TabsContent>

        {/* Conteúdo da aba Agendamentos */}
        <TabsContent value="agendamentos" className="mt-6">
          <AgendamentosList
            key={refreshAgendamentos}
            actionButton={
              <Button onClick={() => setAgendamentoDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CapturaDialog
        open={capturaDialogOpen}
        onOpenChange={setCapturaDialogOpen}
      />
      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={handleAgendamentoSuccess}
      />
    </div>
  );
}
