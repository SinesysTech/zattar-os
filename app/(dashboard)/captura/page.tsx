'use client';

import { useState } from 'react';
import { ClientOnlyTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { HistoricoCapturas } from './components/historico-capturas';
import { AgendamentosList } from './components/agendamentos/agendamentos-list';
import { CredencialsList } from './components/credenciais/credenciais-list';
import { TribunaisList } from './components/tribunais/tribunais-list';
import { CapturaDialog } from './components/captura-dialog';
import { AgendamentoDialog } from './components/agendamento-dialog';
import { CredenciaisDialog } from './components/credenciais/credenciais-dialog';
import { TribunaisDialog } from './components/tribunais/tribunais-dialog';
import { History, Clock, Key, Plus, Building2 } from 'lucide-react';

export default function CapturaPage() {
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [credencialDialogOpen, setCredencialDialogOpen] = useState(false);
  const [tribunalDialogOpen, setTribunalDialogOpen] = useState(false);
  const [refreshAgendamentos, setRefreshAgendamentos] = useState(0);
  const [refreshCredenciais, setRefreshCredenciais] = useState(0);
  const [refreshTribunais, setRefreshTribunais] = useState(0);
  const [buscaAgendamentos, setBuscaAgendamentos] = useState('');
  const [buscaCredenciais, setBuscaCredenciais] = useState('');
  const [buscaTribunais, setBuscaTribunais] = useState('');
  const [selectedFilterIdsAgendamentos, setSelectedFilterIdsAgendamentos] = useState<string[]>([]);
  const [selectedFilterIdsCredenciais, setSelectedFilterIdsCredenciais] = useState<string[]>([]);
  const [selectedFilterIdsTribunais, setSelectedFilterIdsTribunais] = useState<string[]>([]);

  const handleAgendamentoSuccess = () => {
    // Forçar refresh da lista de agendamentos
    setRefreshAgendamentos((prev) => prev + 1);
  };

  const handleCredencialSuccess = () => {
    // Forçar refresh da lista de credenciais
    setRefreshCredenciais((prev) => prev + 1);
  };

  const handleTribunalSuccess = () => {
    // Forçar refresh da lista de tribunais
    setRefreshTribunais((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="historico" className="w-full">
        {/* Abas principais */}
        <TabsList className="grid grid-cols-4 w-fit">
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
          <TabsTrigger value="tribunais" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Tribunais</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Histórico */}
        <TabsContent value="historico" className="mt-6">
          <HistoricoCapturas
            onNewClick={() => setCapturaDialogOpen(true)}
            newButtonTooltip="Nova Captura"
          />
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

        {/* Conteúdo da aba Tribunais */}
        <TabsContent value="tribunais" className="mt-6">
          <TableToolbar
            searchValue={buscaTribunais}
            onSearchChange={setBuscaTribunais}
            searchPlaceholder="Buscar tribunais..."
            filterOptions={[]}
            selectedFilters={selectedFilterIdsTribunais}
            onFiltersChange={setSelectedFilterIdsTribunais}
            onNewClick={() => setTribunalDialogOpen(true)}
            newButtonTooltip="Nova Configuração de Tribunal"
          />
          <TribunaisList
            key={refreshTribunais}
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
      <TribunaisDialog
        tribunal={null}
        open={tribunalDialogOpen}
        onOpenChange={setTribunalDialogOpen}
        onSuccess={handleTribunalSuccess}
      />
    </div>
  );
}
