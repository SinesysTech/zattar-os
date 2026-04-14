'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RolePresetSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const ROLE_PRESETS: Record<string, { label: string; description: string }> = {
  none: { label: '— Selecionar preset —', description: '' },
  advogado: { label: 'Advogado (padrão)', description: 'Acesso completo a processos, audiências e expedientes' },
  estagiario: { label: 'Estagiário (restrito)', description: 'Visualização e criação, sem deletar' },
  secretaria: { label: 'Secretária (operacional)', description: 'Gestão de agenda, partes e expedientes' },
  administrador: { label: 'Administrador (full)', description: 'Acesso total a todos os módulos' },
};

export function RolePresetSelect({ value, onValueChange, disabled }: RolePresetSelectProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">Template de cargo:</span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-8 w-56 text-xs bg-transparent">
          <SelectValue placeholder="Selecionar preset..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
            <SelectItem key={key} value={key}>{preset.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
