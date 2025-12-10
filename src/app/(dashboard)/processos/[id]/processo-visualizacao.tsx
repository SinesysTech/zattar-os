/**
 * Componente de Visualização de Processo (Client Component)
 *
 * Gerencia estados de loading, captura e exibição da timeline.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useCopilotReadable } from "@copilotkit/react-core";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";
import {
  useProcessoTimeline,
  type TimelineUnificadaMetadata,
} from '@/app/_lib/hooks/use-processo-timeline';
import { ProcessoHeader } from '@/core/app/(dashboard)/processos/components/processo-header';
import { TimelineContainer } from '@/core/app/(dashboard)/processos/components/timeline-container';
import { TimelineLoading } from '@/core/app/(dashboard)/processos/components/timeline-loading';
import { TimelineError } from '@/core/app/(dashboard)/processos/components/timeline-error';
import { TimelineEmpty } from '@/core/app/(dashboard)/processos/components/timeline-empty';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
interface ProcessoVisualizacaoProps {
  id: number;
}
export function ProcessoVisualizacao({ id }: ProcessoVisualizacaoProps) {
  const router = useRouter();
  const { processo, timeline, isLoading, isCapturing, error, refetch, forceRecapture } =
    useProcessoTimeline(id);

  useCopilotReadable({
    description: "Contexto completo do processo jurídico aberto na tela. Contém metadados (partes, juízo, status) e a timeline cronológica de movimentações e documentos.",
    value: {
      // Enviamos null se ainda estiver carregando, para a IA saber que não tem dados
      status_carregamento: isLoading ? "Carregando..." : "Dados carregados",
      
      // Metadados do Processo (Quem é autor, réu, número, juízo)
      metadados: processo ? {
        numero: processo.numero_processo,
        tribunal: processo.trt,
        autores: processo.nome_parte_autora,
        reus: processo.nome_parte_re,
        status: processo.codigo_status_processo,
        orgao_julgador: processo.descricao_orgao_julgador,
        data_autuacao: processo.data_autuacao,
        segredo_justica: processo.segredo_justica
      } : "Sem dados do processo",

      // Timeline (O que aconteceu) - Enviamos apenas se existir
      historico_movimentacoes: timeline?.timeline ? timeline.timeline.map(item => ({
        data: item.data,
        titulo: item.titulo,
        tipo: item.documento ? "Documento" : "Movimentação", // Ajuda a IA a distinguir
        responsavel: item.nomeResponsavel || item.nomeSignatario,
        sigiloso: item.documentoSigiloso
      })) : "Timeline vazia ou carregando"
    },
  });
  useCopilotChatSuggestions({
    // Instruções para a IA gerar sugestões baseadas no contexto que ela acabou de ler
    instructions: `
      Com base nos dados do processo que você está lendo (timeline e metadados),
      gere 3 perguntas curtas e diretas que ajudariam um advogado a analisar este caso rapidamente.
      
      Exemplos de estilo:
      - "Resumir últimas movimentações"
      - "Identificar riscos processuais"
      - "Listar documentos pendentes"
      
      Adapte ao status atual do processo: ${processo?.codigo_status_processo || 'desconhecido'}.
    `,
    // Opcional: define o mínimo/máximo de sugestões
    minSuggestions: 2,
    maxSuggestions: 3,
  });

  // Loading inicial
  if (isLoading) {
    return (
      <div className="w-full py-8 space-y-6">
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
      <div className="w-full py-8 space-y-6">
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
      <div className="w-full py-8 space-y-6">
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
    <div className="w-full py-8 space-y-6">
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
        <Button
          variant="outline"
          size="sm"
          onClick={forceRecapture}
          disabled={isCapturing}
          className="gap-2"
          title="Atualizar timeline do processo"
        >
          <RefreshCw className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
          Atualizar Timeline
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
