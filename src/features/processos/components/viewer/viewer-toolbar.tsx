'use client';

/**
 * ViewerToolbar
 *
 * Barra de ações flutuante do visualizador de documentos.
 * Aparece como overlay no canto superior direito da área do viewer,
 * mantendo a área de visualização limpa (conforme protótipo 1.html).
 */

import { Info, ExternalLink, Download, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewerToolbarProps {
  title: string;
  date?: string;
  isDocumento: boolean;
  hasBackblaze: boolean;
  isLoading: boolean;
  annotationCount: number;
  annotationsOpen: boolean;
  onOpenExternal: () => void;
  onDownload: () => void;
  onOpenDetails: () => void;
  onToggleAnnotations: () => void;
}

export function ViewerToolbar({
  title: _title,
  date: _date,
  isDocumento,
  hasBackblaze,
  isLoading,
  annotationCount,
  annotationsOpen,
  onOpenExternal,
  onDownload,
  onOpenDetails,
  onToggleAnnotations,
}: ViewerToolbarProps) {
  const actionsDisabled = isLoading || !hasBackblaze;

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm border shadow-sm px-1 py-0.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={onOpenDetails}
              aria-label="Ver detalhes do evento"
            >
              <Info className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Detalhes do evento</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={annotationsOpen ? 'secondary' : 'ghost'}
              size="icon"
              className="relative size-8 rounded-full"
              onClick={onToggleAnnotations}
              aria-label="Alternar anotações"
            >
              <StickyNote className="size-4" />
              {annotationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {annotationCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {annotationsOpen ? 'Ocultar anotações' : 'Exibir anotações'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isDocumento && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={onOpenExternal}
                  disabled={actionsDisabled}
                  aria-label="Abrir em nova aba"
                >
                  <ExternalLink className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir em nova aba</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={onDownload}
                  disabled={actionsDisabled}
                  aria-label="Baixar documento"
                >
                  <Download className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
