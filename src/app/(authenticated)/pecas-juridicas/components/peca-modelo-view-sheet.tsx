'use client';

/**
 * PecaModeloViewSheet — Dialog de visualização de modelo de peça jurídica.
 * ============================================================================
 * Migrado de Sheet para Dialog (política do projeto: "Sem Sheet, usar Dialog").
 * Nome mantido por compatibilidade com consumidores.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { FileText, Pencil, Calendar, Tag, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading, Text } from '@/components/ui/typography';
import { GlassPanel } from '@/components/shared/glass-panel';

import { actionBuscarPecaModelo } from '../actions';
import { TIPO_PECA_LABELS, type PecaModeloListItem } from '../domain';

// =============================================================================
// TYPES
// =============================================================================

interface PecaModeloViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PecaModeloListItem | null;
  onEdit?: (modelo: PecaModeloListItem) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PecaModeloViewSheet({
  open,
  onOpenChange,
  modelo,
  onEdit,
}: PecaModeloViewSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [conteudoPreview, setConteudoPreview] = React.useState<string>('');

  const extractTextFromContent = React.useCallback((content: unknown[]): string => {
    if (!content) return '';

    const extractText = (node: unknown): string => {
      if (typeof node !== 'object' || node === null) return '';

      const obj = node as Record<string, unknown>;

      if (typeof obj.text === 'string') {
        return obj.text;
      }

      if (Array.isArray(obj.children)) {
        return obj.children.map(extractText).join('');
      }

      return '';
    };

    return content.map((node) => extractText(node)).join('\n\n');
  }, []);

  React.useEffect(() => {
    if (open && modelo) {
      setLoading(true);
      actionBuscarPecaModelo(modelo.id)
        .then((result) => {
          if (result.success && result.data) {
            const text = extractTextFromContent(result.data.conteudo as unknown[]);
            setConteudoPreview(text);
          }
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setConteudoPreview('');
    }
  }, [open, modelo, extractTextFromContent]);

  if (!modelo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ " max-w-2xl max-h-[90vh] inset-none flex flex-col")}>
        <DialogHeader className={cn("px-6 pt-6 pb-4 border-b border-border/30 shrink-0")}>
          <DialogTitle className={cn("flex items-center inline-tight")}>
            <Eye className="h-5 w-5" />
            Visualizar Modelo
          </DialogTitle>
          <DialogDescription>
            Detalhes do modelo de peça jurídica
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className={cn("flex flex-col stack-loose inset-dialog")}>
            {/* Cabeçalho do Modelo */}
            <div className={cn("flex flex-col stack-medium")}>
              <div className={cn("flex items-start inline-medium")}>
                <FileText className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                <div className={cn("flex flex-col stack-micro flex-1 min-w-0")}>
                  <Heading level="card">{modelo.titulo}</Heading>
                  {modelo.descricao && (
                    <p className={cn("text-body-sm text-muted-foreground")}>
                      {modelo.descricao}
                    </p>
                  )}
                </div>
              </div>

              <div className={cn("flex flex-wrap inline-tight")}>
                <AppBadge variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {TIPO_PECA_LABELS[modelo.tipoPeca] || modelo.tipoPeca}
                </AppBadge>
                <AppBadge
                  variant={modelo.visibilidade === 'publico' ? 'default' : 'outline'}
                >
                  {modelo.visibilidade === 'publico' ? 'Público' : 'Privado'}
                </AppBadge>
                <AppBadge variant="outline">
                  {modelo.usoCount} {modelo.usoCount === 1 ? 'uso' : 'usos'}
                </AppBadge>
              </div>
            </div>

            {/* Metadados */}
            <div className={cn("flex items-center inline-tight text-body-sm text-muted-foreground")}>
              <Calendar className="h-4 w-4" />
              <span>
                Criado em{' '}
                {format(new Date(modelo.createdAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>

            <Separator />

            {/* Preview do Conteúdo */}
            <div className={cn("flex flex-col stack-medium")}>
              <Text variant="label" as="h4" className="text-muted-foreground">
                Preview do Conteúdo
              </Text>

              {loading ? (
                <div className={cn("flex flex-col stack-tight")}>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : conteudoPreview ? (
                <GlassPanel depth={1} className={cn("inset-card-compact bg-muted/30")}>
                  <pre className={cn("whitespace-pre-wrap font-mono text-body-sm text-foreground/80 max-h-80 overflow-auto")}>
                    {conteudoPreview}
                  </pre>
                </GlassPanel>
              ) : (
                <p className={cn("text-body-sm text-muted-foreground italic")}>
                  Nenhum conteúdo definido
                </p>
              )}
            </div>

            {/* Botão de Edição */}
            {onEdit && (
              <div className={cn("pt-4")}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onEdit(modelo)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Modelo
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
