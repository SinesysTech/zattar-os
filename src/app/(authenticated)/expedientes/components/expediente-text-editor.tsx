'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { EditableTextCell } from '@/components/shared/data-shell';
import { actionAtualizarExpedientePayload } from '../actions';

type EditableField = 'descricaoArquivos' | 'observacoes';

interface ExpedienteTextEditorProps {
  expedienteId: number;
  field: EditableField;
  value: string | null;
  title?: string;
  placeholder?: string;
  emptyPlaceholder?: string;
  onSuccess?: () => void;
  className?: string;
  triggerClassName?: string;
}

const FIELD_LABEL: Record<EditableField, string> = {
  descricaoArquivos: 'Descrição',
  observacoes: 'Observações',
};

export function ExpedienteTextEditor({
  expedienteId,
  field,
  value,
  title,
  placeholder,
  emptyPlaceholder,
  onSuccess,
  className,
  triggerClassName,
}: ExpedienteTextEditorProps) {
  const handleSave = React.useCallback(
    async (newValue: string) => {
      const trimmed = newValue.trim();
      const payload = { [field]: trimmed === '' ? null : trimmed } as const;

      const result = await actionAtualizarExpedientePayload(expedienteId, payload);

      if (!result.success) {
        toast.error(result.message || `Erro ao atualizar ${FIELD_LABEL[field].toLowerCase()}`);
        throw new Error(result.message || 'Erro ao atualizar');
      }

      toast.success(`${FIELD_LABEL[field]} atualizado`);
      onSuccess?.();
    },
    [expedienteId, field, onSuccess],
  );

  return (
    <EditableTextCell
      value={value}
      onSave={handleSave}
      title={title || `Editar ${FIELD_LABEL[field]}`}
      placeholder={placeholder || `Adicione ${FIELD_LABEL[field].toLowerCase()}...`}
      emptyPlaceholder={emptyPlaceholder}
      className={className}
      triggerClassName={triggerClassName}
    />
  );
}
