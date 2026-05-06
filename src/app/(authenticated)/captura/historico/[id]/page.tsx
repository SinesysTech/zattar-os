import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

import { CapturaResult, type CapturaResultData, CapturaErrosFormatados, CapturaRawLogs } from '@/app/(authenticated)/captura';
import { buscarCapturaLog, buscarLogsBrutoPorCapturaId } from '@/app/(authenticated)/captura/server';
import { Heading, Text } from '@/components/ui/typography';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { DetailSectionCard } from '@/components/shared';
import {
  ArrowLeft,
  Activity,
  CalendarClock,
  CalendarCheck,
  Timer,
  FileJson,
  ScrollText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatarTipoCaptura, formatarDuracao } from '@/app/(authenticated)/captura/utils/format-captura';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

  const duracao = formatarDuracao(captura.iniciado_em, captura.concluido_em);
  const isFailed = captura.status === 'failed';
  const isCompleted = captura.status === 'completed';
  const isInProgress = captura.status === 'in_progress';

  const tipoFormatado = formatarTipoCaptura(captura.tipo_captura);

  return (
    <>
      {/* Atmospheric glow */}
      <div className="fixed -top-8 right-16 w-64 h-48 bg-primary/4 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-16 right-48 w-32 h-32 bg-info/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header da página */}
      <div className={cn("flex flex-col inline-default sm:flex-row sm:items-center sm:justify-between relative")}>
        <div>
          <Heading level="page">{tipoFormatado}</Heading>
          <div className={cn("flex items-center inline-tight mt-0.5")}>
            <p className={cn("text-overline text-muted-foreground")}>
              Captura #{captura.id}
            </p>
            {isInProgress && (
              <span className={cn("text-overline inline-flex items-center inline-micro text-info")}>
                <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
                em andamento
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/captura/historico">
            <ArrowLeft className="mr-2 size-3.5" />
            Voltar ao histórico
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <GlassPanel depth={1} className={cn("inset-card-compact")}>
        <div className={cn("grid grid-cols-2 inline-default sm:grid-cols-4")}>
          {/* Status */}
          <div className={cn("flex flex-col inline-snug")}>
            <div className={cn("flex items-center inline-snug")}>
              <Activity className="size-3 text-muted-foreground/70" />
              <p className={cn("text-overline text-muted-foreground/75")}>
                Status
              </p>
            </div>
            <div className="relative w-fit">
              {isInProgress && (
                <span className="absolute inset-0 rounded-full bg-info/20 animate-pulse" />
              )}
              <CapturaStatusSemanticBadge value={captura.status} className="relative w-fit" />
            </div>
          </div>

          {/* Iniciado em */}
          <div className={cn("flex flex-col inline-snug")}>
            <div className={cn("flex items-center inline-snug")}>
              <CalendarClock className="size-3 text-muted-foreground/70" />
              <p className={cn("text-overline text-muted-foreground/75")}>
                Iniciado em
              </p>
            </div>
            <p className={cn("text-body-sm tabular-nums text-foreground/80")}>
              {new Date(captura.iniciado_em).toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Concluído em */}
          <div className={cn("flex flex-col inline-snug")}>
            <div className={cn("flex items-center inline-snug")}>
              <CalendarCheck className="size-3 text-muted-foreground/70" />
              <p className={cn("text-overline text-muted-foreground/75")}>
                Concluído em
              </p>
            </div>
            <p className={cn("text-body-sm tabular-nums text-foreground/80")}>
              {captura.concluido_em
                ? new Date(captura.concluido_em).toLocaleString('pt-BR')
                : <span className="text-muted-foreground/65">—</span>}
            </p>
          </div>

          {/* Duração */}
          <div className={cn("flex flex-col inline-snug")}>
            <div className={cn("flex items-center inline-snug")}>
              <Timer className="size-3 text-muted-foreground/70" />
              <p className={cn("text-overline text-muted-foreground/75")}>
                Duração
              </p>
            </div>
            <p className={cn( "text-body-sm tabular-nums font-display font-semibold text-foreground/80")}>
              {duracao ?? <span className="text-muted-foreground/65 font-normal">—</span>}
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Indicador visual rápido de resultado */}
      {(isCompleted || isFailed) && (
        <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 ${
          isCompleted
            ? 'border-success/20 bg-success/4'
            : 'border-destructive/20 bg-destructive/4'
        }`}>
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <p className={cn( "text-body-sm font-medium")}>
            {isCompleted ? 'Captura concluída com sucesso' : 'Captura finalizada com erros'}
          </p>
          {rawLogs.length > 0 && (
            <Text variant="caption" className="ml-auto">
              {rawLogs.length} registro{rawLogs.length !== 1 ? 's' : ''} de log
            </Text>
          )}
        </div>
      )}

      {/* Resultado (quando completed) */}
      {isCompleted && captura.resultado && (
        <WidgetContainer title="Resultado da captura">
          <CapturaResult
            success={true}
            data={captura.resultado as CapturaResultData}
            captureId={captura.id}
          />
        </WidgetContainer>
      )}

      {/* Erros (quando failed) */}
      {isFailed && captura.erro && (
        <WidgetContainer title="Diagnóstico de erros">
          <CapturaErrosFormatados erro={captura.erro} />
        </WidgetContainer>
      )}

      {/* Tabs: Logs Detalhados + Dados Brutos */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs" className={cn("flex inline-snug")}>
            <ScrollText className="size-3.5" />
            Logs por tribunal
            {rawLogs.length > 0 && (
              <Badge variant="secondary" className={cn("ml-1 text-[10px] px-1.5 py-0")}>
                {rawLogs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dados-brutos" className={cn("flex inline-snug")}>
            <FileJson className="size-3.5" />
            Payload bruto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <CapturaRawLogs rawLogs={rawLogs} />
        </TabsContent>

        <TabsContent value="dados-brutos" className="mt-4">
          <div className="flex flex-col">
            <div className={cn("flex items-center inline-tight mb-2.5 px-0.5")}>
              <AlertTriangle className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <h4 className={cn( "text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]")}>
                Payload JSON da execução — dados técnicos para auditoria
              </h4>
            </div>
            <DetailSectionCard className={cn(/* design-system-escape: p-0 → usar <Inset> */ "inset-none overflow-hidden")}>
              {captura.resultado ? (
                <pre className={cn("inset-card-compact overflow-auto max-h-125 text-caption font-mono leading-relaxed")}>
                  {JSON.stringify(captura.resultado, null, 2)}
                </pre>
              ) : (
                <div className={cn("inset-dialog text-center")}>
                  <p className="text-[11px] text-muted-foreground/75">
                    Nenhum dado disponível.
                  </p>
                </div>
              )}
            </DetailSectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
