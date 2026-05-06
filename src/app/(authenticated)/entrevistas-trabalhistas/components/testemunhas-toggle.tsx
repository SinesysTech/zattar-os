'use client';

import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface TestemunhasToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function TestemunhasToggle({ checked, onCheckedChange }: TestemunhasToggleProps) {
  return (
    <GlassPanel className={cn("flex items-center inline-medium inset-card-compact")}>
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className={cn("flex flex-1 items-center inline-tight")}>
        <Checkbox
          id="testemunhas"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        <Label htmlFor="testemunhas" className={cn( "cursor-pointer text-body-sm font-medium")}>
          Testemunhas foram mapeadas durante a entrevista
        </Label>
      </div>
    </GlassPanel>
  );
}
