'use client';

import { useState } from 'react';
import { ClientOnlyTabs } from '@/components/ui/client-only-tabs';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComunicaCNJConsulta } from './components/comunica-cnj-consulta';
import { ComunicaCNJCapturadas } from './components/comunica-cnj-capturadas';
import { Search, FileStack } from 'lucide-react';

/**
 * Página principal do Comunica CNJ
 * Contém duas tabs: Consulta (busca na API) e Capturadas (lista do banco)
 */
export default function ComunicaCNJPage() {
  const [activeTab, setActiveTab] = useState<string>('consulta');

  return (
    <ClientOnlyTabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="consulta" className="gap-2">
          <Search className="h-4 w-4" />
          Consulta
        </TabsTrigger>
        <TabsTrigger value="capturadas" className="gap-2">
          <FileStack className="h-4 w-4" />
          Capturadas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="consulta" className="mt-4">
        <ComunicaCNJConsulta />
      </TabsContent>

      <TabsContent value="capturadas" className="mt-4">
        <ComunicaCNJCapturadas />
      </TabsContent>
    </ClientOnlyTabs>
  );
}
