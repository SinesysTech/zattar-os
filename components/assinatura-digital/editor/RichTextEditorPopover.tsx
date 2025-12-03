'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from './RichTextEditor';
import type { ConteudoComposto } from '@/types/assinatura-digital/template.types';

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
  } = props;
  const [localValue, setLocalValue] = useState<ConteudoComposto | undefined>(value);

  // Height estimation logic
  const estimatedHeight = useMemo(() => {
    if (!localValue?.template) return 0;
    return estimateTextHeightSimplified(localValue.template, fieldWidth, fontSize);
  }, [localValue?.template, fieldWidth, fontSize]);

  const isOverflow = estimatedHeight > fieldHeight;
  const lineCount = Math.ceil(estimatedHeight / (fontSize * 1.2));

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

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Editar {fieldName}</DialogTitle>
      </DialogHeader>

      {/* Field metadata */}
      <div className="text-sm text-muted-foreground mb-4">
        Largura: {fieldWidth}px | Altura: {fieldHeight}px | Tamanho da fonte: {fontSize}pt
      </div>

      {/* Height estimation alert */}
      {localValue?.template && (
        <Alert className={`mb-4 ${isOverflow ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}`}>
          <AlertDescription>
            {isOverflow ? (
              <>
                <strong>Atenção:</strong> O texto pode exceder a altura do campo ({lineCount} linhas estimadas).
                Considere ajustar a altura ou reduzir o conteúdo.
              </>
            ) : (
              <>
                <strong>OK:</strong> O texto cabe no campo ({lineCount} linhas estimadas).
              </>
            )}
            <br />
            <small className="text-muted-foreground">
              Estimativa com margem de erro de ±10-15%.
            </small>
          </AlertDescription>
        </Alert>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <RichTextEditor
          value={localValue}
          onChange={setLocalValue}
          formularios={formularios}
        />
      </div>

      <DialogFooter className="flex justify-between">
        <div>
          {onHeightAdjust && isOverflow && (
            <Button variant="outline" onClick={handleAutoAdjust}>
              Ajustar Altura (+{Math.ceil(estimatedHeight - fieldHeight + 14)}px)
            </Button>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

export function RichTextEditorPopover(props: RichTextEditorPopoverProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <RichTextEditorPopoverContent {...props} />}
    </Dialog>
  );
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