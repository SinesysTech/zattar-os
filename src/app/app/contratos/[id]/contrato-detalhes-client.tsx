'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  Contrato,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
  ContratoCompletoStats,
} from '@/features/contratos';
import type { Lancamento } from '@/features/financeiro/domain/lancamentos';
import {
  ContratoDetalhesHeader,
  ContratoResumoCard,
  ContratoProgressCard,
  ContratoTagsCard,
  ContratoPartesCard,
  ContratoProcessosCard,
  ContratoFinanceiroCard,
  ContratoDocumentosCard,
  ContratoTimeline,
  ParteViewSheet,
  type ParteDisplay,
} from './components';

interface ContratoDetalhesClientProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
  lancamentos: Lancamento[];
}

export function ContratoDetalhesClient({
  contrato,
  cliente,
  responsavel,
  segmento,
  stats,
  lancamentos,
}: ContratoDetalhesClientProps) {
  const [selectedParte, setSelectedParte] = React.useState<ParteDisplay | null>(null);
  const [parteSheetOpen, setParteSheetOpen] = React.useState(false);

  const handleViewParte = (parte: ParteDisplay) => {
    setSelectedParte(parte);
    setParteSheetOpen(true);
  };

  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;

  return (
    <div className="space-y-4">
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
      />

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-1">
              <ContratoResumoCard
                contrato={contrato}
                cliente={cliente}
                responsavel={responsavel}
                stats={stats}
              />
              <ContratoProgressCard status={contrato.status} />
              <ContratoTagsCard
                tipoContrato={contrato.tipoContrato}
                tipoCobranca={contrato.tipoCobranca}
                papelClienteNoContrato={contrato.papelClienteNoContrato}
                segmento={segmento}
              />
            </div>
            <div className="space-y-4 xl:col-span-2">
              <ContratoPartesCard
                partes={contrato.partes}
                onViewParte={handleViewParte}
              />
              <ContratoProcessosCard processos={contrato.processos} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <ContratoFinanceiroCard lancamentos={lancamentos} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <ContratoDocumentosCard contratoId={contrato.id} />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <ContratoTimeline historico={contrato.statusHistorico} />
        </TabsContent>
      </Tabs>

      <ParteViewSheet
        open={parteSheetOpen}
        onOpenChange={setParteSheetOpen}
        parte={selectedParte}
      />
    </div>
  );
}
