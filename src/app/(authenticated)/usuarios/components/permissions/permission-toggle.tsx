'use client';

import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface PermissionToggleProps {
  operacao: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  changed?: boolean; // Yellow diff dot when true
  onToggle: () => void;
}

export function PermissionToggle({ operacao: _operacao, label, checked, disabled, changed, onToggle }: PermissionToggleProps) {
  return (
    <label className={cn(
      'flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/4',
      disabled && 'opacity-50 cursor-not-allowed',
      'relative',
    )}>
      <Switch
        checked={checked}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
        aria-label={`Permitir ${label}`}
      />
      <Text variant="label" as="span" className={cn(!checked && 'text-muted-foreground/40')}>
        {label}
      </Text>
      {changed && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" />
      )}
    </label>
  );
}
