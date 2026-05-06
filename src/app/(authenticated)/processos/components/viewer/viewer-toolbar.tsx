'use client';

/**
 * ViewerToolbar
 *
 * Barra de ações flutuante do visualizador de documentos.
 * Aparece como overlay no canto superior direito da área do viewer,
 * mantendo a área de visualização limpa (conforme protótipo 1.html).
 */

import { cn } from '@/lib/utils';
import {
  Info,
  ExternalLink,
  Download,
  StickyNote,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
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
  isReadingFocused: boolean;
  onOpenSearch: () => void;
  onOpenExternal: () => void;
  onDownload: () => void;
  onOpenDetails: () => void;
  onToggleAnnotations: () => void;
  onToggleReadingFocus: () => void;
}

export function ViewerToolbar({
  title,
  date,
  isDocumento,
  hasBackblaze,
  isLoading,
  annotationCount,
  annotationsOpen,
  isReadingFocused,
  onOpenSearch,
  onOpenExternal,
  onDownload,
  onOpenDetails,
  onToggleAnnotations,
  onToggleReadingFocus,
}: ViewerToolbarProps) {
  const actionsDisabled = isLoading || !hasBackblaze;

  return (
    <div className={cn("absolute top-3 left-3 right-3 z-10 flex items-center inline-tight pointer-events-none")}>
      {/* Título do documento atual */}
      {title && (
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "pointer-events-auto flex items-center inline-tight rounded-full bg-card/90 backdrop-blur-sm border shadow-sm px-3 py-1.5 min-w-0 max-w-xs lg:max-w-sm")}>
          <Text variant="caption" className="truncate font-medium text-foreground">{title}</Text>
          {date && (
            <>
              <span className="text-muted-foreground/50 shrink-0" aria-hidden="true">&middot;</span>
              <Text variant="caption" as="span" className="text-muted-foreground whitespace-nowrap shrink-0">{date}</Text>
            </>
          )}
        </div>
      )}

      {/* Ações */}
      <TooltipProvider>
        <div className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "pointer-events-auto flex items-center inline-micro rounded-full bg-card/90 backdrop-blur-sm border shadow-sm px-1 py-0.5 ml-auto shrink-0")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={onOpenSearch}
                aria-label="Buscar na timeline"
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar na timeline</TooltipContent>
          </Tooltip>

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
                  <span className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground")}>
                    {annotationCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {annotationsOpen ? 'Ocultar anotações' : 'Exibir anotações'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={onToggleReadingFocus}
                aria-label="Alternar leitura focada"
              >
                {isReadingFocused ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadingFocused ? 'Sair da leitura focada' : 'Leitura focada'}
            </TooltipContent>
          </Tooltip>

          {isDocumento && (
            <>
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
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
