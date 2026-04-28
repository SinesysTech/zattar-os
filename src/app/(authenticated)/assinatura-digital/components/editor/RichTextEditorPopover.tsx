'use client';

import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Check, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { RichTextEditor } from './RichTextEditor';
import type { ConteudoComposto } from '@/shared/assinatura-digital/types/template.types';

interface RichTextEditorPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: ConteudoComposto;
  onChange: (value: ConteudoComposto) => void;
  fieldName: string;
  formularios: string[];
  fieldWidth?: number;
  fieldHeight?: number;
  fontSize?: number;
  onHeightAdjust?: (newHeight: number) => void;
}

function RichTextEditorPopoverContent(props: RichTextEditorPopoverProps) {
  const {
    value,
    onChange,
    fieldName,
    formularios,
    fieldWidth = 400,
    fieldHeight = 80,
    fontSize = 12,
    onHeightAdjust,
    onOpenChange,
    open,
  } = props;
  const [localValue, setLocalValue] = useState<ConteudoComposto | undefined>(value);

  // Height estimation logic
  const estimatedHeight = localValue?.template
    ? estimateTextHeightSimplified(localValue.template, fieldWidth, fontSize)
    : 0;

  const isOverflow = estimatedHeight > fieldHeight;
  const lineCount = Math.ceil(estimatedHeight / (fontSize * 1.2));
  const heightDiff = Math.ceil(estimatedHeight - fieldHeight + 14);

  const handleSave = () => {
    if (localValue) {
      onChange(localValue);
    }
    onOpenChange(false);
  };

  const handleAutoAdjust = () => {
    if (onHeightAdjust && estimatedHeight > 0) {
      const newHeight = estimatedHeight + 14; // +14px margin
      onHeightAdjust(newHeight);
    }
  };

  // Botão de ajustar altura para a toolbar do editor
  const toolbarHeightAction = onHeightAdjust && isOverflow ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAutoAdjust}
      className={cn(/* design-system-escape: gap-1.5 gap sem token DS; text-xs → migrar para <Text variant="caption"> */ "gap-1.5 text-xs")}
    >
      <ArrowUpDown className="h-3.5 w-3.5" />
      Ajustar Altura (+{heightDiff}px)
    </Button>
  ) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-5xl glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>{`Editar ${fieldName}`}</DialogTitle>
          <DialogDescription>{`Largura: ${fieldWidth}px · Altura: ${fieldHeight}px · Fonte: ${fontSize}pt`}</DialogDescription>
        </DialogHeader>
        <DialogBody className="overflow-hidden flex flex-col">
          {/* Alerta de overflow — fica fixo acima do editor */}
          {localValue?.template && (
            <div className="shrink-0 mb-3">
              <Alert
                variant={isOverflow ? 'destructive' : 'default'}
                className={
                  isOverflow
                    ? 'border-warning/15 bg-warning/10 text-warning [&>svg]:text-warning'
                    : 'border-success/50 bg-success/10 text-success [&>svg]:text-success'
                }
              >
                {isOverflow ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertDescription>
                  {isOverflow ? (
                    <>
                      O texto pode exceder a altura do campo ({lineCount} linhas estimadas).
                      Considere ajustar a altura ou reduzir o conteúdo.
                    </>
                  ) : (
                    <>O texto cabe no campo ({lineCount} linhas estimadas).</>
                  )}
                  <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "ml-1 text-muted-foreground text-xs")}>
                    Margem de erro: ±10-15%.
                  </span>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Editor — preenche o espaço restante com scroll interno */}
          <RichTextEditor
            className="flex-1 min-h-0"
            value={localValue}
            onChange={setLocalValue}
            formularios={formularios}
            toolbarExtra={toolbarHeightAction}
          />
        </DialogBody>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RichTextEditorPopover(props: RichTextEditorPopoverProps) {
  const { open } = props;
  if (!open) return null;
  return <RichTextEditorPopoverContent {...props} />;
}

// Simplified height estimation function
// Aligned with backend logic: lineHeight = fontSize * 1.2, avgCharWidth = fontSize * 0.55
function estimateTextHeightSimplified(text: string, fieldWidth: number, fontSize: number): number {
  const lineHeight = fontSize * 1.2;
  const avgCharWidth = fontSize * 0.55;

  // Count lines based on text wrapping
  const charsPerLine = Math.floor(fieldWidth / avgCharWidth);
  const lines = text.split('\n').reduce((totalLines, paragraph) => {
    if (paragraph.length === 0) return totalLines + 1;
    return totalLines + Math.ceil(paragraph.length / charsPerLine);
  }, 0);

  return lines * lineHeight;
}
