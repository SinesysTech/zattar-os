import { notFound } from 'next/navigation';

import { CapturaResult, type CapturaResultData, CapturaErrosFormatados, CapturaRawLogs } from '@/app/(authenticated)/captura';
import { buscarCapturaLog, buscarLogsBrutoPorCapturaId } from '@/app/(authenticated)/captura/server';
import { Heading, Text } from '@/components/ui/typography';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { DetailSectionCard } from '@/components/shared';
import { IconContainer } from '@/components/ui/icon-container';
import {
  ArrowLeft,
  Activity,
  CalendarClock,
  CalendarCheck,
  Timer,
  FileJson,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function calcularDuracao(inicio: string, fim: string | null): string | null {
  if (!fim) return null;
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  if (ms < 1000) return `${ms}ms`;
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;
  if (minutos < 60) return `${minutos}m ${segsRestantes}s`;
  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;
  return `${horas}h ${minsRestantes}m ${segsRestantes}s`;
}

export default async function CapturaDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const capturaId = parseInt(id, 10);

  if (isNaN(capturaId)) {
    notFound();
  }

  const [captura, rawLogs] = await Promise.all([
    buscarCapturaLog(capturaId),
    buscarLogsBrutoPorCapturaId(capturaId),
  ]);

  if (!captura) {
    notFound();
  }

  const duracao = calcularDuracao(captura.iniciado_em, captura.concluido_em);
  const isFailed = captura.status === 'failed';
  const isCompleted = captura.status === 'completed';

  return (
    <>
      {/* Header da página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconContainer size="md" className="bg-primary/10">
            <Activity className="size-4 text-primary" />
          </IconContainer>
          <div>
            <Heading level="page">{`Captura #${captura.id}`}</Heading>
            <Text variant="caption" className="text-muted-foreground">
              {captura.tipo_captura}
            </Text>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/captura/historico">
            <ArrowLeft className="mr-2 size-3.5" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <GlassPanel depth={1} className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3 text-muted-foreground/50" />
              <Text variant="overline" className="text-muted-foreground">
                Status
              </Text>
            </div>
            <CapturaStatusSemanticBadge value={captura.status} className="w-fit" />
          </div>

          {/* Iniciado em */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="size-3 text-muted-foreground/50" />
              <Text variant="overline" className="text-muted-foreground">
                Iniciado em
              </Text>
            </div>
            <Text variant="body-sm" className="font-mono tabular-nums">
              {new Date(captura.iniciado_em).toLocaleString('pt-BR')}
            </Text>
          </div>

          {/* Concluído em */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="size-3 text-muted-foreground/50" />
              <Text variant="overline" className="text-muted-foreground">
                Concluído em
              </Text>
            </div>
            <Text variant="body-sm" className="font-mono tabular-nums">
              {captura.concluido_em
                ? new Date(captura.concluido_em).toLocaleString('pt-BR')
                : <span className="text-muted-foreground/50">—</span>}
            </Text>
          </div>

          {/* Duração */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Timer className="size-3 text-muted-foreground/50" />
              <Text variant="overline" className="text-muted-foreground">
                Duração
              </Text>
            </div>
            <Text variant="body-sm" className="font-mono tabular-nums">
              {duracao ?? <span className="text-muted-foreground/50">—</span>}
            </Text>
          </div>
        </div>
      </GlassPanel>

      {/* Resultado (quando completed) */}
      {isCompleted && (
        <WidgetContainer title="Resultado">
          <CapturaResult
            success={true}
            data={captura.resultado as CapturaResultData}
            captureId={captura.id}
          />
        </WidgetContainer>
      )}

      {/* Erros (quando failed) */}
      {isFailed && captura.erro && (
        <CapturaErrosFormatados erro={captura.erro} />
      )}

      {/* Tabs: Logs Detalhados + Dados Brutos */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="size-3.5" />
            Logs Detalhados
            {rawLogs.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {rawLogs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dados-brutos" className="gap-1.5">
            <FileJson className="size-3.5" />
            Dados Brutos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <CapturaRawLogs rawLogs={rawLogs} />
        </TabsContent>

        <TabsContent value="dados-brutos" className="mt-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 px-0.5">
              <FileJson className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Payload JSON da execução
              </h4>
            </div>
            <DetailSectionCard className="p-0 overflow-hidden">
              {captura.resultado ? (
                <pre className="p-4 overflow-auto max-h-[500px] text-xs font-mono leading-relaxed">
                  {JSON.stringify(captura.resultado, null, 2)}
                </pre>
              ) : (
                <div className="p-6 text-center">
                  <Text variant="caption" className="text-muted-foreground/60">
                    Nenhum dado disponível.
                  </Text>
                </div>
              )}
            </DetailSectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
