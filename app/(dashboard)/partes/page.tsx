'use client';

/**
 * Página unificada de Partes
 * Gerencia Clientes, Partes Contrárias e Terceiros em um único local
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { Users, UserX, UserCog, Scale } from 'lucide-react';
import { ClientesTab } from './components/clientes-tab';
import { PartesContrariasTab } from './components/partes-contrarias-tab';
import { TerceirosTab } from './components/terceiros-tab';
import { RepresentantesTab } from './components/representantes-tab';

type TabValue = 'clientes' | 'partes-contrarias' | 'terceiros' | 'representantes';

export default function PartesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabValue | null;

  // Define a aba ativa baseada no query param, com fallback para 'clientes'
  const activeTab: TabValue = tabParam && ['clientes', 'partes-contrarias', 'terceiros', 'representantes'].includes(tabParam)
    ? tabParam
    : 'clientes';

  const handleTabChange = (value: string) => {
    // Atualiza a URL quando a aba muda
    router.push(`/partes?tab=${value}`);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <ClientOnlyTabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="partes-contrarias" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Partes Contrárias
          </TabsTrigger>
          <TabsTrigger value="terceiros" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Terceiros
          </TabsTrigger>
          <TabsTrigger value="representantes" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Representantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-4">
          <ClientesTab />
        </TabsContent>

        <TabsContent value="partes-contrarias" className="space-y-4">
          <PartesContrariasTab />
        </TabsContent>

        <TabsContent value="terceiros" className="space-y-4">
          <TerceirosTab />
        </TabsContent>

        <TabsContent value="representantes" className="space-y-4">
          <RepresentantesTab />
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
