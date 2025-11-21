/**
 * Componente Client para Visualização de Processo
 *
 * Usa o hook useProcessoTimeline para gerenciar estado e renderiza
 * componentes apropriados baseado no estado atual.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TODO: Implementar hook use-processo-timeline
// import { useProcessoTimeline } from '@/app/_lib/hooks/use-processo-timeline';
// import { ProcessoHeader } from '@/components/processos/processo-header';
// import { TimelineContainer } from '@/components/processos/timeline-container';
// import { TimelineLoading } from '@/components/processos/timeline-loading';
// import { TimelineError } from '@/components/processos/timeline-error';
// import { TimelineEmpty } from '@/components/processos/timeline-empty';

interface ProcessoVisualizacaoProps {
  acervoId: number;
}

export function ProcessoVisualizacao({ acervoId }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  // TODO: Implementar hook use-processo-timeline
  // const { processo, timeline, isLoading, isCapturing, error, captureProgress, refetch } =
  //   useProcessoTimeline(acervoId);

  // TEMPORÁRIO: retornar mensagem até implementar o hook
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Visualização de Processo</h2>
        <p className="text-muted-foreground">
          Esta funcionalidade está em desenvolvimento.
        </p>
        <Button variant="outline" onClick={() => router.push('/processos')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Processos
        </Button>
      </div>
    </div>
  );
}
