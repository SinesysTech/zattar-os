'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AcervoGeralForm } from '@/components/captura/acervo-geral-form';
import { ArquivadosForm } from '@/components/captura/arquivados-form';
import { AudienciasForm } from '@/components/captura/audiencias-form';
import { PendentesForm } from '@/components/captura/pendentes-form';
import { Database, Archive, Calendar, AlertCircle } from 'lucide-react';

export default function CapturaPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="acervo-geral" className="w-full">
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
    </div>
  );
}

