'use client';

import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';

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
    <div className={cn("flex items-center inline-tight-plus")}>
      <Text variant="caption" as="span" className="text-muted-foreground/40 shrink-0">Template de cargo:</Text>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn("h-8 w-56 text-caption bg-transparent")}>
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
