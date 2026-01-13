/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Gerencia estados de loading, captura e exibição da timeline.
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCopilotReadable } from "@copilotkit/react-core";
import {
  useProcessoTimeline,
  type TimelineUnificadaMetadata,
} from '../hooks/use-processo-timeline';
import { ProcessoHeader } from './processo-header';
import { TimelineContainer } from './timeline-container';
import { TimelineLoading } from './timeline-loading';
import { TimelineError } from './timeline-error';
import { TimelineEmpty } from './timeline-empty';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessoVisualizacaoProps {
  id: number;
}

export function ProcessoVisualizacao({ id }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  const { processo, timeline, isLoading, isCapturing, error, refetch, forceRecapture } =
    useProcessoTimeline(id);

  // Memoiza o valor para evitar re-renders e chamadas de API em loop
  const copilotContext = useMemo(() => ({
    // Enviamos null se ainda estiver carregando, para a IA saber que não tem dados
    status_carregamento: isLoading ? "Carregando..." : "Dados carregados",

    // Metadados do Processo (Quem é autor, réu, número, juízo)
    metadados: processo ? {
      numero: processo.numeroProcesso,
      tribunal: processo.trtOrigem || processo.trt,
      autores: processo.nomeParteAutoraOrigem || processo.nomeParteAutora,
      reus: processo.nomeParteReOrigem || processo.nomeParteRe,
      status: processo.codigoStatusProcesso,
      orgao_julgador: processo.descricaoOrgaoJulgador,
      data_autuacao: processo.dataAutuacaoOrigem || processo.dataAutuacao,
      segredo_justica: processo.segredoJustica
    } : "Sem dados do processo",

    // Timeline (O que aconteceu) - Enviamos apenas se existir
    historico_movimentacoes: timeline?.timeline ? timeline.timeline.map(item => ({
      data: item.data,
      titulo: item.titulo,
      tipo: item.documento ? "Documento" : "Movimentação", // Ajuda a IA a distinguir
      responsavel: item.nomeResponsavel || item.nomeSignatario,
      sigiloso: item.documentoSigiloso
    })) : "Timeline vazia ou carregando"
  }), [isLoading, processo, timeline]);

  useCopilotReadable({
    description: "Contexto completo do processo jurídico aberto na tela. Contém metadados (partes, juízo, status) e a timeline cronológica de movimentações e documentos.",
    value: copilotContext,
  });

  // Loading inicial
  if (isLoading) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/processos')}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <TimelineLoading message="Carregando dados do processo..." />
      </div>
    );
  }

  // Erro ao carregar
  if (error && !processo) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/processos')}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <TimelineError error={error} onRetry={refetch} />
      </div>
    );
  }

  // Processo não encontrado
  if (!processo) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/processos')}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
    <div className="w-full py-8 space-y-6">
      {/* Seta de voltar */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/processos')}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          title="Voltar para Processos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Dados do processo */}
      <ProcessoHeader
        processo={processo}
        instancias={
          timeline?.unified
            ? (timeline.metadata as TimelineUnificadaMetadata)?.instancias
            : undefined
        }
        duplicatasRemovidas={
          timeline?.unified
            ? (timeline.metadata as TimelineUnificadaMetadata)?.duplicatasRemovidas
            : undefined
        }
        onAtualizarTimeline={forceRecapture}
        isCapturing={isCapturing}
      />

      {/* Estado: Capturando timeline */}
      {isCapturing && (
        <TimelineLoading
          message={timeline === null
            ? "Capturando timeline de todas as instâncias do processo (1º grau, 2º grau, TST)... Isso pode levar alguns minutos."
            : "Capturando timeline do processo... Isso pode levar alguns minutos."
          }
        />
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
