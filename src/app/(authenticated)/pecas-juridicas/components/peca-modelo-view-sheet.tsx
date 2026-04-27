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
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "glass-dialog max-w-2xl max-h-[90vh] p-0 flex flex-col")}>
        <DialogHeader className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; pt-6 padding direcional sem Inset equiv.; pb-4 padding direcional sem Inset equiv. */ "px-6 pt-6 pb-4 border-b border-border/30 shrink-0")}>
          <DialogTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <Eye className="h-5 w-5" />
            Visualizar Modelo
          </DialogTitle>
          <DialogDescription>
            Detalhes do modelo de peça jurídica
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose">; p-6 → migrar para <Inset variant="dialog"> */ "space-y-6 p-6")}>
            {/* Cabeçalho do Modelo */}
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start gap-3")}>
                <FileText className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1 flex-1 min-w-0")}>
                  <Heading level="card">{modelo.titulo}</Heading>
                  {modelo.descricao && (
                    <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>
                      {modelo.descricao}
                    </p>
                  )}
                </div>
              </div>

              <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap gap-2")}>
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
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-2 text-sm text-muted-foreground")}>
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
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              <Text variant="label" as="h4" className="text-muted-foreground">
                Preview do Conteúdo
              </Text>

              {loading ? (
                <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : conteudoPreview ? (
                <GlassPanel depth={1} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 bg-muted/30")}>
                  <pre className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "whitespace-pre-wrap font-mono text-sm text-foreground/80 max-h-80 overflow-auto")}>
                    {conteudoPreview}
                  </pre>
                </GlassPanel>
              ) : (
                <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground italic")}>
                  Nenhum conteúdo definido
                </p>
              )}
            </div>

            {/* Botão de Edição */}
            {onEdit && (
              <div className={cn(/* design-system-escape: pt-4 padding direcional sem Inset equiv. */ "pt-4")}>
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
