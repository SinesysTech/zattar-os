'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText, ExternalLink, Download, Lock, MousePointerClick, RefreshCw} from 'lucide-react';
import { toast } from 'sonner';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionGerarUrlDownload } from '@/app/(authenticated)/documentos';
import { Heading, Text } from '@/components/ui/typography';

import { LoadingSpinner } from "@/components/ui/loading-state"
type TimelineItemWithGrau = TimelineItemEnriquecido & {
  grauOrigem?: GrauProcesso;
};

interface DocumentViewerPanelProps {
  item: TimelineItemWithGrau | null;
  /** Callback para forçar recaptura da timeline */
  onRecapture?: () => void;
  /** Se uma recaptura está em andamento */
  isCapturing?: boolean;
}

function formatarGrauComOrdinal(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'Tribunal Superior';
    case 'segundo_grau':
      return '2º Grau';
    case 'primeiro_grau':
      return '1º Grau';
    default:
      return grau;
  }
}

export function DocumentViewerPanel({ item, onRecapture, isCapturing }: DocumentViewerPanelProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar presigned URL quando item muda
  useEffect(() => {
    if (!item?.backblaze?.key) {
      setPresignedUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPresignedUrl(null);

    actionGerarUrlDownload(item.backblaze.key)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setPresignedUrl(result.data.url);
        } else {
          throw new Error(
            result.error || 'Erro ao gerar URL de acesso ao documento'
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erro ao buscar URL assinada:', err);
        setError('Erro ao gerar acesso ao documento. Tente novamente.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.backblaze?.key]);

  const handleOpenNewTab = () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!item?.backblaze?.key) return;

    try {
      const result = await actionGerarUrlDownload(item.backblaze.key);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar URL de download');
      }
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = item.backblaze.fileName || 'documento.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      toast.error('Erro ao baixar documento. Tente novamente.');
    }
  };

  // Estado vazio — nenhum documento selecionado
  if (!item) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center h-full text-center inline-medium p-8")}>
        <div className={cn("rounded-full bg-muted inset-card-compact")}>
          <MousePointerClick className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className={cn("text-body-sm text-muted-foreground")}>
          Selecione um documento na timeline para visualizar
        </p>
      </div>
    );
  }

  // Documento sigiloso sem Backblaze
  if (item.documentoSigiloso && !item.backblaze) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center h-full text-center inline-medium p-8")}>
        <div className={cn("rounded-full bg-destructive/10 inset-card-compact")}>
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <div className={cn("flex flex-col stack-micro")}>
          <p className={cn( "text-body-sm font-medium")}>{item.titulo}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>
            Documento sigiloso — visualização restrita
          </p>
        </div>
      </div>
    );
  }

  // Documento sem Backblaze (não capturado)
  if (!item.backblaze) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center h-full text-center inline-default p-8")}>
        <div className={cn("rounded-full bg-muted inset-card-compact")}>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className={cn("flex flex-col stack-micro")}>
          <p className={cn( "text-body-sm font-medium")}>{item.titulo}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>
            Documento não foi capturado ou enviado para armazenamento
          </p>
          <Text variant="caption" className="text-muted-foreground/70">
            Atualize a timeline para tentar capturar este documento novamente.
          </Text>
        </div>
        {onRecapture && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecapture}
            disabled={isCapturing}
            className={cn("flex inline-tight")}
          >
            {isCapturing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isCapturing ? 'Capturando...' : 'Atualizar Timeline'}
          </Button>
        )}
      </div>
    );
  }

  const formatarDataHora = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header do documento */}
      <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex flex-col flex-none border-b p-3 stack-snug")}>
        <div className={cn("flex items-center justify-between inline-tight")}>
          <div className={cn("flex items-center inline-tight min-w-0 flex-1")}>
            {item.grauOrigem && (
              <SemanticBadge
                category="grau"
                value={item.grauOrigem}
                className={cn("text-caption shrink-0")}
              >
                {formatarGrauComOrdinal(item.grauOrigem)}
              </SemanticBadge>
            )}
            <Heading level="card" className={cn("text-body-sm truncate")}>{item.titulo}</Heading>
            {item.documentoSigiloso && (
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <div className={cn("flex items-center inline-micro shrink-0")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon" aria-label="Abrir em nova aba"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleOpenNewTab}
                    disabled={!presignedUrl}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir em nova aba</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon" aria-label="Baixar"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Text variant="caption" className="space-x-2">
          <span>{formatarDataHora(item.data)}</span>
          {(item.nomeSignatario || item.nomeResponsavel) && (
            <>
              <span>·</span>
              <span>{item.nomeSignatario || item.nomeResponsavel}</span>
            </>
          )}
        </Text>
      </div>

      {/* Área do PDF */}
      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <LoadingSpinner className="size-6 text-primary" />
          </div>
        )}

        {error ? (
          <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center h-full inline-medium p-8")}>
            <FileText className="h-12 w-12 text-destructive" />
            <p className={cn("text-body-sm text-destructive text-center")}>{error}</p>
          </div>
        ) : (
          presignedUrl && (
            <iframe
              src={`${presignedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full"
              title={item.titulo}
            />
          )
        )}
      </div>
    </div>
  );
}
