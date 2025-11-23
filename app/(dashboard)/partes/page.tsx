'use client';

/**
 * Página unificada de Partes
 * Gerencia Clientes, Partes Contrárias e Terceiros em um único local
 */

import * as React from 'react';
import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { Users, UserX, UserCog } from 'lucide-react';
import { ClientesTab } from './components/clientes-tab';
import { PartesContrariasTab } from './components/partes-contrarias-tab';
import { TerceirosTab } from './components/terceiros-tab';

export default function PartesPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Partes</h1>
        <p className="text-muted-foreground">
          Gerenciamento de clientes, partes contrárias e terceiros vinculados aos processos
        </p>
      </div>

      {/* Tabs */}
      <ClientOnlyTabs defaultValue="clientes" className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
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
        </TabsList>

        <TabsContent value="clientes" className="flex-1 mt-6">
          <ClientesTab />
        </TabsContent>

        <TabsContent value="partes-contrarias" className="flex-1 mt-6">
          <PartesContrariasTab />
        </TabsContent>

        <TabsContent value="terceiros" className="flex-1 mt-6">
          <TerceirosTab />
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
