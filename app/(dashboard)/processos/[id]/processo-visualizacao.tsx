/**
 * Componente Client para Visualização de Processo
 *
 * Usa o hook useProcessoTimeline para gerenciar estado e renderiza
 * componentes apropriados baseado no estado atual.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useProcessoTimeline } from '@/app/_lib/hooks/use-processo-timeline';
import { ProcessoHeader } from '@/components/processos/processo-header';
import { TimelineContainer } from '@/components/processos/timeline-container';
import { TimelineLoading } from '@/components/processos/timeline-loading';
import { TimelineError } from '@/components/processos/timeline-error';
import { TimelineEmpty } from '@/components/processos/timeline-empty';
import { Button } from '@/components/ui/button';

interface ProcessoVisualizacaoProps {
  acervoId: number;
}

export function ProcessoVisualizacao({ acervoId }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  const { processo, timeline, isLoading, isCapturing, error, captureProgress, refetch } =
    useProcessoTimeline(acervoId);

  // Redirecionar se ID inválido após 3 segundos
  useEffect(() => {
    if (error?.message.includes('Processo não encontrado')) {
      const timeout = setTimeout(() => {
        router.push('/processos');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [error, router]);

  // Breadcrumb e botão voltar
  const renderBreadcrumb = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push('/processos')}
          className="hover:text-foreground transition-colors"
        >
          Processos
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          {processo?.numero_processo || `#${acervoId}`}
        </span>
      </div>

      <Button variant="outline" onClick={() => router.push('/processos')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Processos
      </Button>
    </div>
  );

  // Estado: Loading inicial
  if (isLoading && !processo) {
    return (
      <>
        {renderBreadcrumb()}
        <TimelineLoading message="Carregando processo..." />
      </>
    );
  }

  // Estado: Erro
  if (error && !processo) {
    return (
      <>
        {renderBreadcrumb()}
        <TimelineError error={error} onRetry={refetch} />
      </>
    );
  }

  // Estado: Processo não encontrado (nunca deve acontecer aqui, mas garantia)
  if (!processo) {
    return (
      <>
        {renderBreadcrumb()}
        <TimelineError
          error={new Error('Processo não encontrado')}
          onRetry={refetch}
        />
      </>
    );
  }

  // Estado: Capturando timeline
  if (isCapturing) {
    return (
      <>
        {renderBreadcrumb()}
        <div className="space-y-6">
          <ProcessoHeader processo={processo} />
          <TimelineLoading message={captureProgress} isCapturing />
        </div>
      </>
    );
  }

  // Estado: Erro durante/após captura (mas processo existe)
  if (error) {
    return (
      <>
        {renderBreadcrumb()}
        <div className="space-y-6">
          <ProcessoHeader processo={processo} />
          <TimelineError error={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  // Estado: Timeline vazia
  if (!timeline || timeline.timeline.length === 0) {
    return (
      <>
        {renderBreadcrumb()}
        <div className="space-y-6">
          <ProcessoHeader processo={processo} />
          <TimelineEmpty />
        </div>
      </>
    );
  }

  // Estado: Sucesso - Exibir timeline completa
  return (
    <>
      {renderBreadcrumb()}
      <div className="space-y-6">
        <ProcessoHeader processo={processo} />
        <TimelineContainer items={timeline.timeline} />
      </div>
    </>
  );
}
