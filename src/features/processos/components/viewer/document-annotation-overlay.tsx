'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, StickyNote, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ViewerAnnotation {
  id: string;
  content: string;
  createdAt: string;
}

interface DocumentAnnotationOverlayProps {
  open: boolean;
  itemTitle?: string;
  itemDate?: string;
  annotations: ViewerAnnotation[];
  onAddAnnotation: (content: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function DocumentAnnotationOverlay({
  open,
  itemTitle,
  itemDate,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}: DocumentAnnotationOverlayProps) {
  const [draft, setDraft] = useState('');

  const helperText = useMemo(() => {
    if (!itemTitle) return 'Selecione um evento para registrar contexto, próximos passos ou riscos.';

    return itemDate
      ? `Anote leitura, estratégia ou pendências do evento “${itemTitle}” em ${itemDate}.`
      : `Anote leitura, estratégia ou pendências do evento “${itemTitle}”.`;
  }, [itemDate, itemTitle]);

  const formatarCriacao = (value: string) => {
    try {
      return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return value;
    }
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="pointer-events-auto absolute inset-y-4 right-4 z-20 hidden w-80 rounded-2xl border bg-background/92 shadow-xl backdrop-blur xl:flex xl:flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <StickyNote className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Anotações</p>
            <p className="text-xs text-muted-foreground">Camada de leitura sobre o documento</p>
          </div>
        </div>
      </div>

      <div className="border-b px-4 py-3">
        <div className="rounded-xl border bg-muted/35 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquareQuote className="size-3.5" />
            Evento selecionado
          </div>
          <p className="text-sm font-medium leading-5 text-foreground">{itemTitle || 'Nenhum evento selecionado'}</p>
          {itemDate && <p className="mt-1 text-xs text-muted-foreground">{itemDate}</p>}
        </div>

        <div className="mt-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Registrar observação jurídica, risco, próxima ação..."
            className="min-h-28 resize-none bg-background"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] leading-4 text-muted-foreground">{helperText}</p>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => {
                const trimmedDraft = draft.trim();
                if (!trimmedDraft) return;
                onAddAnnotation(trimmedDraft);
                setDraft('');
              }}
              disabled={!draft.trim()}
            >
              <Plus className="size-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        <div className="space-y-3 pr-2">
          {annotations.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/25 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Nenhuma anotação ainda</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Use esta coluna para manter contexto de leitura sem sair do documento.
              </p>
            </div>
          ) : (
            annotations.map((annotation, index) => (
              <article
                key={annotation.id}
                className={cn(
                  'rounded-xl border px-4 py-3 shadow-sm',
                  index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-background'
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Nota {index + 1}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatarCriacao(annotation.createdAt)}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => onDeleteAnnotation(annotation.id)}
                    aria-label="Remover anotação"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="text-sm leading-6 text-foreground">{annotation.content}</p>
              </article>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}