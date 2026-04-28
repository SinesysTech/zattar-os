"use client";

import { cn } from '@/lib/utils';
import * as React from "react";
import { Pencil, Copy, Trash2, Plus} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';

import { SegmentoCreateDialog } from "./segmento-create-dialog";

import { LoadingSpinner } from "@/components/ui/loading-state"
interface SegmentosManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onEdit: (segmento: AssinaturaDigitalSegmento) => void;
  onDuplicate: (segmento: AssinaturaDigitalSegmento) => void;
  onDelete: (segmento: AssinaturaDigitalSegmento) => void;
}

type SegmentosState = {
  segmentos: AssinaturaDigitalSegmento[];
  isLoading: boolean;
  error: string | null;
};

export function SegmentosManagerDialog({
  open,
  onOpenChange,
  onCreated,
  onEdit,
  onDuplicate,
  onDelete,
}: SegmentosManagerDialogProps) {
  const [state, setState] = React.useState<SegmentosState>({
    segmentos: [],
    isLoading: false,
    error: null,
  });
  const [createOpen, setCreateOpen] = React.useState(false);

  const fetchSegmentos = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch(`/api/assinatura-digital/segmentos`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro ao carregar segmentos");
      }
      setState({ segmentos: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setState({
        segmentos: [],
        isLoading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void fetchSegmentos();
  }, [open, fetchSegmentos]);

  const handleCreated = React.useCallback(() => {
    onCreated();
    void fetchSegmentos();
  }, [onCreated, fetchSegmentos]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          data-density="comfortable"
          className="sm:max-w-3xl glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
            <DialogTitle>Segmentos</DialogTitle>
            <DialogDescription className="sr-only">Gerencie os segmentos de assinatura digital.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
              {state.error && (
                <div className={cn(/* design-system-escape: p-3 → usar <Inset>; text-sm → migrar para <Text variant="body-sm"> */ "rounded-md bg-destructive/15 p-3 text-sm text-destructive")}>
                  {state.error}
                </div>
              )}

              {state.isLoading ? (
                <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex items-center justify-center py-10")}>
                  <LoadingSpinner className="size-6 text-muted-foreground" />
                </div>
              ) : state.segmentos.length === 0 ? (
                <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm"> */ "py-10 text-center text-sm text-muted-foreground")}>
                  Nenhum segmento encontrado.
                </div>
              ) : (
                <div className="divide-y rounded-md border">
                  {state.segmentos.map((segmento) => (
                    <div
                      key={segmento.id}
                      className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "flex items-center justify-between gap-3 p-3")}
                    >
                      <div className="min-w-0">
                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                          <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "truncate text-sm font-medium")}>
                            {segmento.nome}
                          </span>
                          <Badge variant={segmento.ativo ? "success" : "secondary"}>
                            {segmento.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {segmento.descricao ? (
                          <div className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "truncate text-xs text-muted-foreground")}>
                            {segmento.descricao}
                          </div>
                        ) : null}
                      </div>

                      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(segmento)}
                              aria-label="Editar segmento"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onDuplicate(segmento)}
                              aria-label="Duplicar segmento"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onDelete(segmento)}
                              aria-label="Deletar segmento"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Deletar</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>
          <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo segmento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SegmentoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          handleCreated();
        }}
      />
    </>
  );
}
