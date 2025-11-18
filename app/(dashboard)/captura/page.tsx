'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AcervoGeralForm } from '@/components/captura/acervo-geral-form';
import { ArquivadosForm } from '@/components/captura/arquivados-form';
import { AudienciasForm } from '@/components/captura/audiencias-form';
import { PendentesForm } from '@/components/captura/pendentes-form';
import { HistoricoCapturas } from '@/components/captura/historico-capturas';
import { AgendamentoForm } from '@/components/captura/agendamentos/agendamento-form';
import { AgendamentosList } from '@/components/captura/agendamentos/agendamentos-list';
import { Database, Archive, Calendar, AlertCircle, History, Clock } from 'lucide-react';

export default function CapturaPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="captura" className="w-full">
        {/* Abas principais: Captura, Agendamentos e Histórico */}
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="captura" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Captura</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Agendamentos</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Captura */}
        <TabsContent value="captura" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="acervo-geral" className="w-full">
                {/* Abas dos tipos de captura */}
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="acervo-geral" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="hidden sm:inline">Acervo Geral</span>
                    <span className="sm:hidden">Acervo</span>
                  </TabsTrigger>
                  <TabsTrigger value="arquivados" className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:inline">Arquivados</span>
                    <span className="sm:hidden">Arquiv.</span>
                  </TabsTrigger>
                  <TabsTrigger value="audiencias" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Audiências</span>
                    <span className="sm:hidden">Aud.</span>
                  </TabsTrigger>
                  <TabsTrigger value="pendentes" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Expedientes</span>
                    <span className="sm:hidden">Exp.</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="acervo-geral" className="mt-6">
                  <AcervoGeralForm />
                </TabsContent>

                <TabsContent value="arquivados" className="mt-6">
                  <ArquivadosForm />
                </TabsContent>

                <TabsContent value="audiencias" className="mt-6">
                  <AudienciasForm />
                </TabsContent>

                <TabsContent value="pendentes" className="mt-6">
                  <PendentesForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Agendamentos */}
        <TabsContent value="agendamentos" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="listar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="listar">Listar Agendamentos</TabsTrigger>
                  <TabsTrigger value="criar">Criar Agendamento</TabsTrigger>
                </TabsList>
                <TabsContent value="listar" className="mt-6">
                  <AgendamentosList />
                </TabsContent>
                <TabsContent value="criar" className="mt-6">
                  <AgendamentoForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Histórico */}
        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <HistoricoCapturas />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
