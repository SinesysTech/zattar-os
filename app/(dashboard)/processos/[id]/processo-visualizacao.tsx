/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Gerencia estados de loading, captura e exibição da timeline.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useProcessoTimeline } from '@/lib/hooks/use-processo-timeline';
import { ProcessoHeader } from '@/components/processos/processo-header';
import { TimelineContainer } from '@/components/processos/timeline-container';
import { TimelineLoading } from '@/components/processos/timeline-loading';
import { TimelineError } from '@/components/processos/timeline-error';
import { TimelineEmpty } from '@/components/processos/timeline-empty';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessoVisualizacaoProps {
  id: number;
}

export function ProcessoVisualizacao({ id }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  const { processo, timeline, isLoading, isCapturing, error, refetch } =
    useProcessoTimeline(id);

  // Loading inicial
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <TimelineLoading message="Carregando dados do processo..." />
      </div>
    );
  }

  // Erro ao carregar
  if (error && !processo) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Processo</h1>
        </div>
        <TimelineError error={error} onRetry={refetch} />
      </div>
    );
  }

  // Processo não encontrado
  if (!processo) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Processo não encontrado</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processo não encontrado</AlertTitle>
          <AlertDescription>
            O processo solicitado não foi encontrado ou você não tem permissão para acessá-lo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/processos')}
          title="Voltar para Processos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Processos → {processo.numero_processo}
          </p>
        </div>
      </div>

      {/* Dados do processo */}
      <ProcessoHeader processo={processo} />

      {/* Estado: Capturando timeline */}
      {isCapturing && (
        <TimelineLoading message="Capturando timeline do processo... Isso pode levar alguns minutos." />
      )}

      {/* Estado: Timeline vazia */}
      {!isCapturing && timeline && timeline.timeline.length === 0 && <TimelineEmpty />}

      {/* Estado: Timeline carregada */}
      {!isCapturing && timeline && timeline.timeline.length > 0 && (
        <TimelineContainer items={timeline.timeline} isLoading={false} />
      )}

      {/* Estado: Erro durante captura */}
      {error && processo && (
        <TimelineError
          error={error}
          onRetry={refetch}
          message="Ocorreu um erro ao capturar a timeline do processo."
        />
      )}
    </div>
  );
}
