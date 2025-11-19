'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { HistoricoCapturas } from './components/historico-capturas';
import { AgendamentosList } from './components/agendamentos/agendamentos-list';
import { CredencialsList } from './components/credenciais/credenciais-list';
import { CapturaDialog } from './components/captura-dialog';
import { AgendamentoDialog } from './components/agendamento-dialog';
import { CredenciaisDialog } from './components/credenciais/credenciais-dialog';
import { History, Clock, Key, Plus } from 'lucide-react';

export default function CapturaPage() {
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [credencialDialogOpen, setCredencialDialogOpen] = useState(false);
  const [refreshAgendamentos, setRefreshAgendamentos] = useState(0);
  const [refreshCredenciais, setRefreshCredenciais] = useState(0);
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [buscaAgendamentos, setBuscaAgendamentos] = useState('');
  const [buscaCredenciais, setBuscaCredenciais] = useState('');
  const [selectedFilterIdsHistorico, setSelectedFilterIdsHistorico] = useState<string[]>([]);
  const [selectedFilterIdsAgendamentos, setSelectedFilterIdsAgendamentos] = useState<string[]>([]);
  const [selectedFilterIdsCredenciais, setSelectedFilterIdsCredenciais] = useState<string[]>([]);

  const handleAgendamentoSuccess = () => {
    // Forçar refresh da lista de agendamentos
    setRefreshAgendamentos((prev) => prev + 1);
  };

  const handleCredencialSuccess = () => {
    // Forçar refresh da lista de credenciais
    setRefreshCredenciais((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="historico" className="w-full">
        {/* Abas principais */}
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Agendamentos</span>
          </TabsTrigger>
          <TabsTrigger value="credenciais" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>Credenciais</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Histórico */}
        <TabsContent value="historico" className="mt-6">
          <TableToolbar
            searchValue={buscaHistorico}
            onSearchChange={setBuscaHistorico}
            searchPlaceholder="Buscar capturas..."
            filterOptions={[]}
            selectedFilters={selectedFilterIdsHistorico}
            onFiltersChange={setSelectedFilterIdsHistorico}
            onNewClick={() => setCapturaDialogOpen(true)}
            newButtonTooltip="Nova Captura"
          />
          <HistoricoCapturas />
        </TabsContent>

        {/* Conteúdo da aba Agendamentos */}
        <TabsContent value="agendamentos" className="mt-6">
          <TableToolbar
            searchValue={buscaAgendamentos}
            onSearchChange={setBuscaAgendamentos}
            searchPlaceholder="Buscar agendamentos..."
            filterOptions={[]}
            selectedFilters={selectedFilterIdsAgendamentos}
            onFiltersChange={setSelectedFilterIdsAgendamentos}
            onNewClick={() => setAgendamentoDialogOpen(true)}
            newButtonTooltip="Novo Agendamento"
          />
          <AgendamentosList
            key={refreshAgendamentos}
          />
        </TabsContent>

        {/* Conteúdo da aba Credenciais */}
        <TabsContent value="credenciais" className="mt-6">
          <TableToolbar
            searchValue={buscaCredenciais}
            onSearchChange={setBuscaCredenciais}
            searchPlaceholder="Buscar credenciais..."
            filterOptions={[]}
            selectedFilters={selectedFilterIdsCredenciais}
            onFiltersChange={setSelectedFilterIdsCredenciais}
            onNewClick={() => setCredencialDialogOpen(true)}
            newButtonTooltip="Nova Credencial"
          />
          <CredencialsList
            key={refreshCredenciais}
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
      <CredenciaisDialog
        credencial={null}
        open={credencialDialogOpen}
        onOpenChange={setCredencialDialogOpen}
        onSuccess={handleCredencialSuccess}
      />
    </div>
  );
}
